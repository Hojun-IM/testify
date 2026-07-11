import { useState } from 'react'
import type { ProjectSummary } from '../../shared/types'
import { Sidebar } from './components/layout/Sidebar'
import { PanelIcon } from './components/ui/icons'
import { ProjectsView } from './components/projects/ProjectsView'
import { ProjectDetailView } from './components/projects/ProjectDetailView'
import styles from './App.module.css'

function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null)
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([])

  function openProject(project: ProjectSummary): void {
    setActiveProject(project)
    setRecentProjects((prev) => [project, ...prev.filter((item) => item.id !== project.id)])
  }

  function handleProjectUpdated(updated: ProjectSummary): void {
    setActiveProject(updated)
    setRecentProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  function handleProjectDeleted(): void {
    setRecentProjects((prev) => prev.filter((item) => item.id !== activeProject?.id))
    setActiveProject(null)
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
          <ProjectDetailView
            project={activeProject}
            sidebarCollapsed={!sidebarOpen}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
          />
        ) : (
          <ProjectsView onOpenProject={openProject} />
        )}
      </main>
    </div>
  )
}

export default App
