import type {
  Project,
  ProjectCreateInput,
  ProjectEnvironment,
  ProjectListParams,
  ProjectStatus,
  ProjectSummary,
  ProjectUpdateInput
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
    }
  }
}
