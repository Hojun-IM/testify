# EARS 패턴 가이드

EARS(Easy Approach to Requirements Syntax)는 요구사항을 6가지 정형 문법 중 하나로 작성하는 방법이다.

## Ubiquitous (상시)

조건 없이 항상 적용된다.
`시스템은 <응답>한다.`
예: 시스템은 모든 API 응답을 JSON으로 반환한다.

## Event-driven (이벤트 기반)

특정 이벤트가 발생했을 때.
`WHEN <트리거>, 시스템은 <응답>한다.`
예: WHEN 사용자가 로그인 버튼을 클릭하면, 시스템은 인증 토큰을 발급한다.

## State-driven (상태 기반)

특정 상태가 유지되는 동안.
`WHILE <상태>, 시스템은 <응답>한다.`
예: WHILE 세션이 만료되지 않은 동안, 시스템은 인증된 요청을 허용한다.

## Unwanted behavior (예외 처리)

원치 않는 조건이 발생했을 때.
`IF <조건>, THEN 시스템은 <응답>한다.`
예: IF 비밀번호가 5회 연속 틀리면, THEN 시스템은 계정을 잠근다.

## Optional feature (선택 기능)

특정 기능이 활성화된 경우에만.
`WHERE <기능 포함 조건>, 시스템은 <응답>한다.`
예: WHERE 2단계 인증이 활성화된 경우, 시스템은 로그인 시 인증 코드를 요구한다.

## Complex (복합)

위 패턴을 조합한다.
`WHILE <상태>, WHEN <트리거>, 시스템은 <응답>한다.`
예: WHILE 관리자 모드인 동안, WHEN 사용자가 삭제를 요청하면, 시스템은 확인 없이 즉시 삭제한다.

## 선택 기준

- 항상 참이면 Ubiquitous
- 순간적 이벤트면 Event-driven
- 지속되는 상태면 State-driven
- 실패나 에러 처리면 Unwanted behavior
- 켜고 끌 수 있는 기능이면 Optional feature
- 조건이 두 개 이상 겹치면 Complex
