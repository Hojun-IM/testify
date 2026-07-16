import { useState } from 'react'
import type { ProjectSummary, Test, TestCase } from '../../shared/types'
import { Sidebar, type SidebarTab } from './components/layout/Sidebar'
import { PanelIcon } from './components/ui/icons'
import { ProjectsView } from './components/projects/ProjectsView'
import { ProjectDetailView } from './components/projects/ProjectDetailView'
import { TestCaseListView } from './components/testcases/TestCaseListView'
import { DashboardView } from './components/dashboard/DashboardView'
import { HooksView } from './components/hooks/HooksView'
import styles from './App.module.css'

function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<SidebarTab>('project')
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null)
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([])
  const [activeTest, setActiveTest] = useState<Test | null>(null)
  // 테스트 케이스 목록의 "실행"(단건 또는 일괄 선택)에서 대시보드로 넘겨 재생할 케이스들
  const [autoPlayCases, setAutoPlayCases] = useState<TestCase[] | null>(null)

  function runCasesOnDashboard(testCases: TestCase[]): void {
    setActiveTab('dashboard')
    setAutoPlayCases(testCases)
  }

  // 테스트 목록의 "실행" — 해당 테스트에 속한 자동화 케이스 전체를 대시보드에서 실행
  async function runTestOnDashboard(test: Test): Promise<void> {
    const cases = await window.api.testCases.list({ testId: test.id })
    const runnable = cases.filter((item) => item.steps.some((step) => step.automation))
    if (runnable.length === 0) return
    runCasesOnDashboard(runnable)
  }

  function openProject(project: ProjectSummary): void {
    setActiveTab('project')
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
        {activeTab === 'dashboard' ? (
          <DashboardView
            sidebarCollapsed={!sidebarOpen}
            autoPlayCases={autoPlayCases}
            onAutoPlayConsumed={() => setAutoPlayCases(null)}
          />
        ) : activeTab === 'hook' ? (
          <HooksView sidebarCollapsed={!sidebarOpen} />
        ) : activeProject && activeTest ? (
          <TestCaseListView
            project={activeProject}
            test={activeTest}
            onBack={() => setActiveTest(null)}
            sidebarCollapsed={!sidebarOpen}
            onRunCases={runCasesOnDashboard}
          />
        ) : activeProject ? (
          <ProjectDetailView
            project={activeProject}
            sidebarCollapsed={!sidebarOpen}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
            onSelectTest={setActiveTest}
            onRunTest={runTestOnDashboard}
          />
        ) : (
          <ProjectsView onOpenProject={openProject} sidebarCollapsed={!sidebarOpen} />
        )}
      </main>
    </div>
  )
}

export default App
