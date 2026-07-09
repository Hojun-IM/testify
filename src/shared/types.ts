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

export type ProjectCreateInput = {
  name: string
}
