import { useEffect, useState } from 'react'
import type { ProjectEnvironmentInput, ProjectSummary } from '../../../../shared/types'
import { ContentDetailHeader } from '../layout/ContentDetailHeader'
import { SearchInput } from '../ui/SearchInput'
import { Dropdown, DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ProjectCard } from './ProjectCard'
import { ProjectFormModal, type ProjectFormValues } from './ProjectFormModal'
import styles from './ProjectsView.module.css'

const filterOptions: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' }
]

export function ProjectsView({
  onOpenProject,
  sidebarCollapsed
}: {
  onOpenProject: (project: ProjectSummary) => void
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [projects, setProjects] = useState<ProjectSummary[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null)
  const [editingEnvironments, setEditingEnvironments] = useState<ProjectEnvironmentInput[]>([])
  const [deletingProject, setDeletingProject] = useState<ProjectSummary | null>(null)

  async function refreshProjects(): Promise<void> {
    const result = await window.api.projects.list({
      status: status as 'all' | 'active' | 'archived',
      search
    })
    setProjects(result)
  }

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(() => {
      window.api.projects.list({ status: status as 'all' | 'active' | 'archived', search }).then((result) => {
        if (!cancelled) setProjects(result)
      })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, status])

  function openCreateModal(): void {
    setFormMode('create')
    setEditingProject(null)
    setEditingEnvironments([])
    setFormOpen(true)
  }

  async function openEditModal(project: ProjectSummary): Promise<void> {
    const envs = await window.api.projects.environments(project.id)
    setFormMode('edit')
    setEditingProject(project)
    setEditingEnvironments(envs.map((env) => ({ name: env.name, url: env.url })))
    setFormOpen(true)
  }

  async function handleFormSubmit(values: ProjectFormValues): Promise<void> {
    if (formMode === 'edit' && editingProject) {
      await window.api.projects.update({ id: editingProject.id, ...values })
      await refreshProjects()
      return
    }

    const created = await window.api.projects.create(values)
    onOpenProject({ ...created, test_count: 0, test_case_count: 0 })
  }

  async function handleToggleStatus(project: ProjectSummary): Promise<void> {
    const nextStatus = project.status === 'active' ? 'archived' : 'active'
    await window.api.projects.setStatus(project.id, nextStatus)
    await refreshProjects()
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deletingProject) return
    await window.api.projects.remove(deletingProject.id)
    setDeletingProject(null)
    await refreshProjects()
  }

  return (
    <>
      <ContentDetailHeader
        right={
          <>
            <Dropdown label="필터 기준" options={filterOptions} value={status} onChange={setStatus} />
            <Button onClick={openCreateModal}>새 프로젝트</Button>
          </>
        }
      >
        <SearchInput value={search} onChange={setSearch} placeholder="프로젝트 검색..." />
      </ContentDetailHeader>
      <div className={styles.list}>
        {projects.length === 0 ? (
          <p className={`text-ivory-faint ${styles.empty}`}>
            프로젝트가 없습니다. 프로젝트를 생성하여 테스트를 시작하세요.
          </p>
        ) : (
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onOpenProject(project)}
                onToggleStatus={() => handleToggleStatus(project)}
                onEdit={() => openEditModal(project)}
                onDelete={() => setDeletingProject(project)}
              />
            ))}
          </div>
        )}
      </div>
      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        mode={formMode}
        initialValues={
          formMode === 'edit' && editingProject
            ? { name: editingProject.name, environments: editingEnvironments }
            : undefined
        }
        sidebarCollapsed={sidebarCollapsed}
      />
      <ConfirmDialog
        open={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        title="프로젝트 삭제"
        description={`"${deletingProject?.name}" 프로젝트를 삭제하면 프로젝트에 속한 모든 테스트, 테스트 케이스, 실행 기록이 함께 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        sidebarCollapsed={sidebarCollapsed}
      />
    </>
  )
}
