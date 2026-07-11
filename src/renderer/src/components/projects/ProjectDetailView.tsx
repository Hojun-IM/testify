import type { ProjectSummary } from '../../../../shared/types'
import { ProjectDetailHeader } from './ProjectDetailHeader'
import { ProjectInfoPanel } from './ProjectInfoPanel'
import { ProjectStatsPanel } from './ProjectStatsPanel'
import { ProjectTestsSection } from './ProjectTestsSection'
import styles from './ProjectDetailView.module.css'

export function ProjectDetailView({
  project,
  sidebarCollapsed
}: {
  project: ProjectSummary
  sidebarCollapsed?: boolean
}): JSX.Element {
  return (
    <div className={styles.detail}>
      <ProjectDetailHeader project={project} sidebarCollapsed={sidebarCollapsed} />
      <div className={styles.body}>
        <div className={styles.row}>
          <ProjectInfoPanel project={project} />
          <ProjectStatsPanel />
        </div>
        <ProjectTestsSection />
      </div>
    </div>
  )
}
