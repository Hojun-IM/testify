import { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs } from '../ui/Tabs'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import styles from './ProjectStatsPanel.module.css'

type RangeOption = 'all' | '7d' | '30d'

const GRID_ROWS = 7
const GRID_COLUMNS = 53

const RANGE_DAYS: Record<'7d' | '30d', number> = {
  '7d': 7,
  '30d': 30
}

const RANGE_ITEMS = [
  { value: 'all', label: '전체' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' }
]

const CURRENT_YEAR = new Date().getFullYear()

// TODO: 테스트 실행 이력(test_run) API가 생기면 실제 "가장 오래된 테스트 실행" 연도로 교체
const OLDEST_TEST_EXECUTION_YEAR = CURRENT_YEAR - 2

const YEAR_OPTIONS: DropdownOption[] = Array.from(
  { length: CURRENT_YEAR - OLDEST_TEST_EXECUTION_YEAR + 1 },
  (_, i) => {
    const year = CURRENT_YEAR - i
    return { value: String(year), label: String(year) }
  }
)

type DayCell = { date: Date; count: number }

const TOOLTIP_OFFSET = 12

// TODO: 테스트 실행 이력(test_run) API가 생기면 실제 일별 실행 횟수로 교체
function mockCountForDate(date: Date): number {
  const seed = date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate()
  const value = (seed * 2654435761) % 100
  return value < 55 ? 0 : Math.floor(((value - 55) / 45) * 8)
}

function buildYearDays(year: number): DayCell[] {
  const result: DayCell[] = []
  const date = new Date(year, 0, 1)
  while (date.getFullYear() === year) {
    result.push({ date: new Date(date), count: mockCountForDate(date) })
    date.setDate(date.getDate() + 1)
  }
  return result
}

function levelClass(count: number): string {
  if (count <= 0) return styles.level0
  if (count <= 2) return styles.level1
  if (count <= 4) return styles.level2
  if (count <= 6) return styles.level3
  return styles.level4
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function ProjectStatsPanel(): JSX.Element {
  const [range, setRange] = useState<RangeOption>('all')
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const cells = useMemo(() => buildYearDays(Number(year)), [year])
  const [hover, setHover] = useState<{ x: number; y: number; date: Date; count: number } | null>(null)
  const todayCellRef = useRef<HTMLSpanElement>(null)

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const highlightCutoff = useMemo(() => {
    if (range === 'all') return null
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - (RANGE_DAYS[range] - 1))
    return { cutoff, today }
  }, [range, today])

  useEffect(() => {
    todayCellRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [cells])

  const totalCount = useMemo(() => {
    if (range === 'all') {
      return cells.reduce((sum, cell) => (cell.date <= today ? sum + cell.count : sum), 0)
    }
    if (!highlightCutoff) return 0
    return cells.reduce(
      (sum, cell) =>
        cell.date >= highlightCutoff.cutoff && cell.date <= highlightCutoff.today ? sum + cell.count : sum,
      0
    )
  }, [cells, range, today, highlightCutoff])

  const summaryText =
    range === 'all'
      ? `최근 1년간 ${totalCount}회의 테스트를 실행했습니다.`
      : `최근 ${RANGE_DAYS[range]}일간 ${totalCount}회의 테스트를 실행했습니다.`

  return (
    <div className={`${styles.panel} bg-raised border-line`}>
      <div className={styles.header}>
        <Dropdown options={YEAR_OPTIONS} value={year} onChange={setYear} />
        <Tabs items={RANGE_ITEMS} value={range} onChange={(value) => setRange(value as RangeOption)} />
      </div>
      <div className={styles.gridWrap}>
        <div className={styles.grid} style={{ gridTemplateRows: `repeat(${GRID_ROWS}, 12px)` }}>
          {cells.slice(0, GRID_ROWS * GRID_COLUMNS).map((cell, index) => {
            const dimmed =
              highlightCutoff !== null &&
              (cell.date < highlightCutoff.cutoff || cell.date > highlightCutoff.today)
            const isToday = isSameDay(cell.date, today)
            return (
              <span
                key={index}
                ref={isToday ? todayCellRef : undefined}
                className={`${styles.cell} ${levelClass(cell.count)} ${dimmed ? styles.dimmed : ''} ${
                  isToday ? styles.today : ''
                }`}
                onMouseMove={(event) =>
                  setHover({ x: event.clientX, y: event.clientY, date: cell.date, count: cell.count })
                }
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </div>
      </div>
      <p className={`${styles.summary} text-ivory-faint`}>{summaryText}</p>
      {hover && (
        <span
          className={`${styles.tooltip} bg-raised border-line text-ivory`}
          style={{ left: hover.x + TOOLTIP_OFFSET, top: hover.y + TOOLTIP_OFFSET }}
        >
          <span className={styles.tooltipDate}>{formatDate(hover.date)}</span> · 실행 {hover.count}회
        </span>
      )}
    </div>
  )
}
