import type { ProjectSummary } from '../../../shared/types'
import { ProjectDetailHeader } from './ProjectDetailHeader'
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
    </div>
  )
}
