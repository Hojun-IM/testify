import { useEffect, useState } from 'react'
import type { ProjectEnvironmentInput, ProjectSummary } from '../../../../shared/types'
import { ContentDetailHeader } from '../layout/ContentDetailHeader'
import { SearchInput } from '../ui/SearchInput'
import { Dropdown, DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { ProjectCard } from './ProjectCard'
import { NewProjectModal } from './NewProjectModal'
import styles from './ProjectsView.module.css'

const filterOptions: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' }
]

export function ProjectsView({
  onOpenProject
}: {
  onOpenProject: (project: ProjectSummary) => void
}): JSX.Element {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [newProjectOpen, setNewProjectOpen] = useState(false)

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

  async function handleCreateProject(input: {
    name: string
    environments: ProjectEnvironmentInput[]
  }): Promise<void> {
    const created = await window.api.projects.create(input)
    onOpenProject({ ...created, test_count: 0, test_case_count: 0 })
  }

  return (
    <>
      <ContentDetailHeader
        right={
          <>
            <Dropdown label="필터 기준" options={filterOptions} value={status} onChange={setStatus} />
            <Button onClick={() => setNewProjectOpen(true)}>새 프로젝트</Button>
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
              <ProjectCard key={project.id} project={project} onClick={() => onOpenProject(project)} />
            ))}
          </div>
        )}
      </div>
      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreate={handleCreateProject}
      />
    </>
  )
}
