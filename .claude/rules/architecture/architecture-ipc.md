# IPC 계층

renderer는 Node.js에 직접 접근하지 않는다. 파일, DB, 외부 API 같은 작업은 전부 main 프로세스가 하고 renderer는 IPC로 요청한다.

## 데이터 흐름

```
컴포넌트
   ↓ 호출
훅 (useTestRunner)
   ↓ 호출
IPC 래퍼 (features/*/api/testRunnerApi.ts)   ← renderer에서 IPC를 아는 유일한 계층
   ↓ window.api
preload (contextBridge)
   ↓ ipcRenderer.invoke
main/ipc/ 핸들러
   ↓ 호출
main/services/  ← 실제 도메인 로직
```

각 계층은 바로 아래 계층만 안다. 컴포넌트에서 `window.api`를 직접 부르지 않는다.

## 채널 정의는 shared에

```ts
// src/shared/ipc.ts
export const IPC_CHANNEL = {
  TEST_RUN: 'test:run',
  TEST_CANCEL: 'test:cancel',
  CONFIG_SAVE: 'config:save'
} as const

export interface RunTestRequest {
  testId: string
}

export interface RunTestResponse {
  results: TestResult[]
}
```

- 채널명은 `도메인:동작` 형식의 문자열 상수로만 쓴다. 문자열 리터럴을 각 파일에 흩뿌리지 않는다.
- 요청/응답 타입도 `shared`에 둔다. main과 renderer가 같은 타입을 본다.
- 주고받는 값은 반드시 직렬화 가능해야 한다. 함수, `Error` 인스턴스, `Map`, 클래스 인스턴스는 넘어가지 않는다.

## preload: 얇게, 명시적으로

```ts
// src/preload/api/testRunner.ts
import { ipcRenderer } from 'electron'
import { IPC_CHANNEL, type RunTestRequest, type RunTestResponse } from '@shared/ipc'

export const testRunner = {
  run: (request: RunTestRequest): Promise<RunTestResponse> =>
    ipcRenderer.invoke(IPC_CHANNEL.TEST_RUN, request)
}
```

- 노출하는 API는 도메인별로 나눠 정의하고 `preload/index.ts`에서 한 번에 묶어 `contextBridge`로 넘긴다.
- `ipcRenderer`를 통째로 노출하지 않는다. 필요한 함수만 노출한다.
- `contextIsolation`을 끄지 않는다.
- preload에는 로직을 넣지 않는다. 채널을 함수로 감싸는 것까지가 역할이다.
- 노출한 API는 `preload/index.d.ts`의 `Window` 타입에 반영한다. `api: unknown`으로 두지 않는다.

## main: 핸들러와 서비스를 나눈다

```ts
// src/main/ipc/testRunner.ts
ipcMain.handle(IPC_CHANNEL.TEST_RUN, async (_event, request: RunTestRequest) => {
  return testRunnerService.run(request.testId)
})
```

- `ipc/`의 핸들러는 입력 검증, 서비스 호출, 에러 변환만 한다. 도메인 로직은 `services/`에 둔다.
- 서비스는 Electron API를 모른다. 순수한 함수/클래스로 두면 그대로 테스트할 수 있다.
- renderer에서 온 값은 신뢰하지 않는다. 특히 파일 경로는 검증 후 사용한다.
- 단발 요청은 `invoke`/`handle`, 진행률처럼 계속 밀어주는 값은 `webContents.send` + preload의 구독 API로 처리한다. 구독 API는 해제 함수를 반환한다.

```ts
// preload
onProgress: (listener: (value: number) => void) => {
  const handler = (_e: unknown, value: number) => listener(value)
  ipcRenderer.on(IPC_CHANNEL.TEST_PROGRESS, handler)
  return () => ipcRenderer.off(IPC_CHANNEL.TEST_PROGRESS, handler)
}
```

## renderer의 IPC 래퍼

```ts
// src/renderer/src/features/test-runner/api/testRunnerApi.ts
export const testRunnerApi = {
  async run(testId: string): Promise<TestResult[]> {
    const response = await window.api.testRunner.run({ testId })
    return response.results
  }
}
```

- 이 파일이 renderer에서 `window.api`를 참조하는 유일한 곳이다. 테스트에서 이 모듈만 모킹하면 된다.
- 응답을 화면이 쓰기 좋은 형태로 바꾸는 것까지 여기서 한다.
- 받아온 결과를 어디에 담을지는 [architecture-state.md](./architecture-state.md)를 따른다.

## 에러 처리

- main에서 던진 에러는 IPC 경계에서 직렬화 가능한 형태로 바꿔 전달한다.

```ts
// main/ipc
try {
  return { ok: true, data: await service.run(id) }
} catch (error) {
  logger.error('테스트 실행 실패', error)
  return { ok: false, message: '테스트를 실행하지 못했습니다' }
}
```

- 사용자에게 보여줄 메시지와 로그용 원인을 분리한다. 내부 경로나 스택을 UI에 노출하지 않는다.
- 실패 상태도 화면의 상태다. 로딩/성공/실패를 모두 표현할 수 있게 설계한다.

## 도입 체크리스트

- `src/shared/ipc.ts`에 채널 상수와 요청/응답 타입 정의
- `src/preload/api/`에 도메인별 API 추가 후 `index.ts`에서 `contextBridge.exposeInMainWorld('api', api)`
- `src/preload/index.d.ts`의 `api: unknown`을 실제 타입으로 교체
- `src/main/ipc/`에 핸들러 등록 함수를 만들고 `app.whenReady()` 안에서 호출
