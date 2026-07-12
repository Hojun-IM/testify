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
