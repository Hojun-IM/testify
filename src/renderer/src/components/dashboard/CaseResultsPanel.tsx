import { useEffect, useState } from 'react'
import { SlidePanel } from '../ui/SlidePanel'
import { ChevronLeftIcon } from '../ui/icons'
import type { LogLevel, RunCase, RunLogEntry } from './useSimulatedRun'
import styles from './CaseResultsPanel.module.css'

export type ResultFilter = 'all' | 'waiting' | 'passed' | 'failed'

const FILTER_TITLES: Record<ResultFilter, string> = {
  all: '전체 테스트',
  waiting: '대기 중인 테스트',
  passed: '성공한 테스트',
  failed: '실패한 테스트'
}

const STATUS_LABELS: Record<RunCase['status'], string> = {
  pending: '대기',
  running: '실행 중',
  passed: '성공',
  failed: '실패'
}

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

function formatDuration(durationMs: number): string {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`
}

function matchesFilter(runCase: RunCase, filter: ResultFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'waiting') return runCase.status === 'pending' || runCase.status === 'running'
  return runCase.status === filter
}

function StatusIndicator({ runCase }: { runCase: RunCase }): JSX.Element {
  if (runCase.status === 'running') return <span className={styles.spinner} />
  if (runCase.status === 'passed') return <span className="text-ok">✓</span>
  if (runCase.status === 'failed') return <span className="text-danger">✕</span>
  return <span className={`${styles.pendingDot} bg-overlay`} />
}

function CaseDetail({ runCase, logs }: { runCase: RunCase; logs: RunLogEntry[] }): JSX.Element {
  const caseLogs = logs.filter((entry) => entry.caseId === runCase.id)

  return (
    <div className={styles.detail}>
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryItem} bg-raised border-line`}>
          <span className={`${styles.summaryLabel} text-ivory-faint`}>결과</span>
          <span
            className={
              runCase.status === 'passed'
                ? 'text-ok'
                : runCase.status === 'failed'
                  ? 'text-danger'
                  : 'text-ivory-dim'
            }
          >
            {STATUS_LABELS[runCase.status]}
          </span>
        </div>
        <div className={`${styles.summaryItem} bg-raised border-line`}>
          <span className={`${styles.summaryLabel} text-ivory-faint`}>타입</span>
          <span className="text-ivory">{runCase.type.toUpperCase()}</span>
        </div>
        <div className={`${styles.summaryItem} bg-raised border-line`}>
          <span className={`${styles.summaryLabel} text-ivory-faint`}>소요 시간</span>
          <span className="text-ivory">
            {runCase.durationMs !== null ? formatDuration(runCase.durationMs) : '-'}
          </span>
        </div>
      </div>

      {runCase.failMessage && (
        <div className={styles.failBox}>
          <span className={`${styles.failTitle} text-danger`}>실패 사유</span>
          <p className={`${styles.failMessage} text-ivory-dim`}>{runCase.failMessage}</p>
        </div>
      )}

      <div className={styles.logSection}>
        <span className={`${styles.logTitle} text-ivory-faint`}>실행 로그 · {caseLogs.length} lines</span>
        <div className={`${styles.logBody} bg-canvas border-line`}>
          {caseLogs.length === 0 ? (
            <p className={`${styles.logEmpty} text-ivory-faint`}>아직 실행 로그가 없습니다.</p>
          ) : (
            caseLogs.map((entry) => (
              <div key={entry.id} className={styles.logLine}>
                <span className={`${styles.logTime} text-ivory-faint`}>{entry.time}</span>
                <span className={`${styles.logLevel} ${LEVEL_CLASSES[entry.level]}`}>
                  {LEVEL_LABELS[entry.level]}
                </span>
                <span
                  className={`${styles.logMessage} ${entry.level === 'error' ? 'text-danger' : 'text-ivory-dim'}`}
                >
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function CaseResultsPanel({
  filter,
  cases,
  logs,
  onClose
}: {
  filter: ResultFilter | null
  cases: RunCase[]
  logs: RunLogEntry[]
  onClose: () => void
}): JSX.Element {
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null)

  // 패널을 닫았다 다시 열면 항상 목록부터 보이도록 초기화
  useEffect(() => {
    if (!filter) setDetailCaseId(null)
  }, [filter])

  const filtered = filter ? cases.filter((runCase) => matchesFilter(runCase, filter)) : []
  // 상태가 갱신되어도 최신 케이스 데이터를 보여주도록 id로 다시 찾는다
  const detailCase = cases.find((runCase) => runCase.id === detailCaseId) ?? null

  return (
    <SlidePanel
      open={!!filter}
      onClose={onClose}
      title={detailCase ? detailCase.name : filter ? FILTER_TITLES[filter] : ''}
      width={480}
    >
      {detailCase ? (
        <>
          <button
            type="button"
            className={`${styles.backBtn} text-ivory-faint hover:bg-overlay`}
            onClick={() => setDetailCaseId(null)}
          >
            <ChevronLeftIcon />
            목록으로
          </button>
          <CaseDetail runCase={detailCase} logs={logs} />
        </>
      ) : filtered.length === 0 ? (
        <p className={`${styles.empty} text-ivory-faint`}>해당하는 테스트가 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((runCase) => {
            const finished = runCase.status === 'passed' || runCase.status === 'failed'
            return (
              <li key={runCase.id}>
                <button
                  type="button"
                  className={`${styles.row} hover:bg-overlay ${finished ? '' : styles.rowDisabled}`}
                  onClick={() => finished && setDetailCaseId(runCase.id)}
                >
                  <span className={styles.status}>
                    <StatusIndicator runCase={runCase} />
                  </span>
                  <span className={styles.info}>
                    <span className={`${styles.name} text-ivory`}>{runCase.name}</span>
                    <span className={`${styles.meta} text-ivory-faint`}>
                      {runCase.type.toUpperCase()}
                      {runCase.durationMs !== null && ` · ${formatDuration(runCase.durationMs)}`}
                    </span>
                  </span>
                  {finished && <span className={`${styles.detailHint} text-ivory-faint`}>상세 →</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </SlidePanel>
  )
}
