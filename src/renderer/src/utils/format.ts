// DB가 내려주는 ISO 문자열(created_dt 등)을 화면에 표시할 때 쓰는 공용 포맷터

// 'YYYY-MM-DD HH:mm' — 목록/상세의 생성·수정·실행 시각 표시용
export function formatDateTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16)
}

// 'YYYY-MM-DD' — 날짜만 표시할 때 사용
export function formatDate(iso: string): string {
  return iso.slice(0, 10)
}
