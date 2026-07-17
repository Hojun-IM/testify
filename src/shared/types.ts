export type ProjectStatus = 'active' | 'archived'

export type Project = {
  id: string
  name: string
  status: ProjectStatus
  created_dt: string
  updated_dt: string
  created_by: string
  updated_by: string
}

export type ProjectSummary = Project & {
  test_count: number
  test_case_count: number
}

export type ProjectListParams = {
  status?: ProjectStatus | 'all'
  search?: string
}

export type ProjectEnvironmentInput = {
  name: string
  url: string
}

export type ProjectEnvironment = ProjectEnvironmentInput & {
  id: string
  project_id: string
  created_dt: string
}

export type ProjectCreateInput = {
  name: string
  environments?: ProjectEnvironmentInput[]
}

export type ProjectUpdateInput = {
  id: string
  name: string
  environments?: ProjectEnvironmentInput[]
}

export type TestType = 'api' | 'e2e'

export type Test = {
  id: string
  project_id: string
  name: string
  description: string | null
  type: TestType
  last_run_at: string | null
  created_dt: string
  updated_dt: string
  created_by: string
  updated_by: string
}

export type TestListParams = {
  projectId: string
  type?: TestType | 'all'
  search?: string
}

export type TestCreateInput = {
  project_id: string
  name: string
  type: TestType
}

export type TestUpdateInput = {
  id: string
  name: string
  type: TestType
}

export type TestCaseStatus = 'draft' | 'ready' | 'deprecated'

export type TestCaseTrigger = 'manual' | 'pr' | 'schedule'

export type TestCasePolicy = {
  targetEnvs: string[]
  trigger: TestCaseTrigger
  retryCount: number
  timeoutSec: number
  notifyOnFailure: boolean
  // 대시보드 요소 선택 모드로 기록된 자동화 시나리오를 재생할 때 처음 열 URL
  automationStartUrl?: string
}

export type ApiKeyValue = {
  key: string
  value: string
  description: string
  enabled: boolean
}

export type ApiAuth =
  | { type: 'none' }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }

export type ApiBodyMode = 'none' | 'json' | 'text' | 'form'

export type ApiRequestBody = {
  mode: ApiBodyMode
  content: string
}

// API 케이스 빌더(포스트맨 스타일)에서 구성한 요청 하나의 스펙.
// 재생 시 이 스펙 그대로 메인 프로세스에서 실제 HTTP 요청을 보낸다
export type ApiRequestSpec = {
  method: string
  url: string
  params: ApiKeyValue[]
  headers: ApiKeyValue[]
  auth: ApiAuth
  body: ApiRequestBody
  // 지정하면 재생 시 이 상태 코드와 정확히 일치해야 통과. 비어 있으면 2xx/3xx를 통과로 본다
  expectedStatus?: number
}

// 메인 프로세스가 실제로 보낸 HTTP 요청의 응답 (API 빌더의 즉시 테스트, 재생 양쪽에서 공용)
export type HttpRequestResult = {
  ok: boolean
  status: number | null
  statusText: string
  headers: Record<string, string>
  body: string
  durationMs: number
  error?: string
}

// 요소 선택 모드(E2E)로 기록되었거나 API 빌더로 등록된 스텝을 실제로 재생하기 위한 실행 정보.
// action/expected/outcome은 사람이 읽는 표시용 텍스트이고, automation은 실행 바인딩이다.
export type TestCaseStepAutomation = {
  // E2E: click/fill/goto 등 DOM 액션 타입. API: 'api-request' 고정
  actionType: string
  selector: string
  value?: string
  // actionType이 'api-request'일 때만 채워진다
  request?: ApiRequestSpec
}

export type TestCaseStep = {
  action: string
  expected: string
  outcome: string
  automation?: TestCaseStepAutomation
}

export type TestCase = {
  id: string
  test_id: string
  name: string
  status: TestCaseStatus
  precondition: string | null
  steps: TestCaseStep[]
  tags: string[]
  policy: TestCasePolicy
  order_index: number
  last_run_at: string | null
  created_dt: string
  updated_dt: string
  created_by: string
  updated_by: string
}

export type TestCaseListParams = {
  testId: string
  search?: string
}

export type TestCaseCreateInput = {
  test_id: string
  name: string
  status: TestCaseStatus
  precondition: string
  steps: TestCaseStep[]
  tags: string[]
  policy: TestCasePolicy
}

export type TestCaseUpdateInput = TestCaseCreateInput & {
  id: string
}

export type TestCaseReorderInput = {
  test_id: string
  ordered_ids: string[]
}

// ── 훅 ──────────────────────────────────────────────────────────
// 여러 테스트 케이스에서 반복되는 공통 시나리오(로그인, 데이터 초기화 등)를
// 한 곳에서 만들어두고 재사용하기 위한 단위.
// - 전역 훅: project_id가 null — 사이드바 훅 탭에서 관리하고, 각 테스트에 불러와(연결해) 사용
// - 프로젝트 훅: project_id 보유 — 해당 프로젝트 안에서만 사용

export type HookTiming = 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll' | 'onFailure'

export type Hook = {
  id: string
  project_id: string | null
  name: string
  description: string | null
  type: TestType
  timing: HookTiming
  enabled: boolean
  // 테스트 케이스와 동일한 스텝 구조 — 자동화 바인딩(automation)을 그대로 재사용한다
  steps: TestCaseStep[]
  // e2e 훅 재생 시작 URL (api 훅에는 없음)
  start_url: string | null
  order_index: number
  created_dt: string
  updated_dt: string
  created_by: string
  updated_by: string
}

export type HookListParams = {
  // 생략(또는 null)하면 전역 훅만, 지정하면 해당 프로젝트의 훅만 조회
  projectId?: string | null
  type?: TestType | 'all'
  timing?: HookTiming | 'all'
  search?: string
}

export type HookCreateInput = {
  // null이면 전역 훅
  project_id: string | null
  name: string
  description: string
  type: TestType
  timing: HookTiming
  enabled: boolean
  steps: TestCaseStep[]
  start_url?: string | null
}

export type HookUpdateInput = HookCreateInput & {
  id: string
}

// 테스트에 불러와 연결한 전역 훅 목록을 통째로 교체한다
export type TestHooksSetInput = {
  test_id: string
  hook_ids: string[]
}

// ── 테스트 실행 이력 ──────────────────────────────────────────────
// 대시보드에서 케이스를 실제로 재생할 때마다 남기는 기록. 프로젝트 상세의
// 날짜별 실행 횟수 히트맵과 케이스/테스트 목록의 "마지막 실행" 표시가 이 데이터를 사용한다.

export type TestRunStatus = 'running' | 'success' | 'failure' | 'error' | 'partial'
export type TestCaseRunStatus = 'success' | 'failure' | 'error' | 'skipped'

export type TestRun = {
  id: string
  test_id: string
  status: TestRunStatus
  started_at: string
  finished_at: string | null
  created_by: string
}

export type TestRunStartInput = {
  test_id: string
}

export type TestRunFinishInput = {
  id: string
  status: TestRunStatus
}

export type TestCaseRunRecordInput = {
  test_run_id: string
  test_case_id: string
  status: TestCaseRunStatus
  message?: string | null
  duration_ms?: number | null
}

export type ProjectExecutionHistoryParams = {
  projectId: string
  year: number
}

// 날짜(YYYY-MM-DD)별 케이스 실행 횟수
export type ProjectExecutionHistoryEntry = {
  date: string
  count: number
}
