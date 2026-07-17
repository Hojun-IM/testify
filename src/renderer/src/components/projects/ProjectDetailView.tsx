import { useState } from 'react'
import type { ProjectSummary, Test } from '../../../../shared/types'
import { Tabs } from '../ui/Tabs'
import { ProjectDetailHeader } from './ProjectDetailHeader'
import { ProjectInfoPanel } from './ProjectInfoPanel'
import { ProjectStatsPanel } from './ProjectStatsPanel'
import { ProjectTestsSection } from './ProjectTestsSection'
import { ProjectHooksSection } from '../hooks/ProjectHooksSection'
import styles from './ProjectDetailView.module.css'

export function ProjectDetailView({
  project,
  sidebarCollapsed,
  onProjectUpdated,
  onProjectDeleted,
  onSelectTest,
  onRunTest
}: {
  project: ProjectSummary
  sidebarCollapsed?: boolean
  onProjectUpdated: (project: ProjectSummary) => void
  onProjectDeleted: () => void
  onSelectTest: (test: Test) => void
  onRunTest?: (test: Test) => void
}): JSX.Element {
  const [environmentsVersion, setEnvironmentsVersion] = useState(0)
  // 테스트 목록과 프로젝트 공통 훅 관리를 탭으로 전환
  const [sectionTab, setSectionTab] = useState<'tests' | 'hooks'>('tests')

  return (
    <div className={styles.detail}>
      <ProjectDetailHeader
        project={project}
        sidebarCollapsed={sidebarCollapsed}
        onProjectUpdated={onProjectUpdated}
        onProjectDeleted={onProjectDeleted}
        onEnvironmentsChanged={() => setEnvironmentsVersion((v) => v + 1)}
      />
      <div className={styles.body}>
        <div className={styles.row}>
          <ProjectInfoPanel project={project} environmentsVersion={environmentsVersion} />
          <ProjectStatsPanel projectId={project.id} />
        </div>
        <div className={styles.sectionTabs}>
          <Tabs
            items={[
              { value: 'tests', label: '테스트' },
              { value: 'hooks', label: '훅' }
            ]}
            value={sectionTab}
            onChange={(value) => setSectionTab(value as 'tests' | 'hooks')}
          />
        </div>
        {sectionTab === 'tests' ? (
          <ProjectTestsSection
            projectId={project.id}
            onSelectTest={onSelectTest}
            onRunTest={onRunTest}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : (
          <div className={styles.hooksWrap}>
            <ProjectHooksSection projectId={project.id} sidebarCollapsed={sidebarCollapsed} />
          </div>
        )}
      </div>
    </div>
  )
}
