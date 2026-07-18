import { useEffect, useRef, useState } from 'react'
import type { ProjectSummary, Test, TestCase } from '../../../../shared/types'
import { ChevronLeftIcon, PlayIcon } from '../ui/icons'
import { SearchInput } from '../ui/SearchInput'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TestCaseTable } from './TestCaseTable'
import { TestCaseFormPanel, type TestCaseFormValues } from './TestCaseFormPanel'
import { FORM_PANEL_WIDTH } from '../layout/layoutMetrics'
import { TestHooksModal } from '../hooks/TestHooksModal'
import { useDebouncedQuery } from '../../hooks/useDebouncedQuery'
import styles from './TestCaseListView.module.css'

export function TestCaseListView({
  project,
  test,
  onBack,
  sidebarCollapsed,
  onRunCases
}: {
  project: ProjectSummary
  test: Test
  onBack: () => void
  sidebarCollapsed?: boolean
  onRunCases?: (testCases: TestCase[]) => void
}): JSX.Element {
  const [search, setSearch] = useState('')
  const [cases, setCases] = useState<TestCase[]>([])
  const casesRef = useRef<TestCase[]>([])
  // 일괄 실행을 위해 체크박스로 선택한 케이스 id 목록 (자동화 스텝이 있는 케이스만 선택 가능)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'create' | 'edit'>('create')
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [deletingCase, setDeletingCase] = useState<TestCase | null>(null)

  // 이 테스트에 불러와 연결한 전역 훅
  const [hooksModalOpen, setHooksModalOpen] = useState(false)
  const [linkedHookCount, setLinkedHookCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    window.api.hooks.listForTest(test.id).then((hooks) => {
      if (!cancelled) setLinkedHookCount(hooks.length)
    })
    return () => {
      cancelled = true
    }
  }, [test.id])

  useEffect(() => {
    casesRef.current = cases
  }, [cases])

  async function refreshCases(): Promise<void> {
    const result = await window.api.testCases.list({ testId: test.id, search })
    setCases(result)
  }

  useDebouncedQuery(() => window.api.testCases.list({ testId: test.id, search }), setCases, [
    test.id,
    search
  ])

  // 목록이 갱신되면 이미 사라진 케이스의 선택 상태를 정리한다
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => cases.some((item) => item.id === id)))
      return next.size === prev.size ? prev : next
    })
  }, [cases])

  function toggleSelect(testCase: TestCase): void {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(testCase.id)) next.delete(testCase.id)
      else next.add(testCase.id)
      return next
    })
  }

  const runnableCases = cases.filter((item) => item.steps.some((step) => step.automation))

  function toggleSelectAll(): void {
    setSelectedIds((prev) =>
      prev.size >= runnableCases.length && runnableCases.length > 0
        ? new Set()
        : new Set(runnableCases.map((item) => item.id))
    )
  }

  function runSelected(): void {
    const selected = cases.filter((item) => selectedIds.has(item.id))
    if (selected.length === 0) return
    setSelectedIds(new Set())
    onRunCases?.(selected)
  }

  function runAllCases(): void {
    if (runnableCases.length === 0) return
    setSelectedIds(new Set())
    onRunCases?.(runnableCases)
  }

  function openCreatePanel(): void {
    setPanelMode('create')
    setEditingCase(null)
    setPanelOpen(true)
  }

  function openEditPanel(testCase: TestCase): void {
    setPanelMode('edit')
    setEditingCase(testCase)
    setPanelOpen(true)
  }

  async function handlePanelSubmit(values: TestCaseFormValues): Promise<void> {
    if (panelMode === 'edit' && editingCase) {
      await window.api.testCases.update({ id: editingCase.id, test_id: test.id, ...values })
    } else {
      await window.api.testCases.create({ test_id: test.id, ...values })
    }
    await refreshCases()
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deletingCase) return
    await window.api.testCases.remove(deletingCase.id)
    setDeletingCase(null)
    await refreshCases()
  }

  function handleReorderPreview(fromIndex: number, toIndex: number): void {
    setCases((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  async function handleReorderCommit(): Promise<void> {
    await window.api.testCases.reorder({
      test_id: test.id,
      ordered_ids: casesRef.current.map((item) => item.id)
    })
  }

  return (
    <div className={styles.view}>
      <div className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <button type="button" className="icon-btn text-ivory-faint" aria-label="뒤로" onClick={onBack}>
          <ChevronLeftIcon />
        </button>
        <div className={styles.breadcrumb}>
          <span className="text-ivory-faint">{project.name}</span>
          <span className="text-ivory-faint">/</span>
          <span className="text-ivory-dim">{test.name}</span>
          <span className="text-ivory-faint">/</span>
          <span className="text-ivory">테스트 케이스</span>
        </div>
      </div>

      <div className={styles.body} style={{ paddingRight: panelOpen ? FORM_PANEL_WIDTH : 0 }}>
        <div className={styles.content}>
          <div className={styles.controlsRow}>
            <div className={styles.left}>
              <SearchInput value={search} onChange={setSearch} placeholder="테스트 케이스 검색..." />
            </div>
            <div className={styles.right}>
              <Button variant="ghost" onClick={() => setHooksModalOpen(true)}>
                훅{linkedHookCount > 0 ? ` (${linkedHookCount})` : ''}
              </Button>
              <Button variant="ghost">Export</Button>
              <Button variant="ghost">Import</Button>
              <Button onClick={openCreatePanel}>새 케이스</Button>
              {onRunCases && selectedIds.size > 0 && (
                <Button variant="ghost" onClick={runSelected}>
                  <PlayIcon size={13} /> 선택 실행 ({selectedIds.size})
                </Button>
              )}
              {onRunCases && (
                <Button onClick={runAllCases} disabled={runnableCases.length === 0}>
                  <PlayIcon size={13} /> 전체 실행
                </Button>
              )}
            </div>
          </div>

          <TestCaseTable
            cases={cases}
            onReorderPreview={handleReorderPreview}
            onReorderCommit={handleReorderCommit}
            onRowClick={openEditPanel}
            onEdit={openEditPanel}
            onDelete={setDeletingCase}
            onRun={onRunCases ? (testCase) => onRunCases([testCase]) : undefined}
            selectedIds={selectedIds}
            onToggleSelect={onRunCases ? toggleSelect : undefined}
            onToggleSelectAll={onRunCases ? toggleSelectAll : undefined}
          />
        </div>
      </div>

      <TestCaseFormPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handlePanelSubmit}
        mode={panelMode}
        testType={test.type}
        sidebarCollapsed={sidebarCollapsed}
        initialValues={
          panelMode === 'edit' && editingCase
            ? {
                name: editingCase.name,
                status: editingCase.status,
                precondition: editingCase.precondition ?? '',
                steps: editingCase.steps,
                tags: editingCase.tags,
                policy: editingCase.policy
              }
            : undefined
        }
      />
      <TestHooksModal
        open={hooksModalOpen}
        testId={test.id}
        onClose={() => setHooksModalOpen(false)}
        onSaved={setLinkedHookCount}
        sidebarCollapsed={sidebarCollapsed}
      />
      <ConfirmDialog
        open={!!deletingCase}
        onClose={() => setDeletingCase(null)}
        onConfirm={handleConfirmDelete}
        title="테스트 케이스 삭제"
        description={`"${deletingCase?.name}" 테스트 케이스를 삭제하면 관련된 모든 실행 기록이 함께 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  )
}
