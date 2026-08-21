# 개발 규칙 가이드

이 디렉토리는 testify 프로젝트의 개발 규칙을 담는다. 신규 합류자(사람/에이전트)는 이 문서부터 읽고 필요한 규칙 문서로 이동한다.

## 규칙 문서 구성

규칙은 주제별 디렉토리로 나누고, 파일명은 `<디렉토리>-<주제>.md` 형식으로 맞춘다.

```
.claude/rules/
├── README.md                          # 이 문서
├── architecture/                      # 코드의 위치와 계층
│   ├── architecture-directory.md
│   ├── architecture-ipc.md
│   └── architecture-state.md
├── code/                              # 코드를 쓰는 방식
│   ├── code-convention.md
│   └── code-clean.md
├── ui/                                # 화면을 만드는 방식
│   ├── ui-component.md
│   └── ui-styling.md
├── test/                              # 테스트
│   └── test-convention.md
└── git/                               # 브랜치·커밋·PR
    ├── git-branch.md
    ├── git-commit.md
    └── git-pr.md
```

## 언제 무엇을 읽는가

| 상황 | 문서 |
| --- | --- |
| 파일을 어디에 둘지 정할 때 | [architecture-directory.md](./architecture/architecture-directory.md) |
| 메인 프로세스와 통신할 때 | [architecture-ipc.md](./architecture/architecture-ipc.md) |
| 상태를 다룰 때 | [architecture-state.md](./architecture/architecture-state.md) |
| 코드를 작성할 때 (네이밍, 타입, import, 에러 처리) | [code-convention.md](./code/code-convention.md) |
| 코드를 다듬거나 리뷰할 때 | [code-clean.md](./code/code-clean.md) |
| 컴포넌트를 만들거나 쪼갤 때 | [ui-component.md](./ui/ui-component.md) |
| UI 스타일을 작성할 때 | [ui-styling.md](./ui/ui-styling.md) |
| 테스트를 작성할 때 | [test-convention.md](./test/test-convention.md) |
| 브랜치를 만들 때 | [git-branch.md](./git/git-branch.md) |
| 커밋할 때 | [git-commit.md](./git/git-commit.md) |
| PR을 올릴 때 | [git-pr.md](./git/git-pr.md) |

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 앱 | Electron (main / preload / renderer 3 프로세스) |
| 빌드 | electron-vite + Vite |
| 언어 | TypeScript (strict) |
| UI | React + TypeScript |
| 스타일 | Tailwind CSS |
| 상태 | Zustand + IPC 래퍼 레이어 |
| 테스트 | Vitest (+ React Testing Library) |

> 현재 저장소에는 Electron/TypeScript 기본 골격만 있고 React, Tailwind, Zustand, Vitest는 아직 설치되어 있지 않다. 이 문서는 도입 시점의 목표 구조를 정의한 것이며, 각 문서의 "도입 체크리스트"를 따라 설정한다.

## 명령어

```bash
npm run dev        # 개발 모드 실행 (HMR)
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 미리보기
npm run typecheck  # 타입 검사 (main/preload + renderer)
```

## 작업 흐름 요약

```
requirements-extract   노션 티켓/요청 → 요구사항 확정 + feature 브랜치 생성 → 01-requirements.md
        ↓
requirements-specify   요구사항 → EARS 정책화                              → 02-spec.md
        ↓
requirements-plan      정책 → 영향 범위·커밋 단위 분해·테스트 계획          → 03-plan.md
        ↓
구현                   이 문서들의 규칙에 맞게 작업
        ↓
git-commit / git-pr    논리적 단위로 커밋하고 develop으로 PR
```

산출물은 `_workspace/<branch>/`에 쌓이며 커밋하지 않는다(`.gitignore`). 각 단계의 절차는 `.claude/skills/`의 해당 스킬에 정의되어 있다.

구현을 시작하기 전에 `npm run typecheck`와 테스트가 통과하는지 확인하고, 커밋 단위는 `03-plan.md`의 작업 분해를 그대로 따른다.

## 규칙을 대하는 태도

- 규칙은 "생각을 줄이기 위한 기본값"이다. 대부분의 경우 따르고, 어겨야 할 이유가 있으면 PR 본문에 근거를 남긴다.
- 규칙과 실제 코드가 어긋나면 둘 중 하나가 틀린 것이다. 발견한 사람이 문서를 고치거나 이슈로 남긴다.
- 새 규칙은 실제로 두 번 이상 반복된 판단만 추가한다. 가정만으로 규칙을 늘리지 않는다.
- 규칙을 추가할 때는 기존 디렉토리에 넣을 수 있는지 먼저 본다. 새 디렉토리는 문서가 두 개 이상 모일 때 만든다. 추가 후 이 README의 목록을 갱신한다.
