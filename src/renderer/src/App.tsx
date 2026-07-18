import { useEffect, useRef, useState } from 'react'
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

  // 데스크톱 펫 연동 — 마지막으로 실행한 케이스 목록을 대시보드 밖(App)에서도 기억해서
  // 대시보드가 언마운트돼 있어도 펫의 "실행/재실행" 명령을 처리할 수 있게 한다
  const lastRunCasesRef = useRef<TestCase[]>([])
  // 펫의 중지/취소 명령을 대시보드로 전달하는 신호. id로 같은 명령의 중복 실행을 막는다
  const [petCommand, setPetCommand] = useState<{ id: number; action: 'stop' | 'cancel' } | null>(null)
  const petCommandSeqRef = useRef(0)

  function runCasesOnDashboard(testCases: TestCase[]): void {
    setActiveTab('dashboard')
    setAutoPlayCases(testCases)
  }

  useEffect(() => {
    return window.api.pet.onCommand((action) => {
      if (action === 'rerun') {
        // 새 배열로 넘겨야 대시보드의 autoPlay 중복 실행 가드(참조 비교)에 걸리지 않는다
        if (lastRunCasesRef.current.length > 0) runCasesOnDashboard([...lastRunCasesRef.current])
        return
      }
      if (action === 'stop' || action === 'cancel') {
        petCommandSeqRef.current += 1
        setPetCommand({ id: petCommandSeqRef.current, action })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            petCommand={petCommand}
            onCasesPlayed={(cases) => {
              lastRunCasesRef.current = cases
            }}
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
