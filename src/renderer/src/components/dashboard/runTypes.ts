// 대시보드 실행(재생) 세션에서 공유하는 타입들.
// 실제 테스트 케이스 재생 결과가 통계/로그/결과 패널로 흐를 때 이 형태를 쓴다

export type RunCaseStatus = 'pending' | 'running' | 'passed' | 'failed'

export type RunCase = {
  id: string
  name: string
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

export function formatLogTime(): string {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}
