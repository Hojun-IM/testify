# 상태 관리

전역 상태는 Zustand로 관리한다. 상태는 **쓰는 곳에 가장 가깝게** 두고, 필요해질 때만 위로 올린다.

## 어디에 둘 것인가

1. 컴포넌트 안에서만 쓰는 값 → `useState`
2. 부모·형제가 함께 봐야 하는 값 → 가장 가까운 공통 부모로 올린다
3. 화면 여러 곳에서 봐야 하는 값 → Zustand 스토어

처음부터 전역으로 올리지 않는다. 전역 상태는 어디서 바뀌는지 추적하기 어려워지는 만큼의 값을 해야 한다.

**다른 상태에서 계산할 수 있는 값은 상태로 만들지 않는다.** 렌더 시점에 계산하거나 selector에서 뽑는다.

## 스토어 작성

```ts
// src/renderer/src/features/test-runner/stores/testRunnerStore.ts
interface TestRunnerState {
  results: TestResult[]
  selectedId: string | null
  setResults: (results: TestResult[]) => void
  select: (id: string) => void
  reset: () => void
}

export const useTestRunnerStore = create<TestRunnerState>((set) => ({
  results: [],
  selectedId: null,
  setResults: (results) => set({ results }),
  select: (selectedId) => set({ selectedId }),
  reset: () => set({ results: [], selectedId: null })
}))
```

- 스토어는 도메인 단위로 나눈다. 앱 전체를 담는 스토어 하나를 만들지 않는다.
- 스토어 위치는 해당 feature의 `stores/`. 여러 feature가 공유할 때만 `renderer/src/stores/`로 올린다 ([architecture-directory.md](./architecture-directory.md)).
- 상태와 그 상태를 바꾸는 액션을 같은 스토어에 둔다.
- 화면을 벗어날 때 남으면 안 되는 상태는 `reset` 액션을 만들어 정리한다.

## 필요한 값만 구독한다

```ts
const results = useTestRunnerStore((state) => state.results)   // O
const { results } = useTestRunnerStore()                       // X
```

스토어 전체를 구독하면 관련 없는 필드가 바뀔 때도 리렌더된다. 여러 값을 한 번에 꺼내야 하면 `useShallow`를 쓴다.

```ts
const { results, selectedId } = useTestRunnerStore(
  useShallow((state) => ({ results: state.results, selectedId: state.selectedId }))
)
```

## 비동기는 스토어 밖에서

스토어 액션은 **상태 변경만** 한다. IPC 호출은 훅에 두고 결과만 스토어에 넣는다.

```ts
export function useTestRunner() {
  const results = useTestRunnerStore((state) => state.results)
  const setResults = useTestRunnerStore((state) => state.setResults)
  const [isRunning, setIsRunning] = useState(false)

  const run = useCallback(async (id: string) => {
    setIsRunning(true)
    try {
      setResults(await testRunnerApi.run(id))
    } finally {
      setIsRunning(false)
    }
  }, [setResults])

  return { results, isRunning, run }
}
```

스토어가 API를 알기 시작하면 스토어 테스트에 IPC 모킹이 따라붙는다. 경계를 지키면 스토어는 순수한 상태 전이 함수로 남는다. IPC 계층 규칙은 [architecture-ipc.md](./architecture-ipc.md)를 따른다.

## 로딩과 실패도 상태다

- 성공만 그리지 않는다. 로딩 중, 비어 있음, 실패를 모두 표현할 수 있게 설계한다.
- 위 예시처럼 한 화면에서만 쓰는 `isRunning`은 훅의 지역 상태로 충분하다. 여러 화면이 함께 봐야 할 때만 스토어로 올린다.

## 도입 체크리스트

- `npm i zustand`
- 첫 스토어는 feature 안에서 시작한다. 전역 `stores/`부터 만들지 않는다
