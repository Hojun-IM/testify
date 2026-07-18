import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { TestCase } from '../../../../shared/types'
import { IconMenuButton } from '../ui/IconMenuButton'
import { DragHandleIcon } from '../ui/icons'
import { formatDateTime } from '../../utils/format'
import styles from './TestCaseTable.module.css'

const STATUS_LABEL: Record<TestCase['status'], string> = {
  draft: 'Draft',
  ready: 'Ready',
  deprecated: 'Deprecated'
}

// 행을 절대 위치(top = index * ROW_HEIGHT)로 배치해 드래그 정렬 시 애니메이션되도록 한다.
// CSS의 행 높이와 동기화되어야 하는 값
const ROW_HEIGHT = 52
// 이 거리(px) 이상 움직여야 드래그로 간주 — 미만이면 행 클릭(수정 패널 열기)으로 처리
const DRAG_THRESHOLD = 4

type DragState = {
  id: string
  startY: number
  startIndex: number
  previewIndex: number
  currentTop: number
  moved: boolean
}

export function TestCaseTable({
  cases,
  onReorderPreview,
  onReorderCommit,
  onRowClick,
  onEdit,
  onDelete,
  onRun,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: {
  cases: TestCase[]
  onReorderPreview: (fromIndex: number, toIndex: number) => void
  onReorderCommit: () => void
  onRowClick: (testCase: TestCase) => void
  onEdit: (testCase: TestCase) => void
  onDelete: (testCase: TestCase) => void
  onRun?: (testCase: TestCase) => void
  // 일괄 실행용 선택 상태 (자동화 스텝이 있는 케이스만 체크 가능)
  selectedIds?: Set<string>
  onToggleSelect?: (testCase: TestCase) => void
  onToggleSelectAll?: () => void
}): JSX.Element {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [, forceRender] = useState(0)
  const dragRef = useRef<DragState | null>(null)
  const casesRef = useRef(cases)

  useEffect(() => {
    casesRef.current = cases
  }, [cases])

  useEffect(() => {
    if (!draggingId) return

    function handlePointerMove(event: PointerEvent): void {
      const drag = dragRef.current
      if (!drag) return

      const deltaY = event.clientY - drag.startY
      if (!drag.moved && Math.abs(deltaY) > DRAG_THRESHOLD) {
        drag.moved = true
      }
      drag.currentTop = drag.startIndex * ROW_HEIGHT + deltaY

      const maxIndex = casesRef.current.length - 1
      const targetIndex = Math.min(maxIndex, Math.max(0, Math.round(drag.currentTop / ROW_HEIGHT)))
      if (drag.moved && targetIndex !== drag.previewIndex) {
        onReorderPreview(drag.previewIndex, targetIndex)
        drag.previewIndex = targetIndex
      }
      forceRender((n) => n + 1)
    }

    function handlePointerUp(): void {
      const drag = dragRef.current
      dragRef.current = null
      setDraggingId(null)

      if (!drag) return
      if (!drag.moved) {
        const testCase = casesRef.current.find((item) => item.id === drag.id)
        if (testCase) onRowClick(testCase)
      } else {
        onReorderCommit()
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggingId, onReorderPreview, onReorderCommit, onRowClick])

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>, testCase: TestCase, index: number): void {
    if (event.button !== 0) return
    dragRef.current = {
      id: testCase.id,
      startY: event.clientY,
      startIndex: index,
      previewIndex: index,
      currentTop: index * ROW_HEIGHT,
      moved: false
    }
    setDraggingId(testCase.id)
  }

  if (cases.length === 0) {
    return <div className={`${styles.empty} border-line text-ivory-faint`}>테스트 케이스가 없습니다.</div>
  }

  const runnableCount = cases.filter((item) => item.steps.some((step) => step.automation)).length
  const showSelect = !!onToggleSelect

  return (
    <div className={`${styles.table} border-line`}>
      <div className={`${styles.headerRow} border-line`}>
        <span className={styles.handleCol} />
        {showSelect && (
          <span className={styles.selectCol}>
            <input
              type="checkbox"
              className={styles.checkbox}
              aria-label="자동화 케이스 전체 선택"
              disabled={runnableCount === 0}
              checked={runnableCount > 0 && (selectedIds?.size ?? 0) >= runnableCount}
              onChange={() => onToggleSelectAll?.()}
            />
          </span>
        )}
        <span className={`${styles.headerCell} ${styles.orderCol} text-ivory-faint`}>#</span>
        <span className={`${styles.headerCell} ${styles.titleCol} text-ivory-faint`}>제목</span>
        <span className={`${styles.headerCell} ${styles.statusCol} text-ivory-faint`}>상태</span>
        <span className={`${styles.headerCell} ${styles.runCol} text-ivory-faint`}>마지막 실행</span>
        <span className={`${styles.headerCell} ${styles.updatedCol} text-ivory-faint`}>업데이트됨</span>
        <span className={styles.actionsCol} />
      </div>
      <div className={styles.rowsViewport} style={{ height: cases.length * ROW_HEIGHT }}>
        {cases.map((testCase, index) => {
          const isDragging = draggingId === testCase.id
          const top = isDragging && dragRef.current ? dragRef.current.currentTop : index * ROW_HEIGHT

          return (
            <div
              key={testCase.id}
              className={`${styles.row} ${isDragging ? styles.dragging : ''} border-line`}
              style={{ top, transition: isDragging ? 'none' : 'top 160ms ease' }}
              onPointerDown={(event) => handlePointerDown(event, testCase, index)}
            >
              <span className={`${styles.handleCol} ${styles.dragHandle} text-ivory-faint`}>
                <DragHandleIcon />
              </span>
              {showSelect && (
                <span
                  className={styles.selectCol}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    aria-label={`${testCase.name} 선택`}
                    title={
                      testCase.steps.some((step) => step.automation)
                        ? undefined
                        : '자동화 스텝이 없는 케이스는 실행할 수 없습니다'
                    }
                    disabled={!testCase.steps.some((step) => step.automation)}
                    checked={selectedIds?.has(testCase.id) ?? false}
                    onChange={() => onToggleSelect?.(testCase)}
                  />
                </span>
              )}
              <span className={`${styles.cell} ${styles.orderCol} text-ivory-faint`}>{index + 1}</span>
              <span className={`${styles.cell} ${styles.titleCol} ${styles.title} text-ivory`}>{testCase.name}</span>
              <span className={`${styles.cell} ${styles.statusCol}`}>
                <span className={`${styles.badge} ${styles[testCase.status]}`}>{STATUS_LABEL[testCase.status]}</span>
              </span>
              <span
                className={`${styles.cell} ${styles.runCol} ${testCase.last_run_at ? 'text-ivory-dim' : 'text-ivory-faint'}`}
              >
                {testCase.last_run_at ? formatDateTime(testCase.last_run_at) : '미실행'}
              </span>
              <span className={`${styles.cell} ${styles.updatedCol} text-ivory-dim`}>
                {formatDateTime(testCase.updated_dt)}
              </span>
              <span
                className={styles.actionsCol}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <IconMenuButton
                  ariaLabel="테스트 케이스 설정"
                  items={[
                    ...(onRun && testCase.steps.some((step) => step.automation)
                      ? [{ label: '실행', onClick: () => onRun(testCase) }]
                      : []),
                    { label: '수정', onClick: () => onEdit(testCase) },
                    { label: '삭제', onClick: () => onDelete(testCase), danger: true }
                  ]}
                />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
