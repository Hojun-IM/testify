import { useEffect, useState } from 'react'
import type { Test, TestType } from '../../../../shared/types'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import { Table, type TableColumn } from '../ui/Table'
import { Pagination } from '../ui/Pagination'
import { IconMenuButton } from '../ui/IconMenuButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TestFormModal, type TestFormValues } from './TestFormModal'
import styles from './ProjectTestsSection.module.css'

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'api', label: 'API' },
  { value: 'e2e', label: 'E2E' }
]

const PAGE_SIZE = 8

function formatDateTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16)
}

function buildColumns(
  onEdit: (test: Test) => void,
  onDelete: (test: Test) => void,
  onRun?: (test: Test) => void
): TableColumn<Test>[] {
  return [
    { key: 'name', header: '이름', render: (row) => row.name },
    { key: 'type', header: '타입', width: '80px', render: (row) => row.type.toUpperCase() },
    {
      key: 'last_run_at',
      header: '마지막 실행',
      width: '140px',
      render: (row) =>
        row.last_run_at ? (
          <span className="text-ivory-dim">{formatDateTime(row.last_run_at)}</span>
        ) : (
          <span className="text-ivory-faint">미실행</span>
        )
    },
    { key: 'updated_dt', header: '업데이트됨', width: '160px', render: (row) => formatDateTime(row.updated_dt) },
    {
      key: 'actions',
      header: '',
      width: '40px',
      align: 'right',
      truncate: false,
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <IconMenuButton
            ariaLabel="테스트 설정"
            items={[
              // e2e 테스트는 소속 케이스 전체(자동화 스텝 보유분)를 대시보드에서 실행할 수 있다
              ...(onRun && row.type === 'e2e' ? [{ label: '실행', onClick: () => onRun(row) }] : []),
              { label: '수정', onClick: () => onEdit(row) },
              { label: '삭제', onClick: () => onDelete(row), danger: true }
            ]}
          />
        </span>
      )
    }
  ]
}

export function ProjectTestsSection({
  projectId,
  onSelectTest,
  onRunTest,
  sidebarCollapsed
}: {
  projectId: string
  onSelectTest: (test: Test) => void
  // 테스트에 속한 자동화 케이스 전체를 대시보드에서 실행
  onRunTest?: (test: Test) => void
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [tests, setTests] = useState<Test[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [deletingTest, setDeletingTest] = useState<Test | null>(null)

  async function refreshTests(): Promise<void> {
    const result = await window.api.tests.list({ projectId, type: type as TestType | 'all', search })
    setTests(result)
  }

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(() => {
      window.api.tests.list({ projectId, type: type as TestType | 'all', search }).then((result) => {
        if (!cancelled) setTests(result)
      })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [projectId, search, type])

  const totalPages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = tests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearchChange(value: string): void {
    setSearch(value)
    setPage(1)
  }

  function handleTypeChange(value: string): void {
    setType(value)
    setPage(1)
  }

  function openCreateModal(): void {
    setFormMode('create')
    setEditingTest(null)
    setFormOpen(true)
  }

  function openEditModal(test: Test): void {
    setFormMode('edit')
    setEditingTest(test)
    setFormOpen(true)
  }

  async function handleFormSubmit(values: TestFormValues): Promise<void> {
    if (formMode === 'edit' && editingTest) {
      await window.api.tests.update({ id: editingTest.id, ...values })
    } else {
      await window.api.tests.create({ project_id: projectId, ...values })
    }
    await refreshTests()
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deletingTest) return
    await window.api.tests.remove(deletingTest.id)
    setDeletingTest(null)
    await refreshTests()
  }

  const columns = buildColumns(openEditModal, setDeletingTest, onRunTest)

  return (
    <div className={styles.section}>
      <div className={styles.controlsRow}>
        <div className={styles.left}>
          <Dropdown label="타입" options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />
        </div>
        <div className={styles.right}>
          <Button variant="ghost">Export</Button>
          <Button variant="ghost">Import</Button>
          <Button onClick={openCreateModal}>새 테스트</Button>
        </div>
      </div>
      <SearchInput value={search} onChange={handleSearchChange} placeholder="테스트 검색..." />
      <Table
        columns={columns}
        data={pageItems}
        rowKey={(row) => row.id}
        onRowClick={onSelectTest}
        emptyMessage="테스트가 없습니다."
      />
      <div className={styles.footer}>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={tests.length}
        />
      </div>
      <TestFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        mode={formMode}
        initialValues={
          formMode === 'edit' && editingTest ? { name: editingTest.name, type: editingTest.type } : undefined
        }
        sidebarCollapsed={sidebarCollapsed}
      />
      <ConfirmDialog
        open={!!deletingTest}
        onClose={() => setDeletingTest(null)}
        onConfirm={handleConfirmDelete}
        title="테스트 삭제"
        description={`"${deletingTest?.name}" 테스트를 삭제하면 여기에 속한 모든 테스트 케이스와 실행 기록이 함께 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  )
}
