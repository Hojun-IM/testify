import { useEffect, useState } from 'react'
import type { ProjectSummary } from '../../../../shared/types'
import { ContentDetailHeader } from '../layout/ContentDetailHeader'
import { SearchInput } from '../ui/SearchInput'
import { Dropdown, DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { ProjectCard } from './ProjectCard'
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

  async function handleCreateProject(): Promise<void> {
    const name = window.prompt('프로젝트명을 입력하세요')
    if (!name || !name.trim()) return

    await window.api.projects.create({ name })
    const result = await window.api.projects.list({
      status: status as 'all' | 'active' | 'archived',
      search
    })
    setProjects(result)
  }

  return (
    <>
      <ContentDetailHeader
        right={
          <>
            <Dropdown label="필터 기준" options={filterOptions} value={status} onChange={setStatus} />
            <Button onClick={handleCreateProject}>새 프로젝트</Button>
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
    </>
  )
}
