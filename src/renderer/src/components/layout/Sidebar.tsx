import { useState } from 'react'
import type { ProjectSummary } from '../../../../shared/types'
import {
  ArtifactIcon,
  ChevronDownIcon,
  DashboardIcon,
  FolderIcon,
  LeafIcon,
  PanelIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon
} from '../ui/icons'
import { Tabs } from '../ui/Tabs'
import { MenuList } from '../ui/MenuList'
import { MenuItem } from '../ui/MenuItem'
import styles from './Sidebar.module.css'

type Tab = 'project' | 'dashboard' | 'hook'

const menuItems = [{ icon: <PlusIcon />, label: '새 프로젝트' }]

const moreItems = [
  { icon: <PlusIcon />, label: '새 테스트' },
  { icon: <ArtifactIcon />, label: '새 훅' }
]

export function Sidebar({
  onCollapse,
  recentProjects,
  onSelectRecent,
  onGoToList
}: {
  onCollapse: () => void
  recentProjects: ProjectSummary[]
  onSelectRecent: (project: ProjectSummary) => void
  onGoToList: () => void
}): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('project')
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <aside className={`${styles.sidebar} bg-surface border-line`}>
      <div className={styles.titlebar}>
        <button
          type="button"
          className="icon-btn text-ivory-dim"
          aria-label="사이드바 닫기"
          onClick={onCollapse}
        >
          <PanelIcon />
        </button>
        <button type="button" className="icon-btn text-ivory-dim" aria-label="검색">
          <SearchIcon />
        </button>
      </div>

      <Tabs
        items={[
          { value: 'project', icon: <FolderIcon />, label: '프로젝트' },
          { value: 'dashboard', icon: <DashboardIcon />, label: '대시보드' },
          { value: 'hook', icon: <ArtifactIcon />, label: '훅' }
        ]}
        value={activeTab}
        onChange={(tab) => {
          setActiveTab(tab as Tab)
          if (tab === 'project') onGoToList()
        }}
      />

      <MenuList>
        {menuItems.map((item) => (
          <MenuItem key={item.label} icon={item.icon} label={item.label} />
        ))}
        <MenuItem
          icon={<ChevronDownIcon />}
          iconClassName="chevron"
          iconStyle={{ transform: moreOpen ? 'rotate(180deg)' : undefined }}
          label="더보기"
          muted
          onClick={() => setMoreOpen((prev) => !prev)}
        />
        {moreOpen &&
          moreItems.map((item) => <MenuItem key={item.label} icon={item.icon} label={item.label} />)}
      </MenuList>

      <div className={styles.recentSection}>
        <div className={`${styles.recentHeader} text-ivory-faint`}>
          <span>최근 항목</span>
          <button type="button" className="icon-btn text-ivory-faint" aria-label="최근 항목 설정">
            <SlidersIcon />
          </button>
        </div>
        <ul className={styles.recentList}>
          {recentProjects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                className={`${styles.recentItem} text-ivory hover:bg-overlay`}
                onClick={() => onSelectRecent(project)}
              >
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.footer} border-line`}>
        <button type="button" className={`${styles.updateCard} bg-raised hover:bg-overlay text-ivory`}>
          <span className="text-ivory-dim">
            <LeafIcon />
          </span>
          <span className={styles.updateCardText}>
            <span>Testify</span>
            <span className="text-ivory-faint">v1.0.0</span>
          </span>
        </button>
      </div>
    </aside>
  )
}
