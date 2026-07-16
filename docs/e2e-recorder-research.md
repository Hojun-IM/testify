# E2E 테스트 레코더 기능 리서치

Testify에 "브라우저를 띄워서 실시간으로 요소를 선택 → 테스트 케이스로 정의 → 저장된 케이스를 자동 재실행"하는 기능을 추가하기 위한 기술 리서치. Claude Code의 Browser pane 도구(CDP 기반 원격 브라우저 제어)를 사용하며 관찰한 동작을 근거로, Electron 기반인 Testify에 적용 가능한 아키텍처를 정리한다.

## 1. 참고 대상: Claude Code Browser pane의 추정 아키텍처

Anthropic 내부 구현이라 소스는 확인 불가하지만, 도구 스펙과 실제 관찰된 동작으로 아키텍처를 추론할 수 있다.

**핵심 근거**: `javascript_tool`로 `element.dispatchEvent(new MouseEvent('mouseover', ...))`를 실행해도 CSS `:hover`가 발동하지 않았지만, `computer` 툴의 `hover` 액션(ref 기반)은 실제 `:hover` 스타일을 정상 트리거했다. 이는 "페이지 내부 JS로 이벤트를 흉내내는 것"과 "브라우저 엔진 레벨에서 진짜 입력 이벤트를 주입하는 것"의 차이이며, 후자가 가능하려면 브라우저를 원격 제어 프로토콜로 붙잡고 있어야 한다.

### Chrome DevTools Protocol(CDP) 매핑

| 도구 기능 | 대응되는 CDP 도메인/메서드 |
|---|---|
| `navigate` | `Page.navigate` |
| `read_page` (ref 태그 붙은 접근성 트리) | `Accessibility.getFullAXTree` (또는 DOM 스냅샷 + ARIA 계산) |
| `computer` (좌표/ref 클릭·타이핑·hover) | `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` |
| `computer screenshot/zoom` | `Page.captureScreenshot` |
| `javascript_tool` | `Runtime.evaluate` |
| `read_console_messages` | `Log.entryAdded` / `Runtime.consoleAPICalled` |
| `read_network_requests` | `Network.requestWillBeSent` / `Network.responseReceived` / `Network.getResponseBody` |
| `find` (자연어 요소 검색) | 접근성 트리를 뽑은 뒤 후처리(매칭)하는 상위 레이어로 추정 — CDP 자체엔 없음 |

`ref_N` 시스템이 핵심 설계 포인트다. 좌표 클릭은 스크롤/리렌더로 쉽게 깨지지만(이번 세션에서도 `preview_resize` 이후 좌표가 어긋나는 문제를 겪음), `ref_N`은 특정 DOM 노드를 안정적으로 다시 가리키는 핸들이라 훨씬 견고하다. Playwright의 `Locator`, Puppeteer의 `ElementHandle`과 같은 개념.

`preview_start/logs/stop`(개발 서버 기동)은 브라우저 자동화와 무관하게 하위 프로세스 실행 + stdout 파싱 + 포트 스캔으로 구현된 것으로 보임.

## 2. Testify에 적용할 스택 제안

**결론: Playwright를 코어로 사용.** 이유:

1. **Electron이라 유리함.** Electron = Chromium이므로, 외부 CDP 브라우저를 따로 띄우고 스크린샷을 스트리밍할 필요 없이 `BrowserView`/`WebContentsView`(또는 `<webview>`)로 대상 페이지를 앱 안에 직접 임베드할 수 있다.
2. **Playwright가 CDP를 이미 잘 감싸놓음.** `playwright-core`를 Electron 메인 프로세스에서 사용해 Electron이 띄운 Chromium에 CDP로 붙거나(`chromium.connectOverCDP`), Playwright가 자체 관리하는 브라우저를 별도로 띄워도 됨.
3. **레코딩/재실행 참고 구현체가 이미 존재.** `npx playwright codegen <url>` 실행 시 브라우저가 뜨고 클릭/입력마다 Inspector 창에 코드가 실시간 생성됨. 오픈소스라 내부 구현(`packages/playwright-core/src/server/recorder`)을 그대로 참고 가능.

### 대안 비교

| 옵션 | 장점 | 단점 |
|---|---|---|
| **Playwright** | 크로스브라우저, 강력한 locator 전략, codegen/recorder 내장, 활발한 유지보수 | 별도 브라우저 바이너리 관리 필요(Electron 내장 Chromium에 CDP로 직접 붙이면 회피 가능) |
| **Puppeteer** | CDP 기반이라 가볍고 빠름, Chromium 전용이면 충분 | 크로스브라우저 안 됨, recorder 기능 약함 |
| **CDP 직접 사용** | 의존성 최소, 완전한 커스터마이즈 | Input 이벤트, 접근성 트리 파싱 등을 전부 직접 구현해야 함 |
| **Chrome DevTools Recorder 패널** | 크롬 내장, 크로미움 오픈소스 | 임베드용이 아니라 참고용 |

## 3. "요소 선택 → 케이스 정의" 레코더 구현 방법

### (1) 호버 하이라이트 + 클릭 캡처

CDP `Overlay.setInspectMode`로 크롬 개발자도구의 "요소 검사" 기능을 재현 가능 — 마우스를 올리면 테두리가 그려지고, 클릭하면 `Overlay.inspectNodeRequested`로 어떤 노드를 클릭했는지 알려줌. Playwright 사용 시엔 `page.exposeBinding`으로 페이지에 오버레이 스크립트를 주입하고 `mouseover`/`click` 리스너를 다는 방식이 더 간단함(Playwright 자체 recorder도 이 방식).

### (2) Selector(locator) 생성 전략

클릭된 요소를 "다음에 다시 찾을 수 있는 값"으로 변환하는 게 테스트 견고성의 핵심. Playwright의 우선순위를 그대로 채용 권장:

```
1순위: data-testid / data-test 속성
2순위: role + accessible name (getByRole('button', { name: '저장' }))
3순위: label / placeholder / text
4순위: CSS 구조 경로 (최후의 수단, DOM 구조 바뀌면 깨짐)
```

이렇게 하면 UI 리팩터링(컴포넌트 폴더 재구성 등) 후에도 저장된 테스트 케이스가 잘 깨지지 않음.

### (3) 저장 데이터 모델

코드를 바로 생성하기보다 **구조화된 JSON**으로 스텝을 저장 권장. DB 레코드 관리 방향과도 맞고, UI에서 스텝 편집/재정렬도 쉬움.

```json
{
  "steps": [
    { "action": "goto", "url": "https://dev.testify.example.com" },
    { "action": "click", "locator": { "role": "button", "name": "로그인" } },
    { "action": "fill", "locator": { "testId": "email-input" }, "value": "test@example.com" },
    { "action": "assertVisible", "locator": { "text": "대시보드" } }
  ]
}
```

재실행 시 JSON을 순회하며 Playwright API 호출로 매핑 (`action.role` → `page.getByRole(...)`, `action.testId` → `page.getByTestId(...)` 등). 이 JSON들을 CI에서 헤드리스로 돌리면 "사전 정의된 케이스의 자동 실행"이 완성됨.

### (4) Electron 앱 안에서 실시간으로 보여주기

`BrowserView`(또는 최신 Electron의 `WebContentsView`)를 렌더러 특정 영역에 붙이고, 위에 투명 오버레이 캔버스로 하이라이트 박스를 그리는 구조 권장. 스크린샷 스트리밍이 필요 없어 훨씬 가볍고 반응성도 좋음.

## 4. 추가 참고 자료

- **`npx playwright codegen`** — 가장 직접적인 참고 구현체. 오픈소스라 recorder 내부 로직까지 확인 가능.
- **Chrome DevTools Recorder 패널** — 크로미움 소스코드 기준 비슷한 기능 구현 참고.
- **Cypress Studio** — 다른 아키텍처(브라우저 내부 프록시 방식)지만 "클릭하며 테스트 작성" UX 참고용.

## 5. 요약

- 이 채팅의 브라우저 도구는 (추정) CDP로 실제 Chromium을 원격 제어 + 접근성 트리 기반 ref 시스템으로 구성.
- Testify는 Electron 앱이라는 이점으로 더 간단하게 구현 가능.
- 권장 조합: **Playwright + BrowserView 임베드 + JSON 스텝 저장**.
