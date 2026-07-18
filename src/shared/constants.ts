import type { TestCasePolicy } from './types'

// 케이스 정책의 기본값. 메인 프로세스(저장된 행 정규화)와 렌더러(새 케이스 폼 초기값)가
// 같은 값을 공유해야 하므로 shared에 둔다
export const DEFAULT_TEST_CASE_POLICY: TestCasePolicy = {
  targetEnvs: [],
  trigger: 'manual',
  retryCount: 0,
  timeoutSec: 30,
  notifyOnFailure: false
}
