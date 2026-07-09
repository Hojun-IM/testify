---
name: git-pr
description: Reviews the current branch's history and uncommitted changes, groups related changes into logical Conventional Commits, and opens a GitHub pull request with a properly formatted title and body following the team's git-flow convention. Use this skill whenever the user says they finished a task and want to commit + open a PR, says "커밋하고 PR 올려줘", "작업 마무리하고 PR 만들어줘", "이 작업 리뷰 요청할래", "PR 열어줘", or asks to wrap up work on a feature/bugfix/release/hotfix branch. Also use when the user just asks to "commit this" in a way that implies the work is done and ready for review. Always read references/commit-convention.md and references/pr-template.md before committing or opening the PR.
---

# git-pr: 커밋 정리 및 PR 생성 스킬

현재 브랜치의 변경 이력과 작업 diff를 분석해서, 연관된 변경끼리 묶어 Conventional Commits 규칙으로 커밋하고, git-flow 규칙에 맞는 base 브랜치로 GitHub PR을 생성합니다.

커밋 메시지 상세 규칙은 `references/commit-convention.md`, PR 제목/본문 템플릿은 `references/pr-template.md`를 반드시 먼저 읽고 적용하세요.

## 언제 사용하는가

- 사용자가 작업을 끝내고 "커밋하고 PR 만들어줘", "리뷰 요청할래" 등으로 요청할 때
- 명시적으로 "PR"이라는 단어가 없어도, "이 작업 마무리됐어", "이제 올려줘" 등 작업 완료 + 공유 의도가 보일 때

## 워크플로우

### 1단계: 현재 상태 파악

```bash
git branch --show-current
git status --short
git fetch origin
git log --oneline <base-branch>..HEAD   # base 판단 전이라면 develop과 main 둘 다 확인
git diff --stat
```

- 현재 브랜치 이름의 접두사(`feature/`, `bugfix/`, `release/`, `hotfix/`, `support/`)로 작업 유형과 base 브랜치를 판단합니다 (`references/pr-template.md`의 표 참고).
- 만약 `main`이나 `develop`에서 직접 작업 중이라면 **커밋하지 말고** 사용자에게 알리고, 먼저 `git-branch` 스킬로 브랜치를 분리할 것을 제안하세요.
- 커밋할 변경사항이 없다면 (이미 다 커밋되어 있다면) 커밋 단계를 건너뛰고 바로 4단계(PR 생성)로 갑니다.

### 2단계: 변경사항을 논리적 단위로 그룹핑

`git diff` / `git status`로 변경된 파일 목록과 내용을 확인하고, 아래 기준으로 묶습니다.

- 같은 기능/모듈을 구현하는 파일들 (예: API 라우트 + 서비스 로직 + 관련 테스트)
- 스타일/포맷팅 변경은 기능 변경과 분리
- 설정 파일, 의존성 변경(`package.json`, `requirements.txt` 등)은 별도 커밋으로 분리
- 문서 변경(`README`, `docs/`)은 별도 커밋으로 분리
- 하나의 커밋이 여러 관심사를 섞지 않도록 함 (Single Responsibility)

각 그룹에 대해 어떤 파일을 어떤 커밋으로 묶을지 사용자에게 간단히 요약해서 보여준 뒤 진행합니다. (예: "3개 커밋으로 나눌게요: 1) feat: 소셜 로그인 API 2) test: 소셜 로그인 테스트 3) docs: README 업데이트")

### 3단계: 그룹별 커밋 생성

각 그룹마다:

```bash
git add <해당 파일들>
git commit -m "<type>(<scope>): <subject>" -m "<body(선택)>"
```

- 커밋 타입/형식은 `references/commit-convention.md`를 정확히 따릅니다.
- 커밋 후 `git status --short`로 빠진 파일이 없는지 확인합니다.
- 모든 그룹 커밋이 끝나면 `git log --oneline <base-branch>..HEAD`로 최종 커밋 목록을 사용자에게 보여줍니다.

### 4단계: base 브랜치 및 PR 대상 결정

- `feature/`, `bugfix/` → base: `develop`
- `release/` → base: `main` (머지 후 `develop`에도 별도 머지 필요함을 사용자에게 안내)
- `hotfix/` → base: `main` (머지 후 `develop`에도 별도 머지 필요함을 사용자에게 안내)
- `support/` → base: 해당 유지보수 브랜치

### 5단계: PR 제목/본문 생성 및 열기

`references/pr-template.md`의 템플릿에 맞춰 제목과 본문을 작성한 뒤:

```bash
git push -u origin <current-branch>
gh pr create --base <base-branch> --head <current-branch> --title "<PR 제목>" --body "<PR 본문>"
```

- `gh` CLI 인증이 안 되어 있거나 실패하면, 에러 메시지를 사용자에게 그대로 전달하고 `gh auth login`이 필요한지 안내합니다.
- PR 생성 성공 시 반환된 PR URL을 사용자에게 전달합니다.

### 6단계: 결과 요약

생성된 커밋 목록, PR 링크, base 브랜치를 정리해서 안내합니다. `release/`나 `hotfix/`인 경우 `develop`으로도 머지가 필요하다는 점을 다시 한번 상기시킵니다.

## 주의사항

- **강제 푸시(`--force`) 금지.** 히스토리를 덮어써야 할 상황이면 반드시 사용자 확인을 먼저 받습니다.
- 커밋되지 않은 변경 중 `.env`, 키/시크릿으로 보이는 파일은 커밋하지 말고 사용자에게 확인을 구합니다.
- 커밋 메시지와 PR 제목은 나중에 `git log`만 보고도 무엇을 했는지 알 수 있도록 구체적으로 작성합니다 (예: `fix: 버그 수정` ❌ → `fix(cart): 수량 0일 때 장바구니 삭제 안 되는 문제 수정` ✅).