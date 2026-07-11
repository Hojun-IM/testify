import type { ProjectSummary } from '../../../../shared/types'
import { FolderIcon } from '../ui/icons'
import { ContentHeader } from '../layout/ContentHeader'
import { ContentHeaderTitle } from '../layout/ContentHeaderTitle'
import { StatusBadge } from '../ui/StatusBadge'
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
