import { useEffect, useRef } from 'react'
import type { LogLevel, RunLogEntry } from './useSimulatedRun'
import styles from './RunLogPane.module.css'

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: 'INFO',
  step: 'STEP',
  success: 'PASS',
  error: 'FAIL'
}

const LEVEL_CLASSES: Record<LogLevel, string> = {
  info: 'text-ivory-faint',
  step: 'text-ivory-dim',
  success: 'text-ok',
  error: 'text-danger'
}

export function RunLogPane({ logs, running }: { logs: RunLogEntry[]; running: boolean }): JSX.Element {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  return (
    <section className={`${styles.pane} bg-raised border-line`}>
      <div className={`${styles.header} border-line`}>
        <span className="text-ivory">실행 로그</span>
        <span className="text-ivory-faint">{logs.length} lines</span>
        {running && <span className={styles.runningDot} />}
      </div>
      <div ref={bodyRef} className={`${styles.body} bg-canvas`}>
        {logs.length === 0 ? (
          <p className={`${styles.empty} text-ivory-faint`}>테스트를 실행하면 로그가 표시됩니다.</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className={styles.line}>
              <span className={`${styles.time} text-ivory-faint`}>{entry.time}</span>
              <span className={`${styles.level} ${LEVEL_CLASSES[entry.level]}`}>
                {LEVEL_LABELS[entry.level]}
              </span>
              <span className={`${styles.message} ${entry.level === 'error' ? 'text-danger' : 'text-ivory-dim'}`}>
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
