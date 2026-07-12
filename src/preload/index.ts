import { contextBridge, ipcRenderer } from 'electron'
import type {
  ProjectCreateInput,
  ProjectListParams,
  ProjectStatus,
  ProjectUpdateInput,
  TestCreateInput,
  TestListParams,
  TestUpdateInput
} from '../shared/types'

const api = {
  projects: {
    list: (params?: ProjectListParams) => ipcRenderer.invoke('projects:list', params),
    create: (input: ProjectCreateInput) => ipcRenderer.invoke('projects:create', input),
    environments: (projectId: string) => ipcRenderer.invoke('projects:environments', projectId),
    update: (input: ProjectUpdateInput) => ipcRenderer.invoke('projects:update', input),
    setStatus: (id: string, status: ProjectStatus) =>
      ipcRenderer.invoke('projects:setStatus', { id, status }),
    remove: (id: string) => ipcRenderer.invoke('projects:remove', id)
  },
  tests: {
    list: (params: TestListParams) => ipcRenderer.invoke('tests:list', params),
    create: (input: TestCreateInput) => ipcRenderer.invoke('tests:create', input),
    update: (input: TestUpdateInput) => ipcRenderer.invoke('tests:update', input),
    remove: (id: string) => ipcRenderer.invoke('tests:remove', id)
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
