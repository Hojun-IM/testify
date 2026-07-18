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

// 최근 3년 정도면 실제 실행 이력을 훑어보기에 충분하다
const YEAR_OPTIONS: DropdownOption[] = Array.from({ length: 3 }, (_, i) => {
  const year = CURRENT_YEAR - i
  return { value: String(year), label: String(year) }
})

type DayCell = { date: Date; count: number }

const TOOLTIP_OFFSET = 12

// 히트맵 데이터 조회/표시에 쓰는 로컬 기준 'YYYY-MM-DD' 키.
// (utils/format의 formatDate는 ISO "문자열"을 자르는 함수라 Date 객체에는 쓸 수 없다)
function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// counts는 "YYYY-MM-DD" -> 실행 횟수. projects:executionHistory가 돌려주는 실제 데이터를 채워 넣는다
function buildYearDays(year: number, counts: Map<string, number>): DayCell[] {
  const result: DayCell[] = []
  const date = new Date(year, 0, 1)
  while (date.getFullYear() === year) {
    result.push({ date: new Date(date), count: counts.get(toDateKey(date)) ?? 0 })
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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function ProjectStatsPanel({ projectId }: { projectId: string }): JSX.Element {
  const [range, setRange] = useState<RangeOption>('all')
  const [year, setYear] = useState(String(CURRENT_YEAR))
  // "YYYY-MM-DD" -> 실행 횟수. 대시보드에서 케이스가 실제로 재생되며 남긴 test_case_runs 기준
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [hover, setHover] = useState<{ x: number; y: number; date: Date; count: number } | null>(null)
  const todayCellRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let cancelled = false
    window.api.projects.executionHistory({ projectId, year: Number(year) }).then((entries) => {
      if (cancelled) return
      setCounts(new Map(entries.map((entry) => [entry.date, entry.count])))
    })
    return () => {
      cancelled = true
    }
  }, [projectId, year])

  const cells = useMemo(() => buildYearDays(Number(year), counts), [year, counts])

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
          <span className={styles.tooltipDate}>{toDateKey(hover.date)}</span> · 실행 {hover.count}회
        </span>
      )}
    </div>
  )
}
