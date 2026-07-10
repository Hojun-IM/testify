import { useState } from 'react'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import styles from './ProjectTestsSection.module.css'

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'api', label: 'API' },
  { value: 'e2e', label: 'E2E' }
]

export function ProjectTestsSection(): JSX.Element {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')

  return (
    <div className={styles.section}>
      <div className={styles.controlsRow}>
        <div className={styles.left}>
          <Dropdown label="타입" options={TYPE_OPTIONS} value={type} onChange={setType} />
        </div>
        <div className={styles.right}>
          <Button variant="ghost">Export</Button>
          <Button variant="ghost">Import</Button>
          <Button>새 테스트</Button>
        </div>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="테스트 검색..." />
    </div>
  )
}
