# git-flow 브랜치 네이밍 규칙

## 브랜치 종류와 베이스/머지 대상

| 작업 유형 | 접두사 | 베이스 브랜치 | 머지 대상 | 설명 |
|---|---|---|---|---|
| 신규 기능 개발 | `feature/` | `develop` | `develop` | 다음 릴리즈에 포함될 기능 개발 |
| 배포 전 버그 수정 (develop에서 발견) | `bugfix/` | `develop` | `develop` | 아직 배포되지 않은 코드의 버그 수정 |
| 배포 준비 | `release/` | `develop` | `main` + `develop` | 버전 고정, QA, 문서 정리 등 배포 직전 작업 |
| 운영 중 프로덕션 긴급 수정 | `hotfix/` | `main` | `main` + `develop` | 이미 배포된 버전의 치명적 버그 긴급 패치 |
| 구버전 유지보수 | `support/` | `main`의 해당 태그 | 해당 유지보수 브랜치 | 과거 릴리즈 버전에 대한 장기 지원 |

## 이름 형식

```
<prefix>/<kebab-case-description>
<prefix>/<issue-id>-<kebab-case-description>
```

- `prefix`: 위 표의 접두사 중 하나 (`feature`, `bugfix`, `release`, `hotfix`, `support`)
- `kebab-case-description`: 소문자 + 하이픈, 3~6개 단어 내외로 간결하게. 한글 요청은 의미를 파악해 영문으로 번역
- `issue-id`: Jira 티켓, GitHub Issue 번호 등이 대화에서 언급된 경우에만 포함 (예: `PROJ-123`, `42`)
- `release/`는 설명 대신 버전 번호를 사용: `release/1.4.0`
- `hotfix/`도 버전 번호를 쓰는 경우가 많음: `hotfix/1.4.1` 또는 `hotfix/1.4.1-payment-crash-fix`

## 예시

| 사용자 요청 | 생성되는 브랜치 |
|---|---|
| "로그인 화면에 소셜 로그인 기능 추가할 거야" | `feature/social-login` |
| "PROJ-231 이슈, 장바구니 수량 버그 고쳐야 해" | `bugfix/PROJ-231-cart-quantity` |
| "1.4.0 배포 준비 시작할게" | `release/1.4.0` |
| "운영에서 결제 크래시 나서 급하게 고쳐야 해" | `hotfix/payment-crash` |
| "1.2.x 버전 유지보수용 브랜치 필요해" | `support/1.2.x` |

## 금지 사항

- 공백, 대문자, 언더스코어(`_`), 한글, 특수문자(`/` 제외) 사용 금지
- 접두사 없이 브랜치 생성 금지 (예: 그냥 `my-work` ❌)
- 하나의 브랜치 이름에 여러 작업을 나열하는 것 금지 (예: `feature/login-and-signup-and-payment` ❌ → 작업 분리 제안)