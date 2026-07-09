import { contextBridge, ipcRenderer } from 'electron'
import type { ProjectCreateInput, ProjectListParams } from '../shared/types'

const api = {
  projects: {
    list: (params?: ProjectListParams) => ipcRenderer.invoke('projects:list', params),
    create: (input: ProjectCreateInput) => ipcRenderer.invoke('projects:create', input)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api
}
