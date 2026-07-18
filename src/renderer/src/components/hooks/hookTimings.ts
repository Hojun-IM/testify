import type { HookTiming } from '../../../../shared/types'

// 훅 실행 시점의 표시 순서/레이블/설명. 폼·목록·모달이 공유한다
// (대시보드 실행 로그의 한글 레이블은 DashboardView의 HOOK_TIMING_LOG_LABELS 참고)

export const HOOK_TIMING_ORDER: HookTiming[] = [
  'beforeAll',
  'beforeEach',
  'afterEach',
  'afterAll',
  'onFailure'
]

export const HOOK_TIMING_LABELS: Record<HookTiming, string> = {
  beforeAll: 'Before All',
  beforeEach: 'Before Each',
  afterEach: 'After Each',
  afterAll: 'After All',
  onFailure: 'On Failure'
}

export const HOOK_TIMING_DESCRIPTIONS: Record<HookTiming, string> = {
  beforeAll: '전체 실행 시작 전 1회 실행',
  beforeEach: '각 케이스 실행 전마다 실행',
  afterEach: '각 케이스 실행 후마다 실행',
  afterAll: '전체 실행 종료 후 1회 실행',
  onFailure: '케이스가 실패했을 때만 실행 (정리/상태 복구용)'
}
