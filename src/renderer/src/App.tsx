import { useState } from 'react'
import type { ProjectSummary, Test, TestCase } from '../../shared/types'
import { Sidebar, type SidebarTab } from './components/layout/Sidebar'
import { PanelIcon } from './components/ui/icons'
import { ProjectsView } from './components/projects/ProjectsView'
import { ProjectDetailView } from './components/projects/ProjectDetailView'
import { ProjectFormModal, type ProjectFormValues } from './components/projects/ProjectFormModal'
import { ProjectPickerModal } from './components/projects/ProjectPickerModal'
import { TestFormModal, type TestFormValues } from './components/projects/TestFormModal'
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

  // 사이드바 "새 프로젝트"
  const [projectFormOpen, setProjectFormOpen] = useState(false)

  // 사이드바 "새 테스트" — 현재 열려 있는 프로젝트가 없으면 먼저 어느 프로젝트에 만들지 고르게 한다
  const [testFormOpen, setTestFormOpen] = useState(false)
  const [testFormProjectId, setTestFormProjectId] = useState<string | null>(null)
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)
  const [pickerProjects, setPickerProjects] = useState<ProjectSummary[]>([])

  // 사이드바 "새 훅" — 훅 탭으로 이동시키면서 생성 패널을 바로 띄우라는 신호
  const [hookAutoOpen, setHookAutoOpen] = useState(false)

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

  // 사이드바 "새 프로젝트" — 만들자마자 그 프로젝트로 이동한다 (ProjectsView의 생성 흐름과 동일)
  async function handleCreateProject(values: ProjectFormValues): Promise<void> {
    const created = await window.api.projects.create(values)
    openProject({ ...created, test_count: 0, test_case_count: 0 })
  }

  // 사이드바 "새 테스트" — 열려 있는 프로젝트가 있으면 바로, 없으면 먼저 프로젝트를 고르게 한다
  async function openCreateTestFlow(): Promise<void> {
    if (activeProject) {
      setTestFormProjectId(activeProject.id)
      setTestFormOpen(true)
      return
    }
    const all = await window.api.projects.list({ status: 'all' })
    setPickerProjects(all)
    setProjectPickerOpen(true)
  }

  function handlePickProjectForTest(project: ProjectSummary): void {
    setProjectPickerOpen(false)
    openProject(project)
    setTestFormProjectId(project.id)
    setTestFormOpen(true)
  }

  async function handleCreateTest(values: TestFormValues): Promise<void> {
    if (!testFormProjectId) return
    const created = await window.api.tests.create({ project_id: testFormProjectId, ...values })
    setActiveTest(created)
  }

  // 사이드바 "새 훅" — 훅 탭으로 이동하면서 생성 패널을 바로 띄운다 (전역 훅으로 생성됨)
  function openCreateHookFlow(): void {
    setActiveTab('hook')
    setHookAutoOpen(true)
  }

  // 케이스 재생이 실제로 시작될 때(최초 실행/재실행 모두)마다 호출된다 — "가장 최근에 실행한
  // 테스트의 프로젝트"가 최근 항목 맨 위로 오도록, 단순 클릭 탐색과 별개로 실행 시점 자체에 반응한다
  async function handleTestRunStart(testId: string): Promise<void> {
    const test = await window.api.tests.get(testId)
    if (!test) return
    if (activeProject?.id === test.project_id) {
      setRecentProjects((prev) => [activeProject, ...prev.filter((item) => item.id !== activeProject.id)])
      return
    }
    const project = await window.api.projects.get(test.project_id)
    if (!project) return
    setRecentProjects((prev) => [project, ...prev.filter((item) => item.id !== project.id)])
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
          onCreateProject={() => setProjectFormOpen(true)}
          onCreateTest={() => void openCreateTestFlow()}
          onCreateHook={openCreateHookFlow}
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
            onTestRunStart={handleTestRunStart}
          />
        ) : activeTab === 'hook' ? (
          <HooksView
            sidebarCollapsed={!sidebarOpen}
            autoOpenCreate={hookAutoOpen}
            onAutoOpenConsumed={() => setHookAutoOpen(false)}
          />
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

      <ProjectFormModal
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSubmit={handleCreateProject}
        sidebarCollapsed={!sidebarOpen}
      />
      <ProjectPickerModal
        open={projectPickerOpen}
        projects={pickerProjects}
        onClose={() => setProjectPickerOpen(false)}
        onSelect={handlePickProjectForTest}
        sidebarCollapsed={!sidebarOpen}
      />
      <TestFormModal
        open={testFormOpen}
        onClose={() => setTestFormOpen(false)}
        onSubmit={handleCreateTest}
        sidebarCollapsed={!sidebarOpen}
      />
    </div>
  )
}

export default App
