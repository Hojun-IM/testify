import { useState } from 'react'
import type { ProjectSummary, Test } from '../../../../shared/types'
import { ProjectDetailHeader } from './ProjectDetailHeader'
import { ProjectInfoPanel } from './ProjectInfoPanel'
import { ProjectStatsPanel } from './ProjectStatsPanel'
import { ProjectTestsSection } from './ProjectTestsSection'
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
          <ProjectStatsPanel />
        </div>
        <ProjectTestsSection projectId={project.id} onSelectTest={onSelectTest} onRunTest={onRunTest} />
      </div>
    </div>
  )
}
