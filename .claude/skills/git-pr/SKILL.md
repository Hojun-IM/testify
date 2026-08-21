---
name: git-pr
description: Prepares and creates a pull request following this project's PR rules (.claude/rules/git/git-pr.md), ticket based title and a structured body covering background, changes, and testing. Use when the user asks to open a PR, "PR 만들어줘", "PR 올려줘", or when a feature or fix branch is ready to merge into develop.
---

# git-pr

이 프로젝트의 PR 규칙에 따라 PR을 준비하고 생성합니다. 규칙 원문은 `.claude/rules/git/git-pr.md`에 있으며 항상 먼저 읽고 적용합니다.

## 사용 시점

작업 브랜치의 변경이 끝나 `develop`으로 머지할 준비가 되었을 때 사용합니다.

## 절차

1. 현재 브랜치가 `feature/<티켓 ID>` 또는 `fix/<티켓 ID>` 형식인지 확인하고 티켓 ID를 추출한다.
2. `git log`와 `git diff`로 브랜치의 전체 변경 사항을 파악한다.
3. `<type>(<티켓 ID>): <제목>` 형식으로 PR 제목을 작성한다. type은 커밋 규칙과 동일하게 고른다.
4. 아래 순서로 본문을 작성한다.
   - 작업 배경 및 목적, 티켓 ID 명시
   - 변경 사항, 리뷰어 입장에서 변경 단위를 요약
   - 테스트 방법, 확인한 절차나 실행 명령
   - 참고 사항, 특이사항이나 후속 작업이 있을 때만
5. UI 변경이 있으면 스크린샷이나 GIF 첨부를 안내한다.
6. 제목과 본문을 사용자에게 보여주고 확인받은 뒤 PR을 생성한다.

## 주의사항

제목과 본문만 읽고도 코드를 열어보기 전에 변경 범위를 예측할 수 있어야 한다. 변경 사항은 커밋 목록을 그대로 나열하지 않고 의미 단위로 요약한다. PR 범위가 너무 크면 티켓 단위로 나눌 수 있는지 먼저 검토한다.
