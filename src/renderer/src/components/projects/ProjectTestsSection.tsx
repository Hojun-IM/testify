import { useEffect, useState } from 'react'
import type { Test, TestType } from '../../../../shared/types'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import { Table, type TableColumn } from '../ui/Table'
import { Pagination } from '../ui/Pagination'
import { IconMenuButton } from '../ui/IconMenuButton'
import { NewTestModal } from './NewTestModal'
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

const columns: TableColumn<Test>[] = [
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
    render: () => (
      <IconMenuButton
        ariaLabel="테스트 설정"
        items={[
          { label: '수정', onClick: () => {} },
          { label: '삭제', onClick: () => {}, danger: true }
        ]}
      />
    )
  }
]

export function ProjectTestsSection({ projectId }: { projectId: string }): JSX.Element {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [tests, setTests] = useState<Test[]>([])
  const [newTestOpen, setNewTestOpen] = useState(false)

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

  async function handleCreateTest(input: { name: string; type: TestType }): Promise<void> {
    await window.api.tests.create({ project_id: projectId, name: input.name, type: input.type })
    const result = await window.api.tests.list({ projectId, type: type as TestType | 'all', search })
    setTests(result)
  }

  return (
    <div className={styles.section}>
      <div className={styles.controlsRow}>
        <div className={styles.left}>
          <Dropdown label="타입" options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />
        </div>
        <div className={styles.right}>
          <Button variant="ghost">Export</Button>
          <Button variant="ghost">Import</Button>
          <Button onClick={() => setNewTestOpen(true)}>새 테스트</Button>
        </div>
      </div>
      <SearchInput value={search} onChange={handleSearchChange} placeholder="테스트 검색..." />
      <Table
        columns={columns}
        data={pageItems}
        rowKey={(row) => row.id}
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
      <NewTestModal open={newTestOpen} onClose={() => setNewTestOpen(false)} onCreate={handleCreateTest} />
    </div>
  )
}
