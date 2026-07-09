import { useEffect, useState } from 'react'
import type { ProjectSummary } from '../../../shared/types'
import { ContentHeaderBar } from './ContentHeaderBar'
import { ProjectCard } from './ProjectCard'

export function ProjectsView(): JSX.Element {
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
      <ContentHeaderBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        onCreateProject={handleCreateProject}
      />
      <div className="project-list">
        {projects.length === 0 ? (
          <p className="text-ivory-faint project-list-empty">
            프로젝트가 없습니다. 프로젝트를 생성하여 테스트를 시작하세요.
          </p>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
