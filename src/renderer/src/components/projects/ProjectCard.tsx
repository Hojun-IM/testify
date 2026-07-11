import type { ProjectSummary } from '../../../../shared/types'
import { FolderIcon } from '../ui/icons'
import { StatusBadge } from '../ui/StatusBadge'
import { ProjectActionsMenu } from './ProjectActionsMenu'
import styles from './ProjectCard.module.css'

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export function ProjectCard({
  project,
  onClick,
  onToggleStatus,
  onEdit,
  onDelete
}: {
  project: ProjectSummary
  onClick: () => void
  onToggleStatus: () => void
  onEdit: () => void
  onDelete: () => void
}): JSX.Element {
  return (
    <div className={`${styles.card} bg-raised border-line hover:bg-overlay`} onClick={onClick}>
      <span className={styles.corner} />
      <div className={styles.topRow}>
        <StatusBadge status={project.status} />
        <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
          <ProjectActionsMenu
            project={project}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      <div className={`${styles.icon} text-ivory-faint`}>
        <FolderIcon size={36} />
      </div>

      <h3 className={`${styles.title} text-ivory`}>{project.name}</h3>

      <div className={`${styles.stats} text-ivory-dim`}>
        <span>테스트 {project.test_count}개</span>
        <span className="text-ivory-faint">·</span>
        <span>케이스 {project.test_case_count}개</span>
      </div>

      <div className={`${styles.dates} text-ivory-faint`}>
        <span>생성 {formatDate(project.created_dt)}</span>
        <span>수정 {formatDate(project.updated_dt)}</span>
      </div>
    </div>
  )
}
