# Conventional Commits 규칙

## 형식

```
<type>(<scope>): <subject>

<body (선택)>

<footer (선택)>
```

## type 목록

| type | 사용 시점 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경만 (README, 주석 등) |
| `style` | 코드 동작에 영향 없는 포맷팅, 세미콜론, 공백 등 |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `perf` | 성능 개선 |
| `test` | 테스트 추가/수정 |
| `build` | 빌드 시스템, 외부 의존성 변경 (npm, gradle 등) |
| `ci` | CI 설정 파일/스크립트 변경 |
| `chore` | 위에 해당하지 않는 기타 작업 (설정 파일 등) |
| `revert` | 이전 커밋 되돌리기 |

## scope

변경된 모듈/영역을 소문자로 괄호 안에 표기 (선택 사항이지만 가능하면 포함).
예: `feat(auth): ...`, `fix(cart): ...`, `docs(readme): ...`

scope가 애매하거나 프로젝트 전역에 걸친 변경이면 생략 가능: `chore: update dependencies`

## subject 규칙

- 영문 명령형 동사로 시작하지 않아도 됨. 한글 subject 허용 (팀 합의: 영문 type + 한글 설명 병행 가능)
- 50자 이내 권장
- 마침표(`.`) 붙이지 않음
- "무엇을 왜" 했는지 명확히. "수정함", "업데이트" 같은 모호한 표현 지양

## body (선택)

- 변경 이유나 배경 설명이 필요할 때만 작성
- 72자 내외로 줄바꿈
- "무엇을" 보다 "왜" 에 집중

## footer (선택)

- 이슈 연결: `Refs: PROJ-123` 또는 `Closes: #42`
- Breaking change: `BREAKING CHANGE: <설명>`

## 예시

```
feat(auth): 소셜 로그인(구글/카카오) 기능 추가

기존 이메일 로그인만 지원하던 것을 소셜 로그인까지 확장.
OAuth2 표준 플로우를 사용.

Refs: PROJ-101
```

```
fix(cart): 수량 0일 때 장바구니 항목이 삭제되지 않는 문제 수정
```

```
chore: eslint 설정을 airbnb-base로 변경
```

## 그룹핑 시 커밋 순서 권장

1. `build`/`chore` (의존성, 설정) — 다른 커밋의 전제가 되는 경우 먼저
2. `feat`/`fix`/`refactor` (실제 코드 변경) — 논리적 단위별로 여러 개 가능
3. `test` (테스트 추가/수정)
4. `docs` (문서 갱신)