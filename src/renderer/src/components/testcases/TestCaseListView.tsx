import { useEffect, useRef, useState } from 'react'
import type { ProjectEnvironment, ProjectSummary, Test, TestCase } from '../../../../shared/types'
import { ChevronLeftIcon } from '../ui/icons'
import { SearchInput } from '../ui/SearchInput'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TestCaseTable } from './TestCaseTable'
import { TestCaseFormPanel, TEST_CASE_PANEL_WIDTH, type TestCaseFormValues } from './TestCaseFormPanel'
import styles from './TestCaseListView.module.css'

export function TestCaseListView({
  project,
  test,
  onBack,
  sidebarCollapsed
}: {
  project: ProjectSummary
  test: Test
  onBack: () => void
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [search, setSearch] = useState('')
  const [cases, setCases] = useState<TestCase[]>([])
  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([])
  const casesRef = useRef<TestCase[]>([])

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'create' | 'edit'>('create')
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [deletingCase, setDeletingCase] = useState<TestCase | null>(null)

  useEffect(() => {
    casesRef.current = cases
  }, [cases])

  useEffect(() => {
    window.api.projects.environments(project.id).then(setEnvironments)
  }, [project.id])

  async function refreshCases(): Promise<void> {
    const result = await window.api.testCases.list({ testId: test.id, search })
    setCases(result)
  }

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(() => {
      window.api.testCases.list({ testId: test.id, search }).then((result) => {
        if (!cancelled) setCases(result)
      })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [test.id, search])

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

  const environmentOptions = environments.map((env) => env.name)

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

      <div className={styles.body} style={{ paddingRight: panelOpen ? TEST_CASE_PANEL_WIDTH : 0 }}>
        <div className={styles.content}>
          <div className={styles.controlsRow}>
            <div className={styles.left}>
              <SearchInput value={search} onChange={setSearch} placeholder="테스트 케이스 검색..." />
            </div>
            <div className={styles.right}>
              <Button variant="ghost">Export</Button>
              <Button variant="ghost">Import</Button>
              <Button onClick={openCreatePanel}>새 테스트 케이스</Button>
            </div>
          </div>

          <TestCaseTable
            cases={cases}
            onReorderPreview={handleReorderPreview}
            onReorderCommit={handleReorderCommit}
            onRowClick={openEditPanel}
            onEdit={openEditPanel}
            onDelete={setDeletingCase}
          />
        </div>
      </div>

      <TestCaseFormPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handlePanelSubmit}
        mode={panelMode}
        environmentOptions={environmentOptions}
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
      <ConfirmDialog
        open={!!deletingCase}
        onClose={() => setDeletingCase(null)}
        onConfirm={handleConfirmDelete}
        title="테스트 케이스 삭제"
        description={`"${deletingCase?.name}" 테스트 케이스를 삭제하면 관련된 모든 실행 기록이 함께 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
      />
    </div>
  )
}
