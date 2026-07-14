import { useEffect, useRef, useState } from 'react'
import type { TestType } from '../../../../shared/types'

export type RunCaseStatus = 'pending' | 'running' | 'passed' | 'failed'

export type RunCase = {
  id: string
  name: string
  type: TestType
  status: RunCaseStatus
  durationMs: number | null
  failMessage: string | null
}

export type LogLevel = 'info' | 'step' | 'success' | 'error'

export type RunLogEntry = {
  id: number
  time: string
  level: LogLevel
  message: string
  // 어느 케이스에서 발생한 로그인지. 실행 시작/종료 같은 전역 로그는 null
  caseId: string | null
}

export type BrowserFocus = 'nav' | 'hero' | 'email' | 'password' | 'submit' | 'result'

export type BrowserState = {
  url: string
  focus: BrowserFocus | null
}

export type ApiCall = {
  id: number
  method: string
  path: string
  status: number | null
  latencyMs: number | null
}

type E2EScriptStep = { kind: 'e2e'; url?: string; focus: BrowserFocus; log: string }
type ApiScriptStep = { kind: 'api'; method: string; path: string; status: number; latencyMs: number; log: string }
type ScriptStep = E2EScriptStep | ApiScriptStep

type CaseScript = {
  name: string
  type: TestType
  steps: ScriptStep[]
  failMessage?: string
}

// TODO: 실제 테스트 러너(IPC)가 생기면 이 스크립트/시뮬레이션 전체를 러너 이벤트 구독으로 교체
const CASE_SCRIPTS: CaseScript[] = [
  {
    name: '로그인 성공 플로우',
    type: 'e2e',
    steps: [
      { kind: 'e2e', url: 'https://example.com/?page=login', focus: 'nav', log: '페이지 이동: /login' },
      { kind: 'e2e', focus: 'email', log: '이메일 입력 필드에 "qa@testify.dev" 입력' },
      { kind: 'e2e', focus: 'password', log: '비밀번호 입력' },
      { kind: 'e2e', focus: 'submit', log: '"로그인" 버튼 클릭' },
      { kind: 'e2e', url: 'https://example.com/?page=home', focus: 'result', log: '홈 화면 진입 및 사용자 이름 노출 확인' }
    ]
  },
  {
    name: '인증 토큰 발급',
    type: 'api',
    steps: [
      { kind: 'api', method: 'POST', path: '/api/auth/token', status: 200, latencyMs: 142, log: '토큰 발급 요청' },
      { kind: 'api', method: 'GET', path: '/api/auth/me', status: 200, latencyMs: 87, log: '발급된 토큰으로 사용자 정보 조회' }
    ]
  },
  {
    name: '상품 장바구니 담기',
    type: 'e2e',
    steps: [
      { kind: 'e2e', url: 'https://example.com/?page=products', focus: 'nav', log: '페이지 이동: /products/1024' },
      { kind: 'e2e', focus: 'hero', log: '상품 상세 정보 렌더링 확인' },
      { kind: 'e2e', focus: 'submit', log: '"장바구니 담기" 버튼 클릭' },
      { kind: 'e2e', focus: 'result', log: '장바구니 카운트 1 증가 확인' }
    ]
  },
  {
    name: '주문 목록 조회',
    type: 'api',
    steps: [
      { kind: 'api', method: 'GET', path: '/api/orders?page=1', status: 200, latencyMs: 210, log: '주문 목록 1페이지 조회' },
      { kind: 'api', method: 'GET', path: '/api/orders/42', status: 200, latencyMs: 96, log: '주문 상세 조회' }
    ]
  },
  {
    name: '결제 승인 플로우',
    type: 'e2e',
    steps: [
      { kind: 'e2e', url: 'https://example.com/?page=checkout', focus: 'nav', log: '페이지 이동: /checkout' },
      { kind: 'e2e', focus: 'email', log: '배송지 정보 입력' },
      { kind: 'e2e', focus: 'submit', log: '"결제하기" 버튼 클릭' }
    ],
    failMessage: '결제 승인 응답 대기 시간 초과 (10s) — 결과 화면 미노출'
  },
  {
    name: '재고 차감 처리',
    type: 'api',
    steps: [
      { kind: 'api', method: 'POST', path: '/api/inventory/decrease', status: 201, latencyMs: 178, log: '재고 차감 요청' },
      { kind: 'api', method: 'GET', path: '/api/inventory/1024', status: 200, latencyMs: 64, log: '차감 후 재고 수량 검증' }
    ]
  },
  {
    name: '알림 배너 노출',
    type: 'e2e',
    steps: [
      { kind: 'e2e', url: 'https://example.com/?page=home', focus: 'nav', log: '페이지 이동: /home' },
      { kind: 'e2e', focus: 'hero', log: '공지 배너 영역 렌더링 확인' },
      { kind: 'e2e', focus: 'result', log: '배너 문구/링크 검증' }
    ]
  },
  {
    name: '알림 발송 API',
    type: 'api',
    steps: [
      { kind: 'api', method: 'POST', path: '/api/notifications', status: 202, latencyMs: 133, log: '알림 발송 요청' },
      { kind: 'api', method: 'GET', path: '/api/notifications/latest', status: 200, latencyMs: 71, log: '발송 이력 확인' }
    ]
  }
]

const INITIAL_BROWSER: BrowserState = { url: '', focus: null }

function buildInitialCases(): RunCase[] {
  return CASE_SCRIPTS.map((script, index) => ({
    id: `case-${index}`,
    name: script.name,
    type: script.type,
    status: 'pending',
    durationMs: null,
    failMessage: null
  }))
}

function now(): string {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stepDelay(): number {
  return 550 + Math.floor(Math.random() * 450)
}

export function useSimulatedRun(): {
  cases: RunCase[]
  logs: RunLogEntry[]
  browser: BrowserState
  apiCalls: ApiCall[]
  activeCase: RunCase | null
  running: boolean
  start: () => void
  stop: () => void
} {
  const [cases, setCases] = useState<RunCase[]>(buildInitialCases)
  const [logs, setLogs] = useState<RunLogEntry[]>([])
  const [browser, setBrowser] = useState<BrowserState>(INITIAL_BROWSER)
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([])
  const [running, setRunning] = useState(false)

  // start/stop 시마다 증가시키는 토큰. 진행 중이던 이전 실행 루프는 토큰이 달라지면 즉시 멈춘다
  const runTokenRef = useRef(0)
  const logIdRef = useRef(0)
  const apiIdRef = useRef(0)

  useEffect(() => {
    return () => {
      runTokenRef.current += 1
    }
  }, [])

  function appendLog(level: LogLevel, message: string, caseId: string | null = null): void {
    logIdRef.current += 1
    // 같은 틱에 로그가 연달아 추가되면 두 업데이터가 배칭되어 나중에 실행되므로,
    // ref를 업데이터 안에서 읽으면 이미 두 번 증가된 값을 공유해 id가 중복된다
    const id = logIdRef.current
    const time = now()
    setLogs((prev) => [...prev, { id, time, level, message, caseId }])
  }

  function patchCase(caseId: string, patch: Partial<RunCase>): void {
    setCases((prev) => prev.map((item) => (item.id === caseId ? { ...item, ...patch } : item)))
  }

  async function runCase(token: number, runCaseItem: RunCase, script: CaseScript): Promise<void> {
    const startedAt = Date.now()
    patchCase(runCaseItem.id, { status: 'running' })
    appendLog('info', `▶ [${script.type.toUpperCase()}] ${script.name} 실행 시작`, runCaseItem.id)

    if (script.type === 'api') {
      setApiCalls([])
    }

    for (const step of script.steps) {
      await sleep(stepDelay())
      if (runTokenRef.current !== token) return

      if (step.kind === 'e2e') {
        setBrowser((prev) => ({ url: step.url ?? prev.url, focus: step.focus }))
        appendLog('step', step.log, runCaseItem.id)
      } else {
        apiIdRef.current += 1
        const callId = apiIdRef.current
        setApiCalls((prev) => [
          ...prev,
          { id: callId, method: step.method, path: step.path, status: null, latencyMs: null }
        ])
        appendLog('step', `${step.log} — ${step.method} ${step.path}`, runCaseItem.id)

        await sleep(Math.min(step.latencyMs * 3, 700))
        if (runTokenRef.current !== token) return

        setApiCalls((prev) =>
          prev.map((call) =>
            call.id === callId ? { ...call, status: step.status, latencyMs: step.latencyMs } : call
          )
        )
        appendLog(
          step.status < 400 ? 'step' : 'error',
          `응답 수신 — ${step.status} (${step.latencyMs}ms)`,
          runCaseItem.id
        )
      }
    }

    await sleep(stepDelay())
    if (runTokenRef.current !== token) return

    const durationMs = Date.now() - startedAt
    if (script.failMessage) {
      patchCase(runCaseItem.id, { status: 'failed', durationMs, failMessage: script.failMessage })
      appendLog('error', `✕ ${script.name} 실패 — ${script.failMessage}`, runCaseItem.id)
    } else {
      patchCase(runCaseItem.id, { status: 'passed', durationMs })
      appendLog('success', `✓ ${script.name} 통과`, runCaseItem.id)
    }
  }

  async function runAll(token: number, initialCases: RunCase[]): Promise<void> {
    for (const [index, script] of CASE_SCRIPTS.entries()) {
      if (runTokenRef.current !== token) return
      await runCase(token, initialCases[index], script)
    }

    if (runTokenRef.current !== token) return
    const failedCount = CASE_SCRIPTS.filter((script) => script.failMessage).length
    appendLog(
      'info',
      `실행 완료 — 전체 ${CASE_SCRIPTS.length}건 · 성공 ${CASE_SCRIPTS.length - failedCount}건 · 실패 ${failedCount}건`
    )
    setBrowser((prev) => ({ ...prev, focus: null }))
    setRunning(false)
  }

  function start(): void {
    runTokenRef.current += 1
    const token = runTokenRef.current
    const initialCases = buildInitialCases()

    setCases(initialCases)
    setLogs([])
    setApiCalls([])
    setBrowser(INITIAL_BROWSER)
    setRunning(true)

    logIdRef.current = 0
    apiIdRef.current = 0
    appendLog('info', `테스트 실행 시작 — 대상 케이스 ${initialCases.length}건`)

    void runAll(token, initialCases)
  }

  function stop(): void {
    runTokenRef.current += 1
    setRunning(false)
    setCases((prev) => prev.map((item) => (item.status === 'running' ? { ...item, status: 'pending' } : item)))
    setBrowser((prev) => ({ ...prev, focus: null }))
    appendLog('info', '사용자에 의해 실행이 중지되었습니다')
  }

  const activeCase = cases.find((item) => item.status === 'running') ?? null

  return { cases, logs, browser, apiCalls, activeCase, running, start, stop }
}
