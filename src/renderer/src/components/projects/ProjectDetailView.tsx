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
  onSelectTest
}: {
  project: ProjectSummary
  sidebarCollapsed?: boolean
  onProjectUpdated: (project: ProjectSummary) => void
  onProjectDeleted: () => void
  onSelectTest: (test: Test) => void
}): JSX.Element {
  return (
    <div className={styles.detail}>
      <ProjectDetailHeader
        project={project}
        sidebarCollapsed={sidebarCollapsed}
        onProjectUpdated={onProjectUpdated}
        onProjectDeleted={onProjectDeleted}
      />
      <div className={styles.body}>
        <div className={styles.row}>
          <ProjectInfoPanel project={project} />
          <ProjectStatsPanel />
        </div>
        <ProjectTestsSection projectId={project.id} onSelectTest={onSelectTest} />
      </div>
    </div>
  )
}
