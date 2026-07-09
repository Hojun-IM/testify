import type { Project, ProjectCreateInput, ProjectListParams, ProjectSummary } from '../shared/types'

export {}

declare global {
  interface Window {
    api: {
      projects: {
        list: (params?: ProjectListParams) => Promise<ProjectSummary[]>
        create: (input: ProjectCreateInput) => Promise<Project>
      }
    }
  }
}
