import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CollapseIcon,
  ExpandIcon,
  RefreshIcon,
  TargetIcon
} from '../ui/icons'
import type { ApiRequestSpec, HookTiming } from '../../../../shared/types'
import {
  NETWORK_HOOK_SCRIPT,
  NETWORK_PREFIX,
  PICKER_DISABLE_SCRIPT,
  PICKER_ENABLE_SCRIPT,
  PICKER_PREFIX,
  buildActionScript,
  type NetworkBridgePayload,
  type PickedPayload,
  type StepResult
} from './elementPicker'
import { ElementActionMenu, type ActionDef } from './ElementActionMenu'
import type { ScenarioStepInput } from './ScenarioPanel'
import styles from './LiveBrowserPane.module.css'

// Electron <webview> 태그의 런타임 메서드. webviewTag가 비활성인 환경에서는
// 메서드가 존재하지 않으므로 전부 optional로 선언하고 호출부에서 ?.()를 쓴다
type WebviewTag = HTMLElement & {
  src: string
  goBack?: () => void
  goForward?: () => void
  reload?: () => void
  executeJavaScript?: (code: string) => Promise<unknown>
  getURL?: () => string
  isLoading?: () => boolean
}

const IS_ELECTRON = navigator.userAgent.includes('Electron')

export type ConsoleLevel = 'log' | 'warn' | 'error'

export type ConsoleMessagePayload = {
  level: ConsoleLevel
  message: string
}

export type NetworkEventPayload = {
  method: string
  url: string
  status: number | null
  failed: boolean
}

// Electron webview console-message의 level은 버전에 따라 숫자(0~3) 또는 문자열로 온다
function mapConsoleLevel(raw: unknown): ConsoleLevel {
  if (raw === 3 || raw === 'error') return 'error'
  if (raw === 2 || raw === 'warning' || raw === 'warn') return 'warn'
  return 'log'
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed === 'about:blank' || /^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// webview는 DOM에 붙고 첫 dom-ready가 발생하기 전에는 getURL/loadURL 등 모든 메서드가
// 예외를 던진다. 대시보드 진입 직후 재생이 시작되는 경우를 위해 준비될 때까지 폴링한다
async function waitForWebviewReady(webview: WebviewTag, timeoutMs: number): Promise<boolean> {
  const start = Date.now()
  for (;;) {
    try {
      webview.getURL?.()
      return true
    } catch {
      // 아직 attach/초기화 전
    }
    if (Date.now() - start > timeoutMs) return false
    await sleep(100)
  }
}

// navigateTo(targetUrl) 직후, 대상 문서가 실제로 로드될 때까지 기다린다.
// 대시보드 진입 직후에는 about:blank의 dom-ready가 곧바로 도착하므로,
// "about:blank가 아닌 문서"의 로드 완료만 인정하고 타임아웃 폴백을 둔다
function waitForPageLoad(webview: WebviewTag, targetUrl: string, timeoutMs: number): Promise<void> {
  // 이미 해당 페이지가 로드되어 있으면 기다릴 것이 없다
  try {
    if (webview.getURL?.() === targetUrl && webview.isLoading?.() === false) return Promise.resolve()
  } catch {
    // webview 초기화 전 — 아래에서 이벤트/타임아웃으로 기다린다
  }

  return new Promise((resolve) => {
    let done = false
    function finish(): void {
      if (done) return
      done = true
      webview.removeEventListener('did-stop-loading', onStop)
      webview.removeEventListener('dom-ready', onStop)
      clearTimeout(timer)
      resolve()
    }
    function onStop(): void {
      try {
        const url = webview.getURL?.() ?? ''
        if (url && url !== 'about:blank') finish()
      } catch {
        // webview 초기화 전 — 다음 이벤트나 타임아웃을 기다린다
      }
    }
    webview.addEventListener('did-stop-loading', onStop)
    webview.addEventListener('dom-ready', onStop)
    const timer = setTimeout(finish, timeoutMs)
  })
}

export type PlaybackStep = {
  stepId: number
  actionType: string
  selector: string
  value?: string
  // 실행 로그에 표시할 스텝 이름 (예: "클릭 — a \\"Learn more\\"")
  label: string
  // actionType이 'api-request'일 때만 채워진다
  request?: ApiRequestSpec
}

// 하나의 테스트 케이스에 해당하는 재생 단위. 여러 케이스를 넘기면 순서대로 이어서 실행된다
export type PlaybackCase = {
  caseId: string
  name: string
  startUrl?: string
  steps: PlaybackStep[]
}

// 타이밍별로 묶인, 이번 재생에 함께 실행할 훅들. 각 훅은 케이스와 동일한 구조(PlaybackCase)로 표현된다
export type PlaybackHookGroup = {
  beforeAll: PlaybackCase[]
  beforeEach: PlaybackCase[]
  afterEach: PlaybackCase[]
  afterAll: PlaybackCase[]
  onFailure: PlaybackCase[]
}

export type PlaybackRequest = {
  token: number
  cases: PlaybackCase[]
  hooks?: PlaybackHookGroup
}

// 재생 진행 상황을 부모(DashboardView)로 알리는 이벤트.
// 부모는 이걸로 케이스 상태(대기/실행/성공/실패)와 실행 로그를 만든다
export type PlaybackEvent =
  | { kind: 'case-start'; caseId: string }
  | { kind: 'step-result'; caseId: string; stepId: number; label: string; result: StepResult }
  | { kind: 'case-end'; caseId: string; passed: boolean; failMessage: string | null; durationMs: number }
  // caseId는 beforeEach/afterEach/onFailure처럼 특정 케이스에 붙어 실행될 때만 채워진다
  | { kind: 'hook-start'; hookId: string; name: string; timing: HookTiming; caseId: string | null }
  | {
      kind: 'hook-end'
      hookId: string
      name: string
      timing: HookTiming
      caseId: string | null
      passed: boolean
      failMessage: string | null
      durationMs: number
    }

export function LiveBrowserPane({
  onConsoleMessage,
  onNetworkEvent,
  recording,
  defaultSelectMode,
  onRecordStep,
  onStepResult,
  playbackRequest,
  onPlaybackEvent,
  onPlaybackComplete
}: {
  onConsoleMessage?: (payload: ConsoleMessagePayload) => void
  onNetworkEvent?: (payload: NetworkEventPayload) => void
  // true면 요소 선택(기록) 기능을 노출한다 — 테스트 케이스 기록 화면에서 사용
  recording?: boolean
  // 기록 화면에서 열리자마자 요소 선택 모드로 시작할지
  defaultSelectMode?: boolean
  onRecordStep?: (step: ScenarioStepInput) => number
  onStepResult?: (stepId: number, result: StepResult) => void
  playbackRequest?: PlaybackRequest | null
  onPlaybackEvent?: (event: PlaybackEvent) => void
  onPlaybackComplete?: (token: number) => void
}): JSX.Element {
  const webviewRef = useRef<WebviewTag | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState('about:blank')
  const [urlInput, setUrlInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [selectMode, setSelectMode] = useState(!!(recording && defaultSelectMode))
  const selectModeRef = useRef(!!(recording && defaultSelectMode))
  const [picked, setPicked] = useState<{ payload: PickedPayload; left: number; top: number } | null>(null)
  // iframe 폴백에서 뒤로/앞으로 가기를 지원하기 위한 자체 히스토리 (Electron에서는 webview 네이티브 히스토리 사용)
  const historyRef = useRef<{ stack: string[]; index: number }>({ stack: [], index: -1 })

  function navigateTo(raw: string): void {
    const url = normalizeUrl(raw)
    if (!url) return
    setUrlInput(url === 'about:blank' ? '' : url)
    setSrc(url)
    // React state를 통한 src prop 갱신은 배치 처리 시점에 따라 지연될 수 있어,
    // 특히 useEffect 안에서 연쇄적으로 호출되는 자동 재생 경로에서는 실제 네비게이션이
    // 누락되는 사례가 있었다. webview에는 항상 즉시 반영되도록 명령형으로도 반영한다
    if (IS_ELECTRON && webviewRef.current && webviewRef.current.src !== url) {
      try {
        webviewRef.current.src = url
      } catch {
        // webview 초기화 전에는 src 설정이 예외를 던진다 — React의 src prop 갱신에 맡긴다
      }
    }
    if (!IS_ELECTRON) {
      const history = historyRef.current
      history.stack = [...history.stack.slice(0, history.index + 1), url]
      history.index = history.stack.length - 1
    }
  }

  // 구독 해제/재구독 없이 항상 최신 콜백을 부르기 위해 ref로 보관
  const consoleCbRef = useRef(onConsoleMessage)
  consoleCbRef.current = onConsoleMessage
  const networkCbRef = useRef(onNetworkEvent)
  networkCbRef.current = onNetworkEvent

  function showActionMenu(payload: PickedPayload): void {
    const viewportRect = viewportRef.current?.getBoundingClientRect()
    // 메뉴가 뷰포트 밖으로 잘리지 않도록 우클릭 좌표를 클램프
    const MENU_WIDTH = 220
    const MENU_MAX_HEIGHT = 340
    const maxLeft = Math.max(8, (viewportRect?.width ?? MENU_WIDTH) - MENU_WIDTH - 8)
    const maxTop = Math.max(8, (viewportRect?.height ?? MENU_MAX_HEIGHT) - MENU_MAX_HEIGHT - 8)
    setPicked({
      payload,
      left: Math.min(Math.max(8, payload.x), maxLeft),
      top: Math.min(Math.max(8, payload.y), maxTop)
    })
  }

  const showActionMenuRef = useRef(showActionMenu)
  showActionMenuRef.current = showActionMenu

  // 페이지 안에서 링크 클릭 등으로 이동하면 주소창을 따라 갱신하고,
  // 콘솔 메시지/페이지 이동/로드 실패를 데브툴 탭으로 전달한다 (Electron 전용)
  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    function handleNavigate(event: Event): void {
      const url = (event as Event & { url?: string }).url
      if (!url) return
      setUrlInput(url === 'about:blank' ? '' : url)
      if (url !== 'about:blank') {
        networkCbRef.current?.({ method: 'GET', url, status: null, failed: false })
      }
    }

    function handleFailLoad(event: Event): void {
      const detail = event as Event & {
        errorCode?: number
        errorDescription?: string
        validatedURL?: string
        isMainFrame?: boolean
      }
      // -3(ERR_ABORTED)은 리다이렉트 등으로 흔히 발생하는 정상 취소라 무시
      if (detail.isMainFrame === false || detail.errorCode === -3) return
      if (!detail.validatedURL) return
      networkCbRef.current?.({ method: 'GET', url: detail.validatedURL, status: null, failed: true })
      consoleCbRef.current?.({
        level: 'error',
        message: `페이지 로드 실패: ${detail.validatedURL} (${detail.errorDescription ?? detail.errorCode})`
      })
    }

    function handleConsoleMessage(event: Event): void {
      const detail = event as Event & { level?: unknown; message?: string }
      const message = detail.message ?? ''
      // 요소 선택 스크립트가 보내는 브리지 메시지는 콘솔 탭 대신 액션 메뉴로 라우팅
      if (message.startsWith(PICKER_PREFIX)) {
        try {
          const payload = JSON.parse(message.slice(PICKER_PREFIX.length)) as PickedPayload
          if (payload.kind === 'picked') showActionMenuRef.current(payload)
        } catch {
          // 형식이 깨진 브리지 메시지는 무시
        }
        return
      }
      // 네트워크 훅이 보내는 fetch/XHR 결과는 네트워크 탭으로 라우팅
      if (message.startsWith(NETWORK_PREFIX)) {
        try {
          const payload = JSON.parse(message.slice(NETWORK_PREFIX.length)) as NetworkBridgePayload
          if (typeof payload.method === 'string' && typeof payload.url === 'string') {
            networkCbRef.current?.({
              method: payload.method,
              url: payload.url,
              status: typeof payload.status === 'number' ? payload.status : null,
              failed: !!payload.failed
            })
          }
        } catch {
          // 형식이 깨진 브리지 메시지는 무시
        }
        return
      }
      // 게스트 페이지가 dev 환경 경고를 찍는 경우가 있어 콘솔 탭에서는 걸러낸다
      if (message.includes('Electron Security Warning')) return
      consoleCbRef.current?.({ level: mapConsoleLevel(detail.level), message })
    }

    function handleDomReady(): void {
      // 실제 페이지의 fetch/XHR을 네트워크 탭으로 흘려보내는 훅은 문서마다 항상 주입
      void (webview as WebviewTag).executeJavaScript?.(NETWORK_HOOK_SCRIPT)?.catch(() => {})
      // 선택 모드 중 페이지가 이동하면 새 문서에 피커를 다시 주입한다
      if (selectModeRef.current) {
        void (webview as WebviewTag).executeJavaScript?.(PICKER_ENABLE_SCRIPT)?.catch(() => {})
      }
    }

    webview.addEventListener('did-navigate', handleNavigate)
    webview.addEventListener('did-navigate-in-page', handleNavigate)
    webview.addEventListener('did-fail-load', handleFailLoad)
    webview.addEventListener('console-message', handleConsoleMessage)
    webview.addEventListener('dom-ready', handleDomReady)
    return () => {
      webview.removeEventListener('did-navigate', handleNavigate)
      webview.removeEventListener('did-navigate-in-page', handleNavigate)
      webview.removeEventListener('did-fail-load', handleFailLoad)
      webview.removeEventListener('console-message', handleConsoleMessage)
      webview.removeEventListener('dom-ready', handleDomReady)
    }
  }, [])

  const onPlaybackEventRef = useRef(onPlaybackEvent)
  onPlaybackEventRef.current = onPlaybackEvent
  const onPlaybackCompleteRef = useRef(onPlaybackComplete)
  onPlaybackCompleteRef.current = onPlaybackComplete
  const playbackTokenRef = useRef(0)

  // 저장된 테스트 케이스(들)의 자동화 스텝을 실제 브라우저에서 케이스 순서대로 재생한다.
  // playbackRequest는 "새로운 재생 요청이 왔을 때만" 참조가 바뀌도록 부모(DashboardView)에서 관리한다
  useEffect(() => {
    if (!playbackRequest) {
      // 부모가 요청을 거두면(사용자 중지 등) 진행 중이던 재생 루프를 즉시 무효화한다
      playbackTokenRef.current += 1
      return
    }
    const webview = webviewRef.current
    if (!webview) return
    playbackTokenRef.current = playbackRequest.token

    async function runStep(step: PlaybackStep): Promise<StepResult> {
      if (step.actionType === 'api-request') {
        if (!step.request) return { ok: false, error: 'API 요청 정보가 없습니다' }
        const result = await window.api.http.request(step.request)
        // API 응답도 다른 네트워크 활동과 함께 네트워크 탭에서 확인할 수 있도록 전달
        networkCbRef.current?.({
          method: step.request.method,
          url: step.request.url,
          status: result.status,
          failed: !result.ok
        })
        if (result.error) return { ok: false, error: result.error }
        const pass =
          step.request.expectedStatus !== undefined
            ? result.status === step.request.expectedStatus
            : result.status !== null && result.status < 400
        return { ok: pass, error: pass ? undefined : `status ${result.status ?? 'ERR'}` }
      }
      if (step.actionType === 'goto') {
        if (!step.value) return { ok: false, error: '이동할 주소가 없습니다' }
        const target = normalizeUrl(step.value)
        if (!target) return { ok: false, error: '이동할 주소가 올바르지 않습니다' }
        navigateTo(target)
        await waitForPageLoad(webview as WebviewTag, target, 8000)
        return { ok: true }
      }
      let raw: unknown = null
      try {
        // executeJavaScript는 webview 준비 전이면 동기로 예외를 던진다
        const executionPromise = (webview as WebviewTag).executeJavaScript?.(
          buildActionScript(step.actionType, step.selector, step.value)
        )
        raw = executionPromise ? await executionPromise.catch(() => null) : null
      } catch {
        raw = null
      }
      if (raw === null || raw === undefined) {
        // 스텝이 페이지 이동을 일으켜 응답이 유실된 경우 — 동작 자체는 디스패치됐으므로 성공으로 본다
        return { ok: true }
      }
      try {
        return JSON.parse(String(raw)) as StepResult
      } catch {
        return { ok: true }
      }
    }

    // 시작 URL로 이동 후 스텝을 순서대로 실행한다. 케이스와 훅 재생 모두 이 로직을 공유한다.
    // onStep이 주어지면(실제 케이스 재생) 스텝마다 step-result 이벤트를 내보낸다 — 훅은 시나리오
    // 패널에 표시되는 케이스가 아니므로 훅 재생 시에는 onStep을 생략한다
    async function runSteps(
      startUrl: string | undefined,
      steps: PlaybackStep[],
      token: number,
      onStep?: (step: PlaybackStep, result: StepResult) => void
    ): Promise<string | null> {
      let failMessage: string | null = null
      try {
        const target = startUrl ? normalizeUrl(startUrl) : null
        if (target) {
          navigateTo(target)
          await waitForPageLoad(webview as WebviewTag, target, 8000)
        }
        await sleep(400)

        for (const step of steps) {
          if (playbackTokenRef.current !== token) return null
          await sleep(500)
          if (playbackTokenRef.current !== token) return null

          const result = await runStep(step)
          if (playbackTokenRef.current !== token) return null
          onStep?.(step, result)

          if (!result.ok) {
            failMessage = `${step.label} — ${result.error ?? '실행 실패'}`
            break
          }
          // 클릭 등으로 트리거된 페이지 이동이 안정되도록 다음 스텝 전 잠시 대기
          await sleep(400)
        }
      } catch (error) {
        // 예기치 못한 예외로 케이스/훅 하나가 죽어도 나머지는 계속 실행한다
        failMessage = `실행 오류 — ${String((error as Error)?.message ?? error)}`
      }
      return failMessage
    }

    async function run(): Promise<void> {
      const request = playbackRequest as PlaybackRequest
      const token = request.token
      const emit = (event: PlaybackEvent): void => onPlaybackEventRef.current?.(event)
      const hookGroups = request.hooks

      // 대시보드 진입 직후에는 webview가 아직 초기화 전일 수 있다
      await waitForWebviewReady(webview as WebviewTag, 5000)
      if (playbackTokenRef.current !== token) return

      // caseId가 주어지면 그 케이스 앞뒤(beforeEach/afterEach/onFailure)에 붙어 실행되는 훅,
      // null이면 전체 재생 앞뒤(beforeAll/afterAll)에 한 번만 실행되는 훅이다
      async function runHookGroup(hooks: PlaybackCase[] | undefined, timing: HookTiming, caseId: string | null): Promise<void> {
        if (!hooks || hooks.length === 0) return
        for (const hook of hooks) {
          if (playbackTokenRef.current !== token) return
          emit({ kind: 'hook-start', hookId: hook.caseId, name: hook.name, timing, caseId })
          const startedAt = Date.now()
          const failMessage = await runSteps(hook.startUrl, hook.steps, token)
          if (playbackTokenRef.current !== token) return
          emit({
            kind: 'hook-end',
            hookId: hook.caseId,
            name: hook.name,
            timing,
            caseId,
            passed: !failMessage,
            failMessage,
            durationMs: Date.now() - startedAt
          })
        }
      }

      await runHookGroup(hookGroups?.beforeAll, 'beforeAll', null)
      if (playbackTokenRef.current !== token) return

      for (const playbackCase of request.cases) {
        if (playbackTokenRef.current !== token) return

        await runHookGroup(hookGroups?.beforeEach, 'beforeEach', playbackCase.caseId)
        if (playbackTokenRef.current !== token) return

        emit({ kind: 'case-start', caseId: playbackCase.caseId })
        const startedAt = Date.now()
        const failMessage = await runSteps(playbackCase.startUrl, playbackCase.steps, token, (step, result) =>
          emit({ kind: 'step-result', caseId: playbackCase.caseId, stepId: step.stepId, label: step.label, result })
        )
        if (playbackTokenRef.current !== token) return
        emit({
          kind: 'case-end',
          caseId: playbackCase.caseId,
          passed: !failMessage,
          failMessage,
          durationMs: Date.now() - startedAt
        })

        if (failMessage) await runHookGroup(hookGroups?.onFailure, 'onFailure', playbackCase.caseId)
        if (playbackTokenRef.current !== token) return
        await runHookGroup(hookGroups?.afterEach, 'afterEach', playbackCase.caseId)
        if (playbackTokenRef.current !== token) return
      }

      await runHookGroup(hookGroups?.afterAll, 'afterAll', null)

      if (playbackTokenRef.current === token) onPlaybackCompleteRef.current?.(token)
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRequest])

  function goBack(): void {
    if (IS_ELECTRON) {
      webviewRef.current?.goBack?.()
      return
    }
    const history = historyRef.current
    if (history.index <= 0) return
    history.index -= 1
    const url = history.stack[history.index]
    setSrc(url)
    setUrlInput(url === 'about:blank' ? '' : url)
  }

  function goForward(): void {
    if (IS_ELECTRON) {
      webviewRef.current?.goForward?.()
      return
    }
    const history = historyRef.current
    if (history.index >= history.stack.length - 1) return
    history.index += 1
    const url = history.stack[history.index]
    setSrc(url)
    setUrlInput(url === 'about:blank' ? '' : url)
  }

  function reload(): void {
    if (IS_ELECTRON) {
      webviewRef.current?.reload?.()
      return
    }
    const iframe = iframeRef.current
    if (iframe) iframe.src = src
  }

  function toggleSelectMode(): void {
    const next = !selectModeRef.current
    selectModeRef.current = next
    setSelectMode(next)
    setPicked(null)
    void webviewRef.current
      ?.executeJavaScript?.(next ? PICKER_ENABLE_SCRIPT : PICKER_DISABLE_SCRIPT)
      ?.catch(() => {})
  }

  function handleActionSelect(action: ActionDef, value?: string): void {
    if (!picked) return
    const element = picked.payload.element
    const stepId = onRecordStep?.({
      actionType: action.type,
      actionLabel: action.label,
      selector: element.selector,
      value,
      targetLabel: `${element.tag}${element.text ? ` "${element.text}"` : ''}`,
      pageUrl: src
    })
    setPicked(null)

    // 등록한 스텝을 게스트 페이지에서 실제로 실행하고 결과를 스텝에 반영한다.
    // 클릭으로 페이지가 이동해도 dom-ready에서 피커가 재주입되어 이어서 기록할 수 있다
    const execution = webviewRef.current?.executeJavaScript?.(
      buildActionScript(action.type, element.selector, value)
    )
    if (stepId === undefined || !execution) return
    execution
      .then((raw) => {
        const result = JSON.parse(String(raw)) as StepResult
        onStepResult?.(stepId, result)
      })
      .catch(() => {
        // 페이지 이동으로 결과가 유실된 경우 — 실행은 됐으므로 결과 표시만 생략
      })
  }

  return (
    <section className={`${styles.pane} ${expanded ? styles.expanded : ''} bg-raised border-line`}>
      <div className={`${styles.toolbar} border-line`}>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="뒤로" onClick={goBack}>
          <ChevronLeftIcon />
        </button>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="앞으로" onClick={goForward}>
          <ChevronRightIcon />
        </button>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="새로고침" onClick={reload}>
          <RefreshIcon />
        </button>
        <form
          className={styles.urlForm}
          onSubmit={(event) => {
            event.preventDefault()
            const url = normalizeUrl(urlInput)
            navigateTo(urlInput)
            // 요소 선택(기록) 모드에서는 주소 입력 자체도 "페이지 이동" 스텝으로 기록해서
            // 특정 페이지에서 시작해야 하는 시나리오를 처음부터 재현할 수 있게 한다
            if (url && url !== 'about:blank' && selectModeRef.current && onRecordStep) {
              const stepId = onRecordStep({
                actionType: 'goto',
                actionLabel: '페이지 이동',
                selector: '',
                value: url,
                targetLabel: url,
                pageUrl: url
              })
              onStepResult?.(stepId, { ok: true })
            }
          }}
        >
          <input
            className={`${styles.urlBar} bg-canvas text-ivory-dim`}
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="주소 입력 후 Enter (예: example.com)"
            spellCheck={false}
          />
        </form>
        {recording && (
          <button
            type="button"
            className={`icon-btn ${selectMode ? styles.toolActive : 'text-ivory-dim'}`}
            aria-label={selectMode ? '요소 선택 모드 끄기' : '요소 선택 모드'}
            title="요소 선택 모드 — 페이지 요소를 클릭/우클릭해 시나리오 스텝을 추가합니다"
            onClick={toggleSelectMode}
            disabled={!!playbackRequest}
          >
            <TargetIcon />
          </button>
        )}
        <button
          type="button"
          className="icon-btn text-ivory-dim"
          aria-label={expanded ? '브라우저 축소' : '브라우저 확대'}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>
        {playbackRequest && <span className={styles.liveBadge}>● 재생 중</span>}
      </div>

      <div ref={viewportRef} className={`${styles.viewport} bg-canvas`}>
        {IS_ELECTRON ? (
          <webview
            ref={(el) => {
              webviewRef.current = el as WebviewTag | null
            }}
            className={styles.webFrame}
            src={src}
          />
        ) : (
          <iframe ref={iframeRef} className={styles.webFrame} src={src} title="브라우저" />
        )}

        {src === 'about:blank' && !playbackRequest && (
          <p className={`${styles.placeholder} text-ivory-faint`}>
            {recording
              ? '주소를 입력해 페이지를 열고, 요소를 클릭/우클릭해 스텝을 기록하세요.'
              : '테스트 케이스를 실행하면 이 영역에서 브라우저가 열립니다.'}
          </p>
        )}

        {picked && (
          <ElementActionMenu
            element={picked.payload.element}
            position={{ left: picked.left, top: picked.top }}
            onSelect={handleActionSelect}
            onClose={() => setPicked(null)}
          />
        )}
      </div>
    </section>
  )
}
