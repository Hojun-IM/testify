import { useState } from 'react'
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
} from './icons'

type Tab = 'project' | 'dashboard' | 'hook'

const menuItems = [{ icon: <PlusIcon />, label: '새 프로젝트' }]

const moreItems = [
  { icon: <PlusIcon />, label: '새 테스트' },
  { icon: <ArtifactIcon />, label: '새 훅' }
]

const recentItems = ['testify']

export function Sidebar({ onCollapse }: { onCollapse: () => void }): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('project')
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <aside className="sidebar bg-surface border-line">
      <div className="sidebar-titlebar">
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

      <nav className="tabs bg-raised">
        <TabButton
          active={activeTab === 'project'}
          icon={<FolderIcon />}
          label="프로젝트"
          onClick={() => setActiveTab('project')}
        />
        <TabButton
          active={activeTab === 'dashboard'}
          icon={<DashboardIcon />}
          label="대시보드"
          onClick={() => setActiveTab('dashboard')}
        />
        <TabButton
          active={activeTab === 'hook'}
          icon={<ArtifactIcon />}
          label="훅"
          onClick={() => setActiveTab('hook')}
        />
      </nav>

      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.label}>
            <button type="button" className="menu-item text-ivory hover:bg-overlay">
              <span className="text-ivory-faint">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="menu-item text-ivory-dim hover:bg-overlay"
            onClick={() => setMoreOpen((prev) => !prev)}
          >
            <span
              className="text-ivory-faint chevron"
              style={{ transform: moreOpen ? 'rotate(180deg)' : undefined }}
            >
              <ChevronDownIcon />
            </span>
            더보기
          </button>
        </li>
        {moreOpen &&
          moreItems.map((item) => (
            <li key={item.label}>
              <button type="button" className="menu-item text-ivory hover:bg-overlay">
                <span className="text-ivory-faint">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
      </ul>

      <div className="recent-section">
        <div className="recent-header text-ivory-faint">
          <span>최근 항목</span>
          <button type="button" className="icon-btn text-ivory-faint" aria-label="최근 항목 설정">
            <SlidersIcon />
          </button>
        </div>
        <ul className="recent-list">
          {recentItems.map((item) => (
            <li key={item}>
              <button type="button" className="recent-item bg-overlay text-ivory">
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer border-line">
        <button type="button" className="update-card bg-raised hover:bg-overlay text-ivory">
          <span className="text-ivory-dim">
            <LeafIcon />
          </span>
          <span className="update-card-text">
            <span>Testify</span>
            <span className="text-ivory-faint">v1.0.0</span>
          </span>
          {/*<span className="text-ivory-faint">*/}
          {/*  <ArrowRightIcon />*/}
          {/*</span>*/}
        </button>

        {/*<button type="button" className="user-row hover:bg-overlay">*/}
        {/*  <span className="avatar bg-overlay text-ivory">HI</span>*/}
        {/*  <span className="text-ivory">Hojun</span>*/}
        {/*  <span className="text-ivory-faint">· Pro</span>*/}
        {/*  <span className="text-ivory-faint user-row-chevron">*/}
        {/*    <ChevronDownIcon />*/}
        {/*  </span>*/}
        {/*</button>*/}
      </div>
    </aside>
  )
}

function TabButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tab-btn ${active ? 'tab-btn-active bg-overlay text-ivory' : 'text-ivory-faint'}`}
    >
      {icon}
      {label}
    </button>
  )
}
