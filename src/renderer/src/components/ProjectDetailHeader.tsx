import type { ProjectSummary } from '../../../shared/types'
import { FolderIcon } from './icons'
import { ContentHeader } from './ContentHeader'
import { ContentHeaderTitle } from './ContentHeaderTitle'
import { StatusBadge } from './StatusBadge'
import { ProjectActionsMenu } from './ProjectActionsMenu'

export function ProjectDetailHeader({
  project,
  sidebarCollapsed
}: {
  project: ProjectSummary
  sidebarCollapsed?: boolean
}): JSX.Element {
  return (
    <ContentHeader
      sidebarCollapsed={sidebarCollapsed}
      left={
        <>
          <span className="text-ivory-faint">
            <FolderIcon size={18} />
          </span>
          <ContentHeaderTitle>{project.name}</ContentHeaderTitle>
          <StatusBadge status={project.status} />
        </>
      }
      right={<ProjectActionsMenu status={project.status} />}
    />
  )
}
