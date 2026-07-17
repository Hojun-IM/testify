import { useEffect, useRef, useState } from 'react'
import type { Hook, HookTiming, TestCase, TestRunStatus } from '../../../../shared/types'
import { Button } from '../ui/Button'
import { PlayIcon } from '../ui/icons'
import { RunStatsRow } from './RunStatsRow'
import {
  LiveBrowserPane,
  type ConsoleMessagePayload,
  type NetworkEventPayload,
  type PlaybackCase,
  type PlaybackEvent,
  type PlaybackHookGroup,
  type PlaybackRequest
} from './LiveBrowserPane'
import { CaseResultsPanel, type ResultFilter } from './CaseResultsPanel'
import { RunLogPane, type ConsoleEntry, type NetworkEntry } from './RunLogPane'
import { ScenarioPanel, type ScenarioStep } from './ScenarioPanel'
import { formatLogTime, type LogLevel, type RunCase, type RunLogEntry } from './runTypes'
import styles from './DashboardView.module.css'

const MAX_DEVTOOL_ENTRIES = 400

const HOOK_TIMING_LABELS: Record<HookTiming, string> = {
  beforeAll: '전체 시작 전',
  beforeEach: '케이스 시작 전',
  afterEach: '케이스 종료 후',
  afterAll: '전체 종료 후',
  onFailure: '실패 시'
}

// 대시보드는 테스트 케이스 실행(재생)을 지켜보고 결과를 확인하는 화면이다.
// 케이스 기록/등록은 테스트 케이스 목록의 생성 패널(브라우저 기록)에서 한다
export function DashboardView({
  sidebarCollapsed,
  autoPlayCases,
  onAutoPlayConsumed
}: {
  sidebarCollapsed?: boolean
  // 테스트 케이스 목록의 "실행"(단건/일괄)에서 넘어온, 재생할 케이스들
  autoPlayCases?: TestCase[] | null
  onAutoPlayConsumed?: () => void
}): JSX.Element {
  const [resultsFilter, setResultsFilter] = useState<ResultFilter | null>(null)

  // 브라우저(webview)에서 수집한 콘솔/네트워크 데브툴 항목
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([])
  const devIdRef = useRef(0)

  // 재생 중인 케이스들의 시나리오 스텝 (케이스별 그룹으로 표시)
  const [scenarioSteps, setScenarioSteps] = useState<ScenarioStep[]>([])
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const stepIdRef = useRef(0)

  // 재생 세션: 통계/실행 로그/결과 패널이 이 데이터를 기준으로 표시된다
  const [playbackRequest, setPlaybackRequest] = useState<PlaybackRequest | null>(null)
  const [playCases, setPlayCases] = useState<RunCase[]>([])
  const [playLogs, setPlayLogs] = useState<RunLogEntry[]>([])
  const playTokenRef = useRef(0)
  const playLogIdRef = useRef(0)
  // 완료 시점 요약용 — setState 반영(리렌더)을 기다리지 않고 결과를 바로 집계하기 위한 ref
  const playResultsRef = useRef(new Map<string, boolean>())
  // 이벤트 핸들러에서 최신 케이스 이름을 조회하기 위한 ref
  const playCasesRef = useRef<RunCase[]>([])
  playCasesRef.current = playCases

  const playing = !!playbackRequest

  function handleStepResult(stepId: number, result: ScenarioStep['result']): void {
    setScenarioSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, result } : step)))
  }

  function addConsoleEntry(payload: ConsoleMessagePayload): void {
    devIdRef.current += 1
    const entry: ConsoleEntry = { id: devIdRef.current, time: formatLogTime(), ...payload }
    setConsoleEntries((prev) => [...prev.slice(-(MAX_DEVTOOL_ENTRIES - 1)), entry])
  }

  function addNetworkEntry(payload: NetworkEventPayload): void {
    devIdRef.current += 1
    const entry: NetworkEntry = { id: devIdRef.current, time: formatLogTime(), ...payload }
    setNetworkEntries((prev) => [...prev.slice(-(MAX_DEVTOOL_ENTRIES - 1)), entry])
  }

  function appendPlayLog(level: LogLevel, message: string, caseId: string | null = null): void {
    playLogIdRef.current += 1
    const id = playLogIdRef.current
    const time = formatLogTime()
    setPlayLogs((prev) => [...prev, { id, time, level, message, caseId }])
  }

  function patchPlayCase(caseId: string, patch: Partial<RunCase>): void {
    setPlayCases((prev) => prev.map((item) => (item.id === caseId ? { ...item, ...patch } : item)))
  }

  // 마지막으로 실행한 케이스들 — "재실행" 버튼이 이 목록을 다시 돌린다
  const lastPlayedCasesRef = useRef<TestCase[]>([])
  // 현재 재생 세션의 실행 기록(test_runs) id. 케이스 결과/완료 시점에 실제 DB에 남기는 데 쓴다.
  // 세션 시작 시 IPC 호출이 실패하면 null로 남아 이후 기록을 조용히 건너뛴다
  const testRunIdRef = useRef<string | null>(null)

  // 자동화 스텝을 케이스별로 시나리오 패널에 불러오고 실제 브라우저에서 재생을 시작한다.
  // 재생 시작 전에 실행 세션(test_run) 기록을 먼저 남겨야 케이스 결과를 거기 연결할 수 있어 비동기로 처리한다
  async function startPlayback(testCases: TestCase[]): Promise<boolean> {
    const runnable = testCases.filter((testCase) => testCase.steps.some((step) => step.automation))
    if (runnable.length === 0) return false
    lastPlayedCasesRef.current = runnable

    // 대시보드로 넘어오는 케이스는 항상 테스트 하나에 속해 있으므로(단건/일괄 실행 모두
    // 같은 테스트 화면에서 시작됨) 첫 케이스의 test_id로 실행 세션을 연다
    testRunIdRef.current = null
    try {
      const run = await window.api.testRuns.start({ test_id: runnable[0].test_id })
      testRunIdRef.current = run.id
    } catch {
      // 실행 기록 저장에 실패해도 재생 자체는 계속한다 — 화면상 실행/결과 확인에는 영향 없음
    }

    // 이 테스트에 연결된 활성 훅을 타이밍별로 묶어 재생 요청에 함께 실어 보낸다.
    // 훅 조회가 실패해도 케이스 재생 자체는 계속한다 — hookGroups가 undefined면 그냥 훅 없이 실행된다
    let hookGroups: PlaybackHookGroup | undefined
    try {
      const hooks = await window.api.hooks.listForTest(runnable[0].test_id)
      const runnableHooks = hooks.filter((hook) => hook.enabled && hook.steps.some((step) => step.automation))
      const toPlaybackCase = (hook: Hook): PlaybackCase => ({
        caseId: hook.id,
        name: hook.name,
        startUrl: hook.start_url ?? undefined,
        steps: hook.steps
          .filter((step) => step.automation)
          .map((step) => {
            stepIdRef.current += 1
            return {
              stepId: stepIdRef.current,
              actionType: step.automation!.actionType,
              selector: step.automation!.selector,
              value: step.automation!.value,
              label: `${step.action}${step.expected ? ` — ${step.expected}` : ''}`,
              request: step.automation!.request
            }
          })
      })
      hookGroups = {
        beforeAll: runnableHooks.filter((hook) => hook.timing === 'beforeAll').map(toPlaybackCase),
        beforeEach: runnableHooks.filter((hook) => hook.timing === 'beforeEach').map(toPlaybackCase),
        afterEach: runnableHooks.filter((hook) => hook.timing === 'afterEach').map(toPlaybackCase),
        afterAll: runnableHooks.filter((hook) => hook.timing === 'afterAll').map(toPlaybackCase),
        onFailure: runnableHooks.filter((hook) => hook.timing === 'onFailure').map(toPlaybackCase)
      }
    } catch {
      // 훅 조회에 실패해도 케이스 재생 자체는 계속한다
    }

    const allSteps: ScenarioStep[] = []
    const playbackCases: PlaybackCase[] = runnable.map((testCase) => {
      const steps = testCase.steps
        .filter((step) => step.automation)
        .map((step) => {
          stepIdRef.current += 1
          const scenarioStep: ScenarioStep = {
            id: stepIdRef.current,
            actionType: step.automation!.actionType,
            actionLabel: step.action,
            selector: step.automation!.selector,
            value: step.automation!.value,
            targetLabel: step.expected,
            caseId: testCase.id,
            caseName: testCase.name
          }
          allSteps.push(scenarioStep)
          return {
            stepId: scenarioStep.id,
            actionType: scenarioStep.actionType,
            selector: scenarioStep.selector,
            value: scenarioStep.value,
            label: `${step.action}${step.expected ? ` — ${step.expected}` : ''}`,
            request: step.automation!.request
          }
        })
      return {
        caseId: testCase.id,
        name: testCase.name,
        startUrl: testCase.policy.automationStartUrl,
        steps
      }
    })

    playTokenRef.current += 1
    playLogIdRef.current = 0
    playResultsRef.current = new Map()
    setScenarioSteps(allSteps)
    setScenarioOpen(true)
    setPlayCases(
      runnable.map((testCase) => ({
        id: testCase.id,
        name: testCase.name,
        kind: testCase.steps.some((step) => step.automation?.actionType === 'api-request') ? 'api' : 'e2e',
        status: 'pending',
        durationMs: null,
        failMessage: null
      }))
    )
    setPlayLogs([])
    setPlaybackRequest({ token: playTokenRef.current, cases: playbackCases, hooks: hookGroups })
    return true
  }

  // 이 정확한 autoPlayCases 배치를 이미 재생 시작했는지 — React 18 StrictMode(dev)가
  // 마운트 직후 effect를 두 번 실행하는데, startPlayback이 비동기라 가드 없이는
  // testRuns:start가 경쟁 상태로 두 번 불려 test_run 행이 중복 생성된다. 동기적으로 먼저
  // 체크/기록해 async 작업이 시작되기 전에 두 번째 호출을 막는다
  const autoPlayHandledRef = useRef<TestCase[] | null>(null)

  // TestCaseTable/테스트 목록의 "실행"(단건/일괄)에서 App이 이 값을 채워 넘겨준다
  useEffect(() => {
    if (!autoPlayCases || autoPlayCases.length === 0) return
    if (autoPlayHandledRef.current === autoPlayCases) return
    autoPlayHandledRef.current = autoPlayCases
    void startPlayback(autoPlayCases)
    onAutoPlayConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayCases])

  function handleRerun(): void {
    if (playing || lastPlayedCasesRef.current.length === 0) return
    void startPlayback(lastPlayedCasesRef.current)
  }

  // 재생 세션 시작 로그는 playCases 초기화와 같은 렌더 사이클을 피해서 남긴다
  useEffect(() => {
    if (!playbackRequest) return
    appendPlayLog('info', `테스트 실행 시작 — 대상 케이스 ${playbackRequest.cases.length}건`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRequest])

  function handlePlaybackEvent(event: PlaybackEvent): void {
    if (event.kind === 'case-start') {
      patchPlayCase(event.caseId, { status: 'running' })
      const runCase = playCasesRef.current.find((item) => item.id === event.caseId)
      appendPlayLog('info', `▶ [${runCase?.kind === 'api' ? 'API' : 'E2E'}] ${runCase?.name ?? event.caseId} 실행 시작`, event.caseId)
      return
    }
    if (event.kind === 'step-result') {
      handleStepResult(event.stepId, event.result)
      appendPlayLog(
        event.result.ok ? 'step' : 'error',
        event.result.ok ? event.label : `${event.label} — 실패 (${event.result.error ?? '알 수 없는 오류'})`,
        event.caseId
      )
      return
    }
    if (event.kind === 'hook-start') {
      appendPlayLog('info', `⚙ [훅·${HOOK_TIMING_LABELS[event.timing]}] ${event.name} 실행 시작`, event.caseId)
      return
    }
    if (event.kind === 'hook-end') {
      if (event.passed) {
        appendPlayLog('success', `⚙ ✓ [훅·${HOOK_TIMING_LABELS[event.timing]}] ${event.name} 완료`, event.caseId)
      } else {
        appendPlayLog(
          'error',
          `⚙ ✕ [훅·${HOOK_TIMING_LABELS[event.timing]}] ${event.name} 실패 — ${event.failMessage ?? ''}`,
          event.caseId
        )
      }
      return
    }
    // case-end
    playResultsRef.current.set(event.caseId, event.passed)
    const name = playCasesRef.current.find((item) => item.id === event.caseId)?.name ?? event.caseId
    patchPlayCase(event.caseId, {
      status: event.passed ? 'passed' : 'failed',
      durationMs: event.durationMs,
      failMessage: event.failMessage
    })
    if (event.passed) appendPlayLog('success', `✓ ${name} 통과`, event.caseId)
    else appendPlayLog('error', `✕ ${name} 실패 — ${event.failMessage ?? ''}`, event.caseId)

    // 실제 실행 이력으로 남긴다 — 프로젝트 상세의 실행 횟수 히트맵과 "마지막 실행" 표시가 이 데이터를 쓴다
    if (testRunIdRef.current) {
      void window.api.testRuns.recordCase({
        test_run_id: testRunIdRef.current,
        test_case_id: event.caseId,
        status: event.passed ? 'success' : 'failure',
        message: event.failMessage,
        duration_ms: event.durationMs
      })
    }
  }

  function handlePlaybackComplete(token: number): void {
    if (playTokenRef.current !== token) return
    setPlaybackRequest(null)
    const results = [...playResultsRef.current.values()]
    const passed = results.filter(Boolean).length
    appendPlayLog(
      'info',
      `실행 완료 — 전체 ${playCasesRef.current.length}건 · 성공 ${passed}건 · 실패 ${results.length - passed}건`
    )

    if (testRunIdRef.current) {
      const status: TestRunStatus =
        results.length === 0 ? 'error' : passed === results.length ? 'success' : passed === 0 ? 'failure' : 'partial'
      void window.api.testRuns.finish({ id: testRunIdRef.current, status })
      testRunIdRef.current = null
    }
  }

  function stopPlayback(): void {
    playTokenRef.current += 1
    setPlaybackRequest(null)
    if (testRunIdRef.current) {
      const runId = testRunIdRef.current
      // 중단 시점에 실행 중이었거나 아직 시작도 못한 케이스는 그냥 버려지면 통계에서
      // 영영 빠지게 된다 — 실제로 통과/실패하지 못했다는 사실 자체를 이력으로 남긴다
      for (const item of playCasesRef.current) {
        if (item.status === 'running' || item.status === 'pending') {
          void window.api.testRuns.recordCase({
            test_run_id: runId,
            test_case_id: item.id,
            status: 'skipped',
            message: '사용자에 의해 중지됨',
            duration_ms: null
          })
        }
      }
      // 사용자가 중간에 멈춘 세션 — 끝까지 실행되지 못했음을 기록해둔다
      void window.api.testRuns.finish({ id: runId, status: 'error' })
      testRunIdRef.current = null
    }
    setPlayCases((prev) =>
      prev.map((item) => (item.status === 'running' ? { ...item, status: 'pending' } : item))
    )
    appendPlayLog('info', '사용자에 의해 실행이 중지되었습니다')
  }

  const runningCaseName = playing
    ? (playCases.find((item) => item.status === 'running')?.name ??
      (playCases.length > 1 ? `${playCases.length}개 케이스` : playCases[0]?.name))
    : null

  return (
    <div className={styles.view}>
      <div className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <span className="text-ivory">대시보드</span>
      </div>

      <div className={styles.body}>
        <div className={styles.content}>
          <div className={styles.controlsRow}>
            <p className={`${styles.statusText} text-ivory-faint`}>
              {runningCaseName
                ? `자동화 재생 중 — ${runningCaseName}`
                : playCases.length > 0
                  ? '실행이 끝났습니다. 케이스 카드를 눌러 결과를 확인하세요.'
                  : '테스트 케이스 목록에서 "실행"을 누르면 이 화면에서 실행 과정을 볼 수 있습니다.'}
            </p>
            <div className={styles.controlButtons}>
              {playing ? (
                <Button variant="danger" onClick={stopPlayback}>
                  중지
                </Button>
              ) : (
                <Button onClick={handleRerun} disabled={playCases.length === 0}>
                  <PlayIcon size={13} /> 재실행
                </Button>
              )}
            </div>
          </div>

          <RunStatsRow cases={playCases} running={playing} onSelect={setResultsFilter} />
          <LiveBrowserPane
            onConsoleMessage={addConsoleEntry}
            onNetworkEvent={addNetworkEntry}
            playbackRequest={playbackRequest}
            onPlaybackEvent={handlePlaybackEvent}
            onPlaybackComplete={handlePlaybackComplete}
          />
          <RunLogPane
            logs={playLogs}
            consoleEntries={consoleEntries}
            networkEntries={networkEntries}
            running={playing}
          />
        </div>
      </div>

      <CaseResultsPanel
        filter={resultsFilter}
        cases={playCases}
        logs={playLogs}
        onClose={() => setResultsFilter(null)}
      />
      <ScenarioPanel
        open={scenarioOpen}
        steps={scenarioSteps}
        playing={playing}
        onClose={() => setScenarioOpen(false)}
        onDeleteStep={(id) => setScenarioSteps((prev) => prev.filter((step) => step.id !== id))}
        onClearAll={() => setScenarioSteps([])}
      />
    </div>
  )
}
