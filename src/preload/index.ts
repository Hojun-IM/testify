import { contextBridge, ipcRenderer } from 'electron'
import type {
  ApiRequestSpec,
  HookCreateInput,
  HookListParams,
  HookUpdateInput,
  ProjectCreateInput,
  ProjectExecutionHistoryParams,
  ProjectListParams,
  ProjectStatus,
  ProjectUpdateInput,
  TestCaseCreateInput,
  TestCaseListParams,
  TestCaseReorderInput,
  TestCaseRunRecordInput,
  TestCaseUpdateInput,
  TestCreateInput,
  TestHooksSetInput,
  TestListParams,
  TestRunFinishInput,
  TestRunStartInput,
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
    remove: (id: string) => ipcRenderer.invoke('projects:remove', id),
    executionHistory: (params: ProjectExecutionHistoryParams) =>
      ipcRenderer.invoke('projects:executionHistory', params),
    get: (id: string) => ipcRenderer.invoke('projects:get', id)
  },
  tests: {
    list: (params: TestListParams) => ipcRenderer.invoke('tests:list', params),
    create: (input: TestCreateInput) => ipcRenderer.invoke('tests:create', input),
    update: (input: TestUpdateInput) => ipcRenderer.invoke('tests:update', input),
    remove: (id: string) => ipcRenderer.invoke('tests:remove', id),
    get: (id: string) => ipcRenderer.invoke('tests:get', id)
  },
  testCases: {
    list: (params: TestCaseListParams) => ipcRenderer.invoke('testCases:list', params),
    create: (input: TestCaseCreateInput) => ipcRenderer.invoke('testCases:create', input),
    update: (input: TestCaseUpdateInput) => ipcRenderer.invoke('testCases:update', input),
    remove: (id: string) => ipcRenderer.invoke('testCases:remove', id),
    reorder: (input: TestCaseReorderInput) => ipcRenderer.invoke('testCases:reorder', input)
  },
  hooks: {
    list: (params?: HookListParams) => ipcRenderer.invoke('hooks:list', params ?? {}),
    create: (input: HookCreateInput) => ipcRenderer.invoke('hooks:create', input),
    update: (input: HookUpdateInput) => ipcRenderer.invoke('hooks:update', input),
    remove: (id: string) => ipcRenderer.invoke('hooks:remove', id),
    listForTest: (testId: string) => ipcRenderer.invoke('hooks:listForTest', testId),
    setForTest: (input: TestHooksSetInput) => ipcRenderer.invoke('hooks:setForTest', input)
  },
  http: {
    request: (spec: ApiRequestSpec) => ipcRenderer.invoke('http:request', spec)
  },
  testRuns: {
    start: (input: TestRunStartInput) => ipcRenderer.invoke('testRuns:start', input),
    recordCase: (input: TestCaseRunRecordInput) => ipcRenderer.invoke('testRuns:recordCase', input),
    finish: (input: TestRunFinishInput) => ipcRenderer.invoke('testRuns:finish', input)
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
