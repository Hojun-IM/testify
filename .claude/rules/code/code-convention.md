# 개발 컨벤션

언어와 도구를 쓰는 방식을 통일한다. 여기 없는 것은 [code-clean.md](./code-clean.md)를 따른다.

## 포맷

기존 코드 스타일을 그대로 따른다.

- 들여쓰기 2칸, 세미콜론 없음, 작은따옴표
- 한 줄 최대 100자
- 파일 끝에 개행 하나

포맷은 논쟁하지 않는다. Prettier 설정이 추가되면 그 결과를 정답으로 삼는다.

## TypeScript

### any 금지

```ts
// X
function parse(input: any) {}

// O
function parse(input: unknown) {
  if (typeof input !== 'string') throw new Error('문자열이 아닙니다')
  return input.trim()
}
```

- 외부에서 들어오는 값(IPC 응답, 파일, 네트워크)은 `unknown`으로 받고 좁혀서 쓴다.
- `as`는 타입을 확인할 방법이 없을 때만 쓴다. 쓴다면 왜 안전한지 주석을 남긴다.
- `@ts-ignore` 대신 `@ts-expect-error`를 쓰고 이유를 적는다.

### 타입 정의

```ts
// 객체 형태 → interface
interface TestResult {
  id: string
  status: TestStatus
  durationMs: number
}

// 유니온, 함수, 매핑 → type
type TestStatus = 'idle' | 'running' | 'passed' | 'failed'
```

- 문자열 상수 집합은 enum 대신 유니온 타입을 쓴다.
- 함수의 반환 타입은 public API(모듈 밖으로 나가는 함수)에는 명시하고, 지역 함수는 추론에 맡긴다.
- 옵셔널(`?`)과 `| undefined`를 섞지 않는다. "값이 없을 수 있음"은 옵셔널로 통일한다.

### 불변성

```ts
const next = [...items, item]           // O
const next = { ...state, count: 1 }     // O
items.push(item)                        // X (스토어/props 데이터 직접 변형)
```

- 배열/객체는 새로 만들어 반환한다. 지역 변수 내부에서만 쓰는 누적은 예외로 둔다.
- 함수 파라미터를 수정하지 않는다.

## 네이밍

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| 변수, 함수 | camelCase | `runTest`, `resultCount` |
| 컴포넌트, 타입, 클래스 | PascalCase | `TestResultItem`, `TestResult` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| boolean | `is`/`has`/`can`/`should` 접두 | `isRunning`, `hasError` |
| 이벤트 핸들러 | `handle` 접두, props는 `on` 접두 | `handleClick`, `onSelect` |
| 비동기 함수 | 동사로 시작 | `fetchResults`, `saveConfig` |
| IPC 채널 | `도메인:동작` | `test:run`, `config:save` |

- 축약어를 만들지 않는다. `res`, `tmp`, `data2` 대신 `response`, `draftConfig`, `filteredResults`.
- 반대 개념은 반대말로 짝을 맞춘다. `open`/`close`, `add`/`remove`, `show`/`hide`.

## import

```ts
// 1. 외부 패키지
import { useEffect } from 'react'
import { app, BrowserWindow } from 'electron'

// 2. 내부 alias
import { Button } from '@renderer/components/Button'
import { IPC_CHANNEL } from '@shared/ipc'

// 3. 상대 경로
import { useTestRunner } from './hooks/useTestRunner'

// 4. 타입 전용
import type { TestResult } from '@shared/types'
```

- 그룹 사이에 빈 줄을 넣는다.
- 타입만 쓰는 import는 `import type`으로 분리한다.
- 와일드카드 import(`import * as`)는 네임스페이스가 꼭 필요할 때만 쓴다.

## 함수

```ts
// X: 조건이 중첩되고 마지막에 결론이 나옴
function getLabel(result: TestResult) {
  if (result) {
    if (result.status === 'failed') {
      return '실패'
    } else {
      return '성공'
    }
  }
  return ''
}

// O: 예외를 먼저 걷어내고 본문은 평평하게
function getLabel(result: TestResult | null): string {
  if (!result) return ''
  return result.status === 'failed' ? '실패' : '성공'
}
```

- 조기 반환으로 중첩을 줄인다. 들여쓰기 3단계를 넘으면 함수를 나눈다.
- 파라미터는 3개까지. 넘으면 객체로 묶는다.
- boolean 파라미터로 동작을 분기하지 않는다. 함수를 둘로 나눈다.

## 비동기

```ts
// O
try {
  const result = await runTest(id)
  setResult(result)
} catch (error) {
  logger.error('테스트 실행 실패', error)
  setError(toMessage(error))
}
```

- `then/catch` 체인 대신 `async/await`를 쓴다.
- 독립적인 비동기 작업은 `Promise.all`로 병렬 실행한다. 순차 `await`를 습관적으로 쓰지 않는다.
- `await`를 붙이지 않은 Promise를 방치하지 않는다. 의도한 fire-and-forget이면 `void`를 붙이고 주석을 남긴다.

## 에러 처리

- `catch (error)`의 `error`는 `unknown`이다. 메시지를 꺼낼 때는 좁혀서 쓴다.
- 잡아서 아무것도 안 하는 `catch`를 만들지 않는다. 최소한 로그를 남긴다.
- 사용자에게 보여줄 메시지와 로그에 남길 원인을 구분한다. 스택 트레이스를 그대로 UI에 노출하지 않는다.
- 메인 프로세스 에러는 IPC 응답에서 직렬화 가능한 형태로 변환해 전달한다. Error 객체는 그대로 넘어가지 않는다.

## 로깅

- `console.log`는 커밋하지 않는다. 개발 중 확인용은 지우고 올린다.
- 남겨야 하는 로그는 `console.error` / `console.warn`으로 수준을 구분한다.
- 로그에 개인정보, 토큰, 파일 전체 내용을 남기지 않는다.

## 주석

- "무엇을"이 아니라 "왜"를 적는다. 코드가 설명하는 것을 반복하지 않는다.
- 이상해 보이는 코드(우회, 라이브러리 버그 대응)에는 반드시 이유를 남긴다.
- 주석 처리한 코드는 커밋하지 않는다. 히스토리에 남아 있다.
- TODO는 `// TODO(TICKET-123): 내용` 형식으로 근거를 남긴다.

## 커밋 전 확인

```bash
npm run typecheck
npm run test        # 테스트 도입 후
```

타입 에러가 있는 상태로 커밋하지 않는다.
