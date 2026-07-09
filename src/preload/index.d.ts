import type { Project, ProjectCreateInput, ProjectListParams } from '../shared/types'

export {}

declare global {
  interface Window {
    api: {
      projects: {
        list: (params?: ProjectListParams) => Promise<Project[]>
        create: (input: ProjectCreateInput) => Promise<Project>
      }
    }
  }
}
