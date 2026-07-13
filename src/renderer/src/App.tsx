import { useState } from 'react'
import type { ProjectSummary, Test } from '../../shared/types'
import { Sidebar } from './components/layout/Sidebar'
import { PanelIcon } from './components/ui/icons'
import { ProjectsView } from './components/projects/ProjectsView'
import { ProjectDetailView } from './components/projects/ProjectDetailView'
import { TestCaseListView } from './components/testcases/TestCaseListView'
import styles from './App.module.css'

function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null)
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([])
  const [activeTest, setActiveTest] = useState<Test | null>(null)

  function openProject(project: ProjectSummary): void {
    setActiveProject(project)
    setActiveTest(null)
    setRecentProjects((prev) => [project, ...prev.filter((item) => item.id !== project.id)])
  }

  function handleProjectUpdated(updated: ProjectSummary): void {
    setActiveProject(updated)
    setRecentProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  function handleProjectDeleted(): void {
    setRecentProjects((prev) => prev.filter((item) => item.id !== activeProject?.id))
    setActiveProject(null)
    setActiveTest(null)
  }

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <Sidebar
          onCollapse={() => setSidebarOpen(false)}
          recentProjects={recentProjects}
          onSelectRecent={openProject}
          onGoToList={() => {
            setActiveProject(null)
            setActiveTest(null)
          }}
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
        {activeProject && activeTest ? (
          <TestCaseListView
            project={activeProject}
            test={activeTest}
            onBack={() => setActiveTest(null)}
            sidebarCollapsed={!sidebarOpen}
          />
        ) : activeProject ? (
          <ProjectDetailView
            project={activeProject}
            sidebarCollapsed={!sidebarOpen}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
            onSelectTest={setActiveTest}
          />
        ) : (
          <ProjectsView onOpenProject={openProject} />
        )}
      </main>
    </div>
  )
}

export default App
