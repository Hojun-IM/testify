import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CollapseIcon, ExpandIcon, RefreshIcon } from '../ui/icons'
import type { ApiCall, BrowserFocus, BrowserState, RunCase } from './useSimulatedRun'
import styles from './LiveBrowserPane.module.css'

// E2E 실행 중 가상 커서가 이동할 좌표 (뷰포트 기준 %)
const CURSOR_POS: Record<BrowserFocus, { top: string; left: string }> = {
  nav: { top: '8%', left: '20%' },
  hero: { top: '36%', left: '50%' },
  email: { top: '62%', left: '48%' },
  password: { top: '73%', left: '48%' },
  submit: { top: '86%', left: '50%' },
  result: { top: '36%', left: '50%' }
}

// Electron <webview> 태그의 런타임 메서드. webviewTag가 비활성인 환경에서는
// 메서드가 존재하지 않으므로 전부 optional로 선언하고 호출부에서 ?.()를 쓴다
type WebviewTag = HTMLElement & {
  src: string
  goBack?: () => void
  goForward?: () => void
  reload?: () => void
}

const IS_ELECTRON = navigator.userAgent.includes('Electron')

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed === 'about:blank' || /^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function ApiViewport({ calls }: { calls: ApiCall[] }): JSX.Element {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [calls])

  return (
    <div ref={listRef} className={styles.apiList}>
      {calls.map((call) => (
        <div key={call.id} className={`${styles.apiRow} bg-overlay`}>
          <span
            className={`${styles.apiMethod} ${call.method === 'GET' ? styles.methodGet : styles.methodMutate}`}
          >
            {call.method}
          </span>
          <span className={`${styles.apiPath} text-ivory`}>{call.path}</span>
          {call.status === null ? (
            <span className={`${styles.apiPending} text-ivory-faint`}>
              <span className={styles.spinner} />
              요청 중
            </span>
          ) : (
            <span className={styles.apiResult}>
              <span className={call.status < 400 ? 'text-ok' : 'text-danger'}>{call.status}</span>
              <span className="text-ivory-faint">{call.latencyMs}ms</span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function LiveBrowserPane({
  browser,
  apiCalls,
  activeCase,
  running
}: {
  browser: BrowserState
  apiCalls: ApiCall[]
  activeCase: RunCase | null
  running: boolean
}): JSX.Element {
  const webviewRef = useRef<WebviewTag | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [src, setSrc] = useState('about:blank')
  const [urlInput, setUrlInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  // iframe 폴백에서 뒤로/앞으로 가기를 지원하기 위한 자체 히스토리 (Electron에서는 webview 네이티브 히스토리 사용)
  const historyRef = useRef<{ stack: string[]; index: number }>({ stack: [], index: -1 })

  function navigateTo(raw: string): void {
    const url = normalizeUrl(raw)
    if (!url) return
    setUrlInput(url === 'about:blank' ? '' : url)
    setSrc(url)
    if (!IS_ELECTRON) {
      const history = historyRef.current
      history.stack = [...history.stack.slice(0, history.index + 1), url]
      history.index = history.stack.length - 1
    }
  }

  const navigateToRef = useRef(navigateTo)
  navigateToRef.current = navigateTo

  // 시뮬레이션(E2E 스텝)이 URL을 바꾸면 실제 브라우저 영역도 함께 이동한다
  useEffect(() => {
    if (browser.url) navigateToRef.current(browser.url)
  }, [browser.url])

  // 페이지 안에서 링크 클릭 등으로 이동하면 주소창을 따라 갱신한다 (Electron 전용)
  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    function handleNavigate(event: Event): void {
      const url = (event as Event & { url?: string }).url
      if (url) setUrlInput(url === 'about:blank' ? '' : url)
    }

    webview.addEventListener('did-navigate', handleNavigate)
    webview.addEventListener('did-navigate-in-page', handleNavigate)
    return () => {
      webview.removeEventListener('did-navigate', handleNavigate)
      webview.removeEventListener('did-navigate-in-page', handleNavigate)
    }
  }, [])

  function goBack(): void {
    if (IS_ELECTRON) {
      webviewRef.current?.goBack?.()
      return
    }
    const history = historyRef.current
    if (history.index <= 0) return
    history.index -= 1
    const url = history.stack[history.index]
    setSrc(url)
    setUrlInput(url === 'about:blank' ? '' : url)
  }

  function goForward(): void {
    if (IS_ELECTRON) {
      webviewRef.current?.goForward?.()
      return
    }
    const history = historyRef.current
    if (history.index >= history.stack.length - 1) return
    history.index += 1
    const url = history.stack[history.index]
    setSrc(url)
    setUrlInput(url === 'about:blank' ? '' : url)
  }

  function reload(): void {
    if (IS_ELECTRON) {
      webviewRef.current?.reload?.()
      return
    }
    const iframe = iframeRef.current
    if (iframe) iframe.src = src
  }

  const showApiOverlay = running && activeCase?.type === 'api'
  const showCursor = running && activeCase?.type === 'e2e' && browser.focus !== null

  return (
    <section className={`${styles.pane} ${expanded ? styles.expanded : ''} bg-raised border-line`}>
      <div className={`${styles.toolbar} border-line`}>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="뒤로" onClick={goBack}>
          <ChevronLeftIcon />
        </button>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="앞으로" onClick={goForward}>
          <ChevronRightIcon />
        </button>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="새로고침" onClick={reload}>
          <RefreshIcon />
        </button>
        <form
          className={styles.urlForm}
          onSubmit={(event) => {
            event.preventDefault()
            navigateTo(urlInput)
          }}
        >
          <input
            className={`${styles.urlBar} bg-canvas text-ivory-dim`}
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="주소 입력 후 Enter (예: example.com)"
            spellCheck={false}
          />
        </form>
        <button
          type="button"
          className="icon-btn text-ivory-dim"
          aria-label={expanded ? '브라우저 축소' : '브라우저 확대'}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>
        {running && activeCase && (
          <span className={`${styles.caseName} text-ivory-faint`}>{activeCase.name}</span>
        )}
        {running && (
          <span className={`${styles.liveBadge} ${activeCase?.type === 'api' ? styles.apiBadge : ''}`}>
            ● {activeCase?.type === 'api' ? 'API' : 'LIVE'}
          </span>
        )}
      </div>

      <div className={`${styles.viewport} bg-canvas`}>
        {IS_ELECTRON ? (
          <webview
            ref={(el) => {
              webviewRef.current = el as WebviewTag | null
            }}
            className={styles.webFrame}
            src={src}
          />
        ) : (
          <iframe ref={iframeRef} className={styles.webFrame} src={src} title="브라우저" />
        )}

        {src === 'about:blank' && !running && (
          <p className={`${styles.placeholder} text-ivory-faint`}>
            주소를 입력하거나 테스트를 실행하면 이 영역에서 브라우저가 열립니다.
          </p>
        )}

        {showCursor && browser.focus && (
          <span className={styles.cursor} style={CURSOR_POS[browser.focus]}>
            {/* focus가 바뀔 때마다 key가 바뀌어 클릭 파동 애니메이션이 다시 실행된다 */}
            <span key={browser.focus} className={styles.cursorPulse} />
          </span>
        )}

        {showApiOverlay && <div className={`${styles.apiOverlay} bg-canvas`}>{<ApiViewport calls={apiCalls} />}</div>}
      </div>
    </section>
  )
}
