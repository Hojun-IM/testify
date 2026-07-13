import type {
  Project,
  ProjectCreateInput,
  ProjectEnvironment,
  ProjectListParams,
  ProjectStatus,
  ProjectSummary,
  ProjectUpdateInput,
  Test,
  TestCase,
  TestCaseCreateInput,
  TestCaseListParams,
  TestCaseReorderInput,
  TestCaseUpdateInput,
  TestCreateInput,
  TestListParams,
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
    }
  }
}
