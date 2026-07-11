import { useMemo, useState } from 'react'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import { Table, type TableColumn } from '../ui/Table'
import { Pagination } from '../ui/Pagination'
import { IconMenuButton } from '../ui/IconMenuButton'
import styles from './ProjectTestsSection.module.css'

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'api', label: 'API' },
  { value: 'e2e', label: 'E2E' }
]

const PAGE_SIZE = 8

type TestType = 'api' | 'e2e'
type TestResult = 'pass' | 'fail' | 'none'

type TestSummary = {
  id: string
  name: string
  type: TestType
  lastResult: TestResult
  updated_dt: string
}

// TODO: 테스트(test) API가 생기면 실제 목록 조회로 교체
const MOCK_TESTS: TestSummary[] = Array.from({ length: 23 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `테스트 시나리오 ${i + 1}`,
  type: i % 3 === 0 ? 'e2e' : 'api',
  lastResult: i % 5 === 0 ? 'fail' : i % 4 === 0 ? 'none' : 'pass',
  updated_dt: `2026-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')} 10:00`
}))

const RESULT_LABEL: Record<TestResult, string> = { pass: 'PASS', fail: 'FAIL', none: '미실행' }
const RESULT_CLASS: Record<TestResult, string> = {
  pass: 'text-ok',
  fail: 'text-danger',
  none: 'text-ivory-faint'
}

const columns: TableColumn<TestSummary>[] = [
  { key: 'name', header: '이름', render: (row) => row.name },
  { key: 'type', header: '타입', width: '80px', render: (row) => row.type.toUpperCase() },
  {
    key: 'lastResult',
    header: '마지막 실행',
    width: '100px',
    render: (row) => <span className={RESULT_CLASS[row.lastResult]}>{RESULT_LABEL[row.lastResult]}</span>
  },
  { key: 'updated_dt', header: '업데이트됨', width: '160px', render: (row) => row.updated_dt },
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

export function ProjectTestsSection(): JSX.Element {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return MOCK_TESTS.filter((test) => {
      const matchesType = type === 'all' || test.type === type
      const matchesSearch = test.name.toLowerCase().includes(search.trim().toLowerCase())
      return matchesType && matchesSearch
    })
  }, [search, type])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearchChange(value: string): void {
    setSearch(value)
    setPage(1)
  }

  function handleTypeChange(value: string): void {
    setType(value)
    setPage(1)
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
          <Button>새 테스트</Button>
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
          totalItems={filtered.length}
        />
      </div>
    </div>
  )
}
