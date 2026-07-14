import type { ResultFilter } from './CaseResultsPanel'
import type { RunCase } from './useSimulatedRun'
import styles from './RunStatsRow.module.css'

function StatCard({
  label,
  value,
  accentClass,
  pulsing,
  onClick
}: {
  label: string
  value: number
  accentClass: string
  pulsing?: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button type="button" className={`${styles.card} bg-raised border-line`} onClick={onClick}>
      <span className={`${styles.label} text-ivory-faint`}>
        {label}
        {pulsing && <span className={styles.pulseDot} />}
      </span>
      {/* 값이 바뀔 때마다 key가 바뀌어 pop 애니메이션이 다시 실행된다 */}
      <span key={value} className={`${styles.value} ${accentClass}`}>
        {value}
      </span>
    </button>
  )
}

export function RunStatsRow({
  cases,
  running,
  onSelect
}: {
  cases: RunCase[]
  running: boolean
  onSelect: (filter: ResultFilter) => void
}): JSX.Element {
  const total = cases.length
  const waiting = cases.filter((item) => item.status === 'pending' || item.status === 'running').length
  const passed = cases.filter((item) => item.status === 'passed').length
  const failed = cases.filter((item) => item.status === 'failed').length

  return (
    <div className={styles.row}>
      <StatCard label="전체 테스트" value={total} accentClass="text-ivory" onClick={() => onSelect('all')} />
      <StatCard
        label="대기"
        value={waiting}
        accentClass="text-ivory-dim"
        pulsing={running}
        onClick={() => onSelect('waiting')}
      />
      <StatCard label="성공" value={passed} accentClass="text-ok" onClick={() => onSelect('passed')} />
      <StatCard label="실패" value={failed} accentClass="text-danger" onClick={() => onSelect('failed')} />
    </div>
  )
}
