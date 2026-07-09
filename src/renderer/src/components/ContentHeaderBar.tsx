import { SearchIcon } from './icons'
import { Dropdown, DropdownOption } from './Dropdown'
import { Button } from './Button'

const filterOptions: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' }
]

export function ContentHeaderBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onCreateProject
}: {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  onCreateProject: () => void
}): JSX.Element {
  return (
    <div className="content-header">
      <div className="header-controls-row">
        <Dropdown label="필터 기준" options={filterOptions} value={status} onChange={onStatusChange} />
        <Button onClick={onCreateProject}>새 프로젝트</Button>
      </div>
      <div className="top-search bg-raised">
        <span className="text-ivory-faint">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="프로젝트 검색..."
          className="text-ivory"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  )
}
