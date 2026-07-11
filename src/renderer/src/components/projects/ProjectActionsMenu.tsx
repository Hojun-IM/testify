import type { ProjectSummary } from '../../../../shared/types'
import { IconMenuButton } from '../ui/IconMenuButton'

export function ProjectActionsMenu({
  project,
  onToggleStatus,
  onEdit,
  onDelete
}: {
  project: ProjectSummary
  onToggleStatus: () => void
  onEdit: () => void
  onDelete: () => void
}): JSX.Element {
  const isActive = project.status === 'active'

  return (
    <IconMenuButton
      ariaLabel="프로젝트 설정"
      items={[
        { label: isActive ? '비활성화' : '활성화', onClick: onToggleStatus },
        { label: '수정', onClick: onEdit },
        { label: '삭제', onClick: onDelete, danger: true }
      ]}
    />
  )
}
