import type {
  ApiRequestSpec,
  Hook,
  PetCommandAction,
  PetRunState,
  HookCreateInput,
  HookListParams,
  HookUpdateInput,
  HttpRequestResult,
  Project,
  ProjectCreateInput,
  ProjectEnvironment,
  ProjectExecutionHistoryEntry,
  ProjectExecutionHistoryParams,
  ProjectListParams,
  ProjectStatus,
  ProjectSummary,
  ProjectUpdateInput,
  Test,
  TestCase,
  TestCaseCreateInput,
  TestCaseListParams,
  TestCaseReorderInput,
  TestCaseRunRecordInput,
  TestCaseUpdateInput,
  TestCreateInput,
  TestHooksSetInput,
  TestListParams,
  TestRun,
  TestRunFinishInput,
  TestRunStartInput,
  TestUpdateInput
} from '../shared/types'

export {}

declare global {
  interface Window {
    api: {
      projects: {
        list: (params?: ProjectListParams) => Promise<ProjectSummary[]>
        create: (input: ProjectCreateInput) => Promise<Project>
        environments: (projectId: string) => Promise<ProjectEnvironment[]>
        update: (input: ProjectUpdateInput) => Promise<Project>
        setStatus: (id: string, status: ProjectStatus) => Promise<Project>
        remove: (id: string) => Promise<void>
        executionHistory: (params: ProjectExecutionHistoryParams) => Promise<ProjectExecutionHistoryEntry[]>
      }
      tests: {
        list: (params: TestListParams) => Promise<Test[]>
        create: (input: TestCreateInput) => Promise<Test>
        update: (input: TestUpdateInput) => Promise<Test>
        remove: (id: string) => Promise<void>
      }
      testCases: {
        list: (params: TestCaseListParams) => Promise<TestCase[]>
        create: (input: TestCaseCreateInput) => Promise<TestCase>
        update: (input: TestCaseUpdateInput) => Promise<TestCase>
        remove: (id: string) => Promise<void>
        reorder: (input: TestCaseReorderInput) => Promise<void>
      }
      hooks: {
        list: (params?: HookListParams) => Promise<Hook[]>
        create: (input: HookCreateInput) => Promise<Hook>
        update: (input: HookUpdateInput) => Promise<Hook>
        remove: (id: string) => Promise<void>
        listForTest: (testId: string) => Promise<Hook[]>
        setForTest: (input: TestHooksSetInput) => Promise<void>
      }
      http: {
        request: (spec: ApiRequestSpec) => Promise<HttpRequestResult>
      }
      testRuns: {
        start: (input: TestRunStartInput) => Promise<TestRun>
        recordCase: (input: TestCaseRunRecordInput) => Promise<void>
        finish: (input: TestRunFinishInput) => Promise<void>
      }
      pet: {
        reportState: (state: PetRunState) => Promise<void>
        onCommand: (callback: (action: PetCommandAction) => void) => () => void
      }
    }
  }
}
