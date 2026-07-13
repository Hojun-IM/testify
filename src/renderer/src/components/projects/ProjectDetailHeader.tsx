import { useState } from 'react'
import type { ProjectEnvironmentInput, ProjectSummary } from '../../../../shared/types'
import { FolderIcon } from '../ui/icons'
import { ContentHeader } from '../layout/ContentHeader'
import { ContentHeaderTitle } from '../layout/ContentHeaderTitle'
import { StatusBadge } from '../ui/StatusBadge'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ProjectActionsMenu } from './ProjectActionsMenu'
import { ProjectFormModal, type ProjectFormValues } from './ProjectFormModal'

export function ProjectDetailHeader({
  project,
  sidebarCollapsed,
  onProjectUpdated,
  onProjectDeleted,
  onEnvironmentsChanged
}: {
  project: ProjectSummary
  sidebarCollapsed?: boolean
  onProjectUpdated: (project: ProjectSummary) => void
  onProjectDeleted: () => void
  onEnvironmentsChanged: () => void
}): JSX.Element {
  const [editOpen, setEditOpen] = useState(false)
  const [editEnvironments, setEditEnvironments] = useState<ProjectEnvironmentInput[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleToggleStatus(): Promise<void> {
    const nextStatus = project.status === 'active' ? 'archived' : 'active'
    const updated = await window.api.projects.setStatus(project.id, nextStatus)
    onProjectUpdated({ ...project, ...updated })
  }

  async function handleOpenEdit(): Promise<void> {
    const envs = await window.api.projects.environments(project.id)
    setEditEnvironments(envs.map((env) => ({ name: env.name, url: env.url })))
    setEditOpen(true)
  }

  async function handleEditSubmit(values: ProjectFormValues): Promise<void> {
    const updated = await window.api.projects.update({ id: project.id, ...values })
    onProjectUpdated({ ...project, ...updated })
    onEnvironmentsChanged()
  }

  async function handleDelete(): Promise<void> {
    await window.api.projects.remove(project.id)
    setDeleteOpen(false)
    onProjectDeleted()
  }

  return (
    <>
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
        right={
          <ProjectActionsMenu
            project={project}
            onToggleStatus={handleToggleStatus}
            onEdit={handleOpenEdit}
            onDelete={() => setDeleteOpen(true)}
          />
        }
      />
      <ProjectFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        mode="edit"
        initialValues={{ name: project.name, environments: editEnvironments }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="프로젝트 삭제"
        description={`"${project.name}" 프로젝트를 삭제하면 프로젝트에 속한 모든 테스트, 테스트 케이스, 실행 기록이 함께 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
      />
    </>
  )
}
