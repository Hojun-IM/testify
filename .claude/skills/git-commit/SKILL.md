---
name: git-commit
description: Stages changes and writes a commit message following this project's commit rules (.claude/rules/git/git-commit.md), one logical change per commit, Conventional Commits format with ticket ID. Use when the user asks to commit, "커밋해줘", "커밋 만들어줘", or when a task is finished and changes are ready to be committed.
---

# git-commit

이 프로젝트의 커밋 규칙에 따라 변경 사항을 커밋합니다. 규칙 원문은 `.claude/rules/git/git-commit.md`에 있으며 항상 먼저 읽고 적용합니다.

## 사용 시점

사용자가 커밋을 요청하거나 작업을 마치고 변경 사항을 정리해야 할 때 사용합니다.

## 절차

1. `git status`와 `git diff`로 변경 사항을 확인한다.
2. 변경 사항을 논리적 단위로 나눈다. 서로 관련 없는 변경은 각각 별도 커밋으로 분리한다.
3. 현재 브랜치명에서 티켓 ID를 추출한다. 브랜치명이 `feature/<티켓 ID>` 또는 `fix/<티켓 ID>` 형식이 아니면 사용자에게 티켓 ID를 확인한다.
4. 각 단위마다 관련 파일만 `git add`로 스테이징한다.
5. `<type>(<티켓 ID>): <제목>` 형식으로 메시지를 작성한다. type은 feat fix refactor style docs test chore 중에서 고른다. 제목만으로 배경이 설명되지 않으면 본문을 덧붙인다.
6. 커밋을 생성하기 전에 스테이징된 내용과 메시지를 사용자에게 보여주고 확인받는다.
7. 커밋 후 결과를 짧게 요약한다.

## 주의사항

커밋 단위와 메시지는 한눈에 내용이 파악될 만큼 명확해야 한다. "수정" "업데이트" 같은 모호한 표현만 쓰지 않는다. 빌드가 깨지는 상태로 커밋하지 않는다.
