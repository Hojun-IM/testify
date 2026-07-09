---
name: git-branch
description: Creates a new git branch that follows the team's git-flow branch naming convention (feature/, release/, hotfix/, bugfix/, support/ off of develop or main). Use this skill whenever the user says they're about to start a new task, wants to "start work on X", asks to create/checkout a branch, mentions "브랜치 만들어줘", "새 작업 시작", "이 기능 작업할 브랜치", or describes a piece of work they're about to begin (a feature, a bug fix, a hotfix, a release) without yet having a branch for it. Trigger proactively even if the user doesn't say the word "branch" explicitly — if they describe upcoming work and are in a git repo, offer to create the correctly-named branch for them. Always read references/branch-naming.md for the exact naming rules before creating a branch.
---

# git-branch: git-flow 브랜치 생성 스킬

사용자가 앞으로 진행할 작업을 설명하면, 팀의 git-flow 규칙에 맞는 이름으로 브랜치를 생성합니다.
브랜치 이름 규칙의 상세 표와 예시는 반드시 `references/branch-naming.md`를 먼저 읽고 적용하세요.

## 언제 사용하는가

- 사용자가 새 기능/버그수정/긴급수정/배포 작업을 시작하려고 할 때
- "브랜치 만들어줘", "이 작업용 브랜치 파줘", "작업 시작할게" 등
- 명시적으로 "branch"라는 단어를 쓰지 않아도, 앞으로 할 작업을 설명하며 아직 브랜치가 없는 상태라면 먼저 브랜치 생성을 제안

## 워크플로우

### 1단계: 작업 내용 파악

사용자의 설명에서 아래 정보를 추출합니다. 빠진 정보는 반드시 되묻지 말고, 애매하면 가장 합리적인 기본값으로 진행한 뒤 무엇을 가정했는지 짧게 알려주세요.

- **작업 유형**: 기능 추가 / 버그 수정(아직 배포 전) / 배포 준비 / 운영 중인 프로덕션 긴급 수정 / 구버전 유지보수 중 어떤 것인지
- **작업 설명**: 브랜치 이름에 들어갈 핵심 내용 (한글로 설명해도 영문 kebab-case로 변환)
- **이슈 번호**: Jira/GitHub Issue 번호가 대화 중 언급되었다면 포함, 없으면 생략 (억지로 만들어내지 않음)

### 2단계: 브랜치 타입과 베이스 브랜치 결정

`references/branch-naming.md`의 표를 참고해 작업 유형 → 브랜치 접두사 → 베이스 브랜치를 매핑합니다. 예: 신규 기능이면 `feature/`, 베이스는 `develop`. 운영 중 긴급 장애 수정이면 `hotfix/`, 베이스는 `main`.

### 3단계: 브랜치 이름 생성

`<prefix>/<kebab-case-설명>` 형식으로 만듭니다 (이슈 번호가 있으면 `<prefix>/<issue-id>-<kebab-case-설명>`). 정확한 규칙과 예시는 references 파일 참고.

### 4단계: 저장소 상태 확인 및 브랜치 생성

다음 순서로 bash 명령을 실행합니다. 각 단계 결과를 확인하고 실패 시 사용자에게 원인을 설명하세요.

```bash
# 1. 현재 브랜치 및 변경사항 확인 (커밋되지 않은 변경이 있으면 사용자에게 알리고 중단 여부 확인)
git status --short
git branch --show-current

# 2. 베이스 브랜치 최신화
git fetch origin
git checkout <base-branch>   # 예: develop 또는 main
git pull origin <base-branch>

# 3. 새 브랜치 생성 및 전환
git checkout -b <prefix>/<branch-name> <base-branch>
```

- 만약 원격에 동일 이름 브랜치가 이미 있다면, 새로 만들지 말고 사용자에게 알린 뒤 기존 브랜치로 전환할지 물어봅니다.
- `develop` 브랜치가 로컬/원격에 없는 저장소(예: GitHub-flow만 쓰던 저장소를 git-flow로 전환하는 초기 상태)라면, 먼저 `main`에서 `develop`을 생성할지 사용자에게 확인 후 진행합니다.

### 5단계: 원격 푸시 여부 확인

브랜치 생성 직후 바로 푸시할지 사용자에게 묻지 않고 기본적으로는 로컬에만 생성합니다. 단, 사용자가 "바로 푸시해줘", "원격에도 만들어줘"라고 하면:

```bash
git push -u origin <prefix>/<branch-name>
```

### 6단계: 결과 요약

생성된 브랜치 이름, 베이스 브랜치, 다음에 할 일(코드 작업 후 `git-pr` 스킬로 커밋/PR 생성)을 간단히 안내합니다.

## 주의사항

- `main`이나 `develop` 브랜치에서 직접 작업하지 않도록 항상 새 브랜치를 만듭니다.
- 브랜치 이름은 소문자, 하이픈(-)만 사용, 공백/한글/특수문자 금지.
- 하나의 브랜치는 하나의 작업 단위(issue)만 다룹니다. 여러 작업이 섞여 있다면 분리를 제안하세요.