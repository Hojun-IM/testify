---
name: requirements-specify
description: 원자적 요구사항 문장을 EARS 패턴(Ubiquitous, Event-driven, State-driven, Unwanted behavior, Optional feature, Complex)으로 정책화한다. requirements-extract 다음 단계이며 01-requirements.md를 입력받아 02-spec.md를 생성한다. 이후 requirements-plan이 이 결과를 실제 작업 계획으로 옮긴다.
---

# requirements-specify

## Purpose

요구사항을 검증 가능한 정책 문장으로 바꾼다. 일반 문장은 해석의 여지가 남지만, EARS 패턴은 트리거와 시스템 응답이 분리되어 테스트 케이스로 바로 전환할 수 있다.

이 과정에서 requirements에는 없던 기술적 정밀도(상태 코드, 정확한 경계값, 응답 형식 등)를 확정한다. 트리거 키워드(WHEN/IF 등)만 붙이고 문장 내용이 REQ와 동일하다면, 이 단계가 제 역할을 하지 못한 것이다.

## Must Follow

- **REQ 없이 SPEC을 만들지 않는다.** 모든 SPEC은 최소 1개의 REQ에서 나와야 한다.
- **요구사항의 의도를 벗어나지 않는다.** 조건, 예외, 범위 모두 원문에 근거해야 한다.
- **기술적 정밀도를 추가한다.** 상태 코드, 정확한 경계값, 응답 형식처럼 requirements에 없는 기술적 결정을 이 단계에서 확정한다. 요구사항 의도를 벗어나지 않는 범위에서 판단하고, 애매하면 질문한다.
- **패턴 선택이 애매하면 질문한다.** 짐작으로 넘어가지 않는다.
- **미확인 항목을 SPEC으로 만들지 않는다.** `01-requirements.md`의 "미확인 항목"은 아직 요구사항이 아니다. 그대로 승계해 `02-spec.md`에 남기고, 답을 받기 전까지 정책화하지 않는다.

## Input

`_workspace/<branch>/01-requirements.md`

## Workflow

1. **트리거 유형을 파악한다.** 각 REQ가 상시/이벤트/상태/예외/선택기능/복합 중 어디에 해당하는지 확인한다. 기준은 `references/ears-pattern.md` 참고.
2. **기술적으로 정밀화하며 재작성한다.** 트리거와 시스템 응답을 분리하고, requirements에 없던 상태 코드·경계값·응답 형식 등을 확정해 정형 문장으로 만든다.
3. **조건이 여러 개면 SPEC을 나눈다.** REQ 하나가 여러 조건을 담고 있거나, 정밀화 과정에서 경계 케이스가 드러나면 SPEC을 그만큼 쪼갠다.
4. **출처 REQ ID를 남긴다.** 각 SPEC에 어느 REQ에서 왔는지 표시한다.
5. **커버리지 표를 채운다.** REQ별로 어떤 SPEC이 나왔는지 역방향으로 적는다. 대응 SPEC이 없는 REQ가 보이면 누락이므로 그 자리에서 처리한다.

## Output

`_workspace/<branch>/02-spec.md` (`templates/spec.template.md` 템플릿 참조)

## Done When

- 모든 SPEC이 EARS 6패턴 중 하나의 정확한 문법을 따른다.
- 모든 SPEC이 출처 REQ ID를 가진다.
- 모든 REQ가 최소 1개 SPEC에 반영됐다.
- 각 SPEC이 대응 REQ보다 기술적으로 더 정밀하다. 트리거 키워드만 붙이고 내용이 REQ와 동일한 SPEC이 있다면 재작업한다.
- 커버리지 표에 대응 SPEC이 비어 있는 REQ가 없다.
