import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { PanelIcon } from './components/icons'
import { ProjectsView } from './components/ProjectsView'

function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="layout">
      {sidebarOpen && <Sidebar onCollapse={() => setSidebarOpen(false)} />}
      <main className="main-content bg-canvas">
        {!sidebarOpen && (
          <button
            type="button"
            className="icon-btn sidebar-expand-btn text-ivory-dim"
            aria-label="사이드바 열기"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelIcon />
          </button>
        )}
        <ProjectsView />
      </main>
    </div>
  )
}

export default App
