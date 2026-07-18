import { useEffect } from 'react'

const DEBOUNCE_MS = 200

// 검색어처럼 연속으로 바뀌는 조건으로 목록을 조회하는 화면들이 공유하는 훅.
// deps가 바뀔 때마다 잠시(200ms) 기다렸다 fetcher를 호출하고, 대기 중 deps가 다시
// 바뀌거나 언마운트되면 이전 요청을 취소한다 — 늦게 도착한 응답이 최신 입력으로
// 조회한 결과를 덮어쓰지 않도록 하기 위함이다.
// 주의: fetcher/onLoaded는 deps가 바뀐 시점의 것이 쓰이므로, fetcher가 참조하는
// 상태는 반드시 deps에 포함해야 한다
export function useDebouncedQuery<T>(
  fetcher: () => Promise<T>,
  onLoaded: (result: T) => void,
  deps: unknown[]
): void {
  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(() => {
      fetcher().then((result) => {
        if (!cancelled) onLoaded(result)
      })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
