import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type {
  ApiRequestSpec,
  PetCommandAction,
  PetRunState,
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
      ipcRenderer.invoke('projects:executionHistory', params)
  },
  tests: {
    list: (params: TestListParams) => ipcRenderer.invoke('tests:list', params),
    create: (input: TestCreateInput) => ipcRenderer.invoke('tests:create', input),
    update: (input: TestUpdateInput) => ipcRenderer.invoke('tests:update', input),
    remove: (id: string) => ipcRenderer.invoke('tests:remove', id)
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
  },
  pet: {
    // 대시보드가 재생 상태가 바뀔 때마다 펫에게 알린다
    reportState: (state: PetRunState) => ipcRenderer.invoke('pet:reportState', state),
    // 펫 툴팁 버튼(중지/취소 등)이 보낸 명령을 메인 창이 받아 처리한다
    onCommand: (callback: (action: PetCommandAction) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, action: PetCommandAction): void => callback(action)
      ipcRenderer.on('pet:executeCommand', listener)
      return () => ipcRenderer.removeListener('pet:executeCommand', listener)
    }
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
