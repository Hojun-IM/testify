# 클린 코드

코드는 쓰는 시간보다 읽는 시간이 훨씬 길다. 기준은 하나다. **처음 보는 사람이 위에서 아래로 한 번 읽고 이해할 수 있는가.**

## 이름

이름이 좋으면 주석이 필요 없다.

```ts
// X
const d = results.filter((r) => r.s === 'failed').length

// O
const failedCount = results.filter((result) => result.status === 'failed').length
```

- 변수는 "무엇인지", 함수는 "무엇을 하는지"를 이름에 담는다.
- 이름의 길이는 쓰이는 범위에 비례한다. 3줄짜리 루프의 `i`는 괜찮고, 모듈 전역의 `d`는 안 된다.
- 같은 개념에는 같은 단어를 쓴다. `fetch`, `get`, `load`를 섞어 쓰지 않는다.
- 타입에서 이미 드러나는 정보를 이름에 반복하지 않는다. `resultArray` 대신 `results`.

## 함수는 한 가지만 한다

```ts
// X: 조회 + 변환 + 저장 + 알림
async function processResults() { ... }

// O
const raw = await fetchResults()
const results = normalizeResults(raw)
await saveResults(results)
notifyCompleted(results.length)
```

- 함수 설명에 "그리고"가 들어가면 나눌 신호다.
- 함수 길이는 화면 하나(약 30줄)를 넘지 않는 걸 목표로 한다. 넘으면 이유가 있어야 한다.
- 값을 반환하는 함수는 부수 효과를 만들지 않는다. 상태를 바꾸는 함수는 값을 반환하지 않는다.

## 중첩을 줄인다

```ts
// X
function save(config: Config | null) {
  if (config) {
    if (config.isValid) {
      if (!config.isReadOnly) {
        write(config)
      }
    }
  }
}

// O
function save(config: Config | null) {
  if (!config) return
  if (!config.isValid) return
  if (config.isReadOnly) return
  write(config)
}
```

- 예외 케이스를 위에서 먼저 걷어내고, 본문은 정상 흐름만 남긴다.
- `else`는 대부분 없앨 수 있다.
- 들여쓰기 3단계를 넘으면 함수를 나눈다.

## 매직 값을 없앤다

```ts
// X
if (retryCount > 3) { ... }
setTimeout(poll, 30000)

// O
const MAX_RETRY_COUNT = 3
const POLL_INTERVAL_MS = 30_000
```

- 숫자와 문자열 리터럴에 의미가 있으면 이름 있는 상수로 뺀다.
- 단위는 이름에 넣는다. `timeout`이 아니라 `timeoutMs`.
- 여러 곳에서 쓰는 상수는 해당 feature의 `model/` 또는 `shared/`에 둔다.

## 중복은 세 번째에 정리한다

- 1번: 그냥 쓴다. 2번: 그냥 둔다. 3번: 추출한다.
- 형태가 같아도 **바뀌는 이유가 다르면** 중복이 아니다. 억지로 합치면 나중에 조건 분기로 되돌아온다.
- 잘못된 추상화는 중복보다 비싸다. 합칠지 애매하면 두고 본다.

## 죽은 코드는 지운다

- 주석 처리된 코드, 안 쓰는 함수, 안 쓰는 export를 남기지 않는다. Git이 기억한다.
- "혹시 몰라서" 남기는 코드가 가장 오래 남는다.
- 안 쓰는 의존성은 `package.json`에서 제거한다.

## 방어적으로 쓰되 조용히 넘기지 않는다

```ts
// X: 실패를 삼킨다
try { await save(config) } catch { }

// O
try {
  await save(config)
} catch (error) {
  console.error('설정 저장 실패', error)
  showToast('설정을 저장하지 못했습니다')
}
```

- 처리할 수 없는 에러는 위로 올린다. 잡았으면 반드시 무언가 한다.
- 값이 없을 수 있는 곳에서는 기본값을 정하거나 명시적으로 실패시킨다. `!`(non-null assertion)로 넘기지 않는다.

## 리뷰에서 보는 것

| 항목 | 질문 |
| --- | --- |
| 이름 | 이름만 보고 역할을 알 수 있는가 |
| 크기 | 함수/컴포넌트가 한 가지 일만 하는가 |
| 위치 | 이 파일에 있는 게 맞는가 ([architecture-directory.md](../architecture/architecture-directory.md)) |
| 경계 | 계층을 건너뛰지 않는가 (컴포넌트 → `window.api` 직접 호출 등) |
| 에러 | 실패했을 때 사용자가 무슨 일인지 알 수 있는가 |
| 타입 | `any`, `as`, `!`가 있는가. 있다면 근거가 있는가 |
| 테스트 | 바뀐 동작을 확인하는 테스트가 있는가 ([test-convention.md](../test/test-convention.md)) |
| 잔여물 | `console.log`, 주석 처리된 코드, TODO 없는 미완성이 남아 있는가 |

## 리팩토링

- 동작을 바꾸는 커밋과 구조를 바꾸는 커밋을 섞지 않는다 ([git-commit.md](../git/git-commit.md)).
- 리팩토링 전에 테스트를 먼저 확보한다. 확인할 방법이 없으면 리팩토링이 아니라 재작성이다.
- 지나가다 발견한 개선은 별도 커밋 또는 별도 티켓으로 분리한다. 리뷰 범위를 흐리지 않는다.
