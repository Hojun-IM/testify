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

// 요소 선택 모드로 기록된 스텝을 실제 브라우저에서 재생하기 위한 실행 정보.
// action/expected/outcome은 사람이 읽는 표시용 텍스트이고, automation은 실행 바인딩이다.
export type TestCaseStepAutomation = {
  actionType: string
  selector: string
  value?: string
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
