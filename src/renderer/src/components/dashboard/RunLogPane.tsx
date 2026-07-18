import { useEffect, useRef, useState } from 'react'
import type { ConsoleLevel } from './LiveBrowserPane'
import { LOG_LEVEL_CLASSES, LOG_LEVEL_LABELS, type RunLogEntry } from './runTypes'
import styles from './RunLogPane.module.css'

export type ConsoleEntry = {
  id: number
  time: string
  level: ConsoleLevel
  message: string
}

export type NetworkEntry = {
  id: number
  time: string
  method: string
  url: string
  status: number | null
  failed: boolean
}

type LogTab = 'run' | 'console' | 'network'

const TAB_ITEMS: { value: LogTab; label: string }[] = [
  { value: 'run', label: '실행 로그' },
  { value: 'console', label: '콘솔' },
  { value: 'network', label: '네트워크' }
]

const CONSOLE_LEVEL_LABELS: Record<ConsoleLevel, string> = {
  log: 'LOG',
  warn: 'WARN',
  error: 'ERROR'
}

const CONSOLE_LEVEL_CLASSES: Record<ConsoleLevel, string> = {
  log: 'text-ivory-dim',
  warn: 'text-clay-300',
  error: 'text-danger'
}

const EMPTY_MESSAGES: Record<LogTab, string> = {
  run: '테스트를 실행하면 로그가 표시됩니다.',
  console: '브라우저에서 발생한 콘솔 메시지가 표시됩니다.',
  network: '페이지 이동과 API 호출 내역이 표시됩니다.'
}

export function RunLogPane({
  logs,
  consoleEntries,
  networkEntries,
  running
}: {
  logs: RunLogEntry[]
  consoleEntries: ConsoleEntry[]
  networkEntries: NetworkEntry[]
  running: boolean
}): JSX.Element {
  const [tab, setTab] = useState<LogTab>('run')
  const bodyRef = useRef<HTMLDivElement>(null)

  const counts: Record<LogTab, number> = {
    run: logs.length,
    console: consoleEntries.length,
    network: networkEntries.length
  }
  const activeCount = counts[tab]

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [tab, activeCount])

  return (
    <section className={`${styles.pane} bg-raised border-line`}>
      <div className={`${styles.header} border-line`}>
        <div className={styles.tabs}>
          {TAB_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.tab} ${
                tab === item.value ? `${styles.tabActive} text-ivory` : 'text-ivory-faint'
              }`}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              {counts[item.value] > 0 && <span className={styles.tabCount}>{counts[item.value]}</span>}
            </button>
          ))}
        </div>
        <span className="text-ivory-faint">{activeCount} lines</span>
        {running && <span className={styles.runningDot} />}
      </div>

      <div ref={bodyRef} className={`${styles.body} bg-canvas`}>
        {activeCount === 0 ? (
          <p className={`${styles.empty} text-ivory-faint`}>{EMPTY_MESSAGES[tab]}</p>
        ) : tab === 'run' ? (
          logs.map((entry) => (
            <div key={entry.id} className={styles.line}>
              <span className={`${styles.time} text-ivory-faint`}>{entry.time}</span>
              <span className={`${styles.level} ${LOG_LEVEL_CLASSES[entry.level]}`}>
                {LOG_LEVEL_LABELS[entry.level]}
              </span>
              <span className={`${styles.message} ${entry.level === 'error' ? 'text-danger' : 'text-ivory-dim'}`}>
                {entry.message}
              </span>
            </div>
          ))
        ) : tab === 'console' ? (
          consoleEntries.map((entry) => (
            <div key={entry.id} className={styles.line}>
              <span className={`${styles.time} text-ivory-faint`}>{entry.time}</span>
              <span className={`${styles.level} ${CONSOLE_LEVEL_CLASSES[entry.level]}`}>
                {CONSOLE_LEVEL_LABELS[entry.level]}
              </span>
              <span
                className={`${styles.message} ${
                  entry.level === 'error' ? 'text-danger' : entry.level === 'warn' ? 'text-clay-300' : 'text-ivory-dim'
                }`}
              >
                {entry.message}
              </span>
            </div>
          ))
        ) : (
          networkEntries.map((entry) => (
            <div key={entry.id} className={styles.line}>
              <span className={`${styles.time} text-ivory-faint`}>{entry.time}</span>
              <span className={`${styles.method} text-ivory-dim`}>{entry.method}</span>
              <span className={`${styles.message} text-ivory-dim`}>{entry.url}</span>
              <span
                className={`${styles.status} ${
                  entry.failed || (entry.status !== null && entry.status >= 400)
                    ? 'text-danger'
                    : entry.status !== null
                      ? 'text-ok'
                      : 'text-ivory-faint'
                }`}
              >
                {entry.failed ? 'FAIL' : (entry.status ?? '—')}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
