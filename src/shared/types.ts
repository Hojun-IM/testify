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
