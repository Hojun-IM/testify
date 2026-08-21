# 테스트 코드 컨벤션

Vitest로 단위 테스트와 컴포넌트 테스트를 작성한다. E2E는 현재 범위 밖이다.

테스트의 목적은 커버리지 숫자가 아니라 **바꿔도 되는지 판단할 근거**를 만드는 것이다.

## 무엇을 테스트하는가

| 대상 | 테스트 | 이유 |
| --- | --- | --- |
| `lib/`, `model/`의 순수 함수 | 필수 | 비용이 가장 싸고 회귀를 잘 잡는다 |
| `main/services/` 도메인 로직 | 필수 | 앱의 핵심 규칙이 여기 있다 |
| Zustand 스토어 액션 | 필요 시 | 상태 전이가 복잡할 때 |
| 훅 | 필요 시 | 분기가 여러 개일 때 |
| 컴포넌트 | 선별적으로 | 조건부 렌더, 사용자 상호작용이 있는 것만 |
| 단순 프레젠테이셔널 컴포넌트 | 안 함 | props를 그대로 그리는 코드는 테스트할 게 없다 |
| IPC 핸들러 등록, Electron 생명주기 | 안 함 | 프레임워크를 테스트하는 것 |

**버그를 고칠 때는 그 버그를 재현하는 테스트를 먼저 만든다.** 이게 가장 확실한 테스트 추가 시점이다.

## 파일 위치와 이름

테스트는 대상 파일 옆에 둔다.

```
features/test-runner/
├── model/
│   ├── formatDuration.ts
│   └── formatDuration.test.ts
└── components/
    ├── TestResultItem.tsx
    └── TestResultItem.test.tsx
```

- 파일명: `<대상 파일명>.test.ts` / `.test.tsx`
- 여러 모듈에 걸친 통합 테스트만 `src/renderer/src/__tests__/` 같은 별도 위치를 쓴다.

## 구조

```ts
describe('formatDuration', () => {
  it('1초 미만은 밀리초로 표시한다', () => {
    expect(formatDuration(320)).toBe('320ms')
  })

  it('1초 이상은 초 단위로 반올림한다', () => {
    expect(formatDuration(1_500)).toBe('1.5s')
  })

  it('음수는 예외를 던진다', () => {
    expect(() => formatDuration(-1)).toThrow()
  })
})
```

- `describe`는 대상 이름(함수명, 컴포넌트명), `it`은 **동작을 한국어 서술형**으로 쓴다.
- "~를 테스트한다"가 아니라 "~한다"로 결과를 적는다. 실패 로그에 그대로 찍혀 원인을 알 수 있어야 한다.
- 하나의 `it`은 하나의 동작만 검증한다. `expect`가 5개를 넘으면 나눌 신호다.

## 준비 - 실행 - 검증

```ts
it('실패한 테스트만 걸러낸다', () => {
  // 준비
  const results = [createResult({ status: 'passed' }), createResult({ status: 'failed' })]

  // 실행
  const failed = filterFailed(results)

  // 검증
  expect(failed).toHaveLength(1)
})
```

- 세 단계를 빈 줄로 구분한다. 주석은 없어도 된다.
- 테스트 데이터는 팩토리 함수(`createResult`)로 만들고, **그 테스트에서 중요한 값만 인자로 넘긴다.** 나머지는 기본값에 숨겨야 무엇이 중요한지 드러난다.

## 구현이 아니라 동작을 검증한다

```tsx
// X: 내부 상태와 구현 세부를 검증
expect(store.getState().internalCache).toEqual({})

// O: 사용자가 관찰할 수 있는 결과를 검증
expect(screen.getByRole('button', { name: '재실행' })).toBeEnabled()
```

- 리팩토링해도 깨지지 않는 테스트가 좋은 테스트다. 구현을 바꿀 때마다 깨지면 테스트가 구현에 묶인 것이다.
- 함수는 입력 → 출력으로, 컴포넌트는 화면에 보이는 것과 상호작용 결과로 검증한다.

## 컴포넌트 테스트

```tsx
it('항목을 클릭하면 선택 콜백이 호출된다', async () => {
  const handleSelect = vi.fn()
  render(<TestResultItem result={createResult({ name: '로그인' })} onSelect={handleSelect} />)

  await userEvent.click(screen.getByRole('listitem', { name: /로그인/ }))

  expect(handleSelect).toHaveBeenCalledWith(expect.any(String))
})
```

- 쿼리 우선순위: `getByRole` → `getByLabelText` → `getByText` → (마지막 수단) `getByTestId`
- `data-testid`는 다른 방법이 없을 때만 쓴다. 접근성 쿼리로 못 찾는다면 마크업 접근성에 문제가 있을 가능성이 높다.
- 클래스명이나 DOM 구조로 요소를 찾지 않는다.
- 상호작용은 `fireEvent` 대신 `userEvent`를 쓴다. 실제 입력에 가깝다.

## 모킹

**모킹은 적을수록 좋다.** 모킹이 많다는 건 설계가 결합되어 있다는 신호다.

- 모킹하는 것: `window.api`(IPC), 파일 시스템, 시간(`vi.useFakeTimers`), 난수
- 모킹하지 않는 것: 내가 만든 순수 함수, 스토어, 하위 컴포넌트

```ts
vi.mock('@renderer/features/test-runner/api/testRunnerApi', () => ({
  testRunnerApi: { run: vi.fn().mockResolvedValue([]) }
}))
```

- IPC는 래퍼 모듈([architecture-ipc.md](../architecture/architecture-ipc.md)) 한 곳만 모킹하면 된다. `window.api`를 여러 파일에서 직접 부르고 있다면 계층이 무너진 것이다.
- `afterEach`에서 모킹과 스토어 상태를 초기화한다. 테스트는 실행 순서에 의존하지 않아야 한다.

## 지켜야 할 것

- 테스트는 독립적이다. 하나만 따로 돌려도 통과해야 한다.
- 테스트 안에 `if`나 반복문을 넣지 않는다. 케이스가 여러 개면 `it.each`를 쓴다.
- 랜덤값, 현재 시각, 네트워크에 의존하지 않는다. 고정하거나 주입한다.
- 실패하는 테스트를 `skip`으로 덮지 않는다. 고치거나 지운다. 남겨야 하면 티켓 번호를 주석에 남긴다.
- 깨진 테스트를 통과시키려고 단언을 느슨하게 바꾸지 않는다. 먼저 코드가 맞는지 확인한다.
- 테스트 코드도 코드다. [code-clean.md](../code/code-clean.md)의 이름·중복 규칙을 동일하게 적용한다.

## 실행

```bash
npm run test           # 전체 실행
npm run test -- --watch
npm run test -- src/renderer/src/features/test-runner
```

커밋 전에 전체 테스트와 `npm run typecheck`를 통과시킨다.

## 도입 체크리스트

- `npm i -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
- `package.json`에 `"test": "vitest run"` 스크립트 추가
- `electron.vite.config.ts`(또는 별도 `vitest.config.ts`)에 `test` 설정 추가: `environment: 'jsdom'`, `globals: true`, `setupFiles`
- setup 파일에서 `@testing-library/jest-dom` import, `afterEach(cleanup)` 등록
- renderer alias(`@renderer`, `@shared`)를 Vitest 설정에도 동일하게 적용
