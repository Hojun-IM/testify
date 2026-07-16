// App.module.css의 .layout(padding 8px)과 Sidebar.module.css의 폭(285px)에 동기화되어야
// 하는 값들. 사이드바 유무에 따라 뜨는 위치를 계산하는 모든 플로팅 UI(모달/사이드 패널 위 오버레이)가
// 이 값을 공유해서 서로 어긋나지 않도록 한다.
export const LAYOUT_PADDING = 8
export const SIDEBAR_WIDTH = 285

// 사이드바가 접혔을 때 macOS 트래픽 라이트(신호등 버튼)와 사이드바 펼치기 버튼을 가리지 않기 위해
// 확보하는 좌측 여백. 각 화면 헤더의 `.header.collapsed` 패딩과 동일한 값이다
export const TRAFFIC_LIGHT_CLEARANCE = 107

// 사이드바를 제외한 콘텐츠 영역의 실제 좌측 시작 좌표.
// 모달을 "사이드바가 있으면 그 옆 콘텐츠 영역 중앙, 없으면 전체 폭 중앙"에 띄울 때 기준으로 쓴다
export function contentAreaLeft(sidebarCollapsed?: boolean): number {
  return sidebarCollapsed ? LAYOUT_PADDING : LAYOUT_PADDING + SIDEBAR_WIDTH + LAYOUT_PADDING
}

// 콘텐츠 영역 안에 뜨는 플로팅 패널(브라우저 기록 / API 빌더 오버레이)의 좌측 시작 좌표.
// 사이드바가 없을 때도 트래픽 라이트를 가리지 않도록 별도 여백을 확보한다
export function floatingPanelLeft(sidebarCollapsed?: boolean): number {
  return sidebarCollapsed ? TRAFFIC_LIGHT_CLEARANCE + 12 : contentAreaLeft(sidebarCollapsed) + 12
}
