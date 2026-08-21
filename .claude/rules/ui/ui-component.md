# 컴포넌트 분리 컨벤션

컴포넌트는 "재사용하려고" 나누는 게 아니라 **책임이 섞여서** 나눈다. 재사용은 결과이지 목적이 아니다.

## 기본 형태

```tsx
interface TestResultItemProps {
  result: TestResult
  onSelect: (id: string) => void
}

export function TestResultItem({ result, onSelect }: TestResultItemProps) {
  return (
    <li onClick={() => onSelect(result.id)}>
      <span>{result.name}</span>
      <StatusBadge status={result.status} />
    </li>
  )
}
```

- 함수 선언형 컴포넌트를 쓴다. `React.FC`는 쓰지 않는다.
- Props 타입은 `<컴포넌트명>Props`로 같은 파일 위쪽에 선언한다.
- 파일 하나에 컴포넌트 하나. 같은 파일 안에서만 쓰는 아주 작은 조각은 예외로 두되, 파일 아래쪽에 모은다.
- 컴포넌트 안에서 컴포넌트를 선언하지 않는다. 렌더마다 새 타입이 되어 상태가 초기화된다.

## 두 종류로 나눈다

| 종류 | 하는 일 | 하지 않는 일 |
| --- | --- | --- |
| **컨테이너** | 스토어 구독, IPC 호출, 상태 관리, 하위 컴포넌트 조합 | 복잡한 마크업 |
| **프레젠테이셔널** | props를 받아 화면을 그림 | 데이터 가져오기, 전역 상태 접근 |

```tsx
// 컨테이너: 데이터를 모아 넘긴다
export function TestRunnerPanel() {
  const { results, isRunning, run } = useTestRunner()

  if (isRunning) return <Spinner />

  return <TestResultList results={results} onRerun={run} />
}

// 프레젠테이셔널: props만 보고 그린다
interface TestResultListProps {
  results: TestResult[]
  onRerun: (id: string) => void
}

export function TestResultList({ results, onRerun }: TestResultListProps) {
  return (
    <ul>
      {results.map((result) => (
        <TestResultItem key={result.id} result={result} onRerun={onRerun} />
      ))}
    </ul>
  )
}
```

프레젠테이셔널 컴포넌트는 스토어를 모르기 때문에 테스트가 쉽고, 다른 화면에서 그대로 쓸 수 있다. 화면을 그리는 컴포넌트의 기본값은 프레젠테이셔널이다.

## 언제 나누는가

아래 신호가 보이면 분리를 검토한다. 하나 걸린다고 무조건 나누는 건 아니고, 두 개 이상 겹치면 나눈다.

- 컴포넌트 파일이 **150줄**을 넘는다.
- JSX 중첩이 **4단계**를 넘는다.
- 같은 JSX 블록이 **3번째** 반복된다.
- 한 컴포넌트 안에서 서로 관련 없는 `useState`가 **3개 이상** 돌아간다.
- 이름을 붙이기 어렵다 → 책임이 두 개 이상 섞여 있다는 뜻이다.
- 주석으로 JSX 구역을 나누고 있다 → 그 구역이 곧 컴포넌트다.

## 언제 나누지 않는가

- 아직 한 번밖에 안 쓰는데 "나중에 재사용할 것 같아서" → 두 번째 사용처가 생기면 그때 뺀다.
- 나눈 결과 props가 **6개 이상**이 된다 → 잘못된 경계다. 자르는 위치를 다시 잡는다.
- 부모와 자식이 상태를 계속 주고받아야 한다 → 붙어 있어야 할 코드를 억지로 뗀 것이다.
- 10줄짜리 JSX를 3개 파일로 쪼개는 것 → 파일을 오가는 비용이 더 크다.

성급한 추상화는 중복보다 비싸다. 판단이 서지 않으면 **붙여둔 채로 둔다.**

## 로직은 훅으로 뺀다

JSX가 아니라 로직이 길어질 때는 컴포넌트를 쪼개지 말고 훅으로 뺀다.

```tsx
// features/test-runner/hooks/useTestRunner.ts
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

- 훅은 하나의 관심사만 다룬다. `usePageLogic` 같은 이름이 나오면 잘못 묶은 것이다.
- 훅은 값을 반환하고, DOM을 모른다.
- 컴포넌트 본문에 `useEffect`가 3개 이상 쌓이면 훅으로 나눌 신호다.

## 상태를 두는 위치

상태는 **쓰는 곳에 가장 가깝게** 둔다. 컴포넌트 안에서만 쓰면 `useState`, 부모·형제가 함께 보면 가장 가까운 공통 부모로 올린다. 처음부터 전역으로 올리지 않는다.

전역 상태와 스토어 작성 규칙은 [architecture-state.md](../architecture/architecture-state.md)를 따른다.

## Props

- props는 5개까지. 넘으면 객체로 묶거나 컴포넌트를 나눈다.
- boolean props로 모양을 분기하지 않는다. `isPrimary`, `isLarge` 대신 `variant="primary"`, `size="lg"`처럼 유니온 타입으로 받는다.
- 자식이 실제로 쓰는 값만 넘긴다. 객체 통째로 넘기고 한 필드만 쓰지 않는다.
- props 2단계 이상 내려가면(prop drilling) 스토어나 합성(`children`)을 검토한다.
- 콜백 props는 `on` 접두, 내부 핸들러는 `handle` 접두를 쓴다.

## 렌더링 규칙

```tsx
{isLoading && <Spinner />}
{results.length === 0 ? <EmptyState /> : <TestResultList results={results} />}
```

- 조건부 렌더는 삼항 연산자 1단계까지. 중첩되면 컴포넌트나 함수로 뺀다.
- `&&` 왼쪽에 숫자를 쓰지 않는다(`0`이 그대로 렌더된다). `length > 0 &&` 형태로 쓴다.
- `key`에 배열 인덱스를 쓰지 않는다. 데이터의 고유 id를 쓴다.
- `useMemo` / `useCallback` / `memo`는 기본으로 쓰지 않는다. 실제로 느린 것을 확인한 뒤에 붙인다. 예외는 하위 컴포넌트의 의존성 배열에 들어가는 함수·객체다.

## 공용으로 올리는 기준

`features/<기능>/components/`에서 시작한다. 두 번째 feature가 같은 컴포넌트를 필요로 할 때 `renderer/src/components/`로 올린다.

올릴 때 확인할 것:

- 특정 도메인 타입(`TestResult` 등)에 의존하지 않는가 → 의존하면 공용이 아니다
- 스토어를 직접 구독하지 않는가 → 구독하면 props로 바꾼 뒤 올린다
- 이름이 도메인 중립적인가 → `TestResultButton`이 아니라 `Button`
