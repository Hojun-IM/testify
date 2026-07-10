import { useState } from 'react'
import type { ProjectSummary } from '../../shared/types'
import { Sidebar } from './components/Sidebar'
import { PanelIcon } from './components/icons'
import { ProjectsView } from './components/ProjectsView'
import { ProjectDetailView } from './components/ProjectDetailView'
import styles from './App.module.css'

function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null)
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([])

  function openProject(project: ProjectSummary): void {
    setActiveProject(project)
    setRecentProjects((prev) => [project, ...prev.filter((item) => item.id !== project.id)])
  }

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <Sidebar
          onCollapse={() => setSidebarOpen(false)}
          recentProjects={recentProjects}
          onSelectRecent={openProject}
          onGoToList={() => setActiveProject(null)}
        />
      )}
      <main className={`${styles.mainContent} bg-canvas`}>
        {!sidebarOpen && (
          <button
            type="button"
            className={`icon-btn ${styles.expandBtn} text-ivory-dim`}
            aria-label="사이드바 열기"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelIcon />
          </button>
        )}
        {activeProject ? (
          <ProjectDetailView project={activeProject} sidebarCollapsed={!sidebarOpen} />
        ) : (
          <ProjectsView onOpenProject={openProject} />
        )}
      </main>
    </div>
  )
}

export default App
