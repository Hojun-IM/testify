import type { ProjectSummary } from '../../../shared/types'
import { FolderIcon } from './icons'

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export function ProjectCard({ project }: { project: ProjectSummary }): JSX.Element {
  const isActive = project.status === 'active'

  return (
    <div className="project-card bg-raised border-line">
      <span className="project-card-corner" />
      <span
        className={`status-badge ${isActive ? 'status-badge-active text-ok' : 'status-badge-archived text-ivory-faint'}`}
      >
        {isActive ? 'active' : 'archived'}
      </span>

      <div className="project-card-icon text-ivory-faint">
        <FolderIcon size={36} />
      </div>

      <h3 className="project-card-title text-ivory">{project.name}</h3>
      {/*<p className="project-card-id text-ivory-faint">{project.id}</p>*/}

      <div className="project-card-stats text-ivory-dim">
        <span>테스트 {project.test_count}개</span>
        <span className="text-ivory-faint">·</span>
        <span>케이스 {project.test_case_count}개</span>
      </div>

      <div className="project-card-dates text-ivory-faint">
        <span>생성 {formatDate(project.created_dt)}</span>
        <span>수정 {formatDate(project.updated_dt)}</span>
      </div>
    </div>
  )
}
