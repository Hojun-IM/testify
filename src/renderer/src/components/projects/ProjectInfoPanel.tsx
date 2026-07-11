import { useEffect, useState, type ReactNode } from 'react'
import type { ProjectEnvironment, ProjectSummary } from '../../../../shared/types'
import { StatusBadge } from '../ui/StatusBadge'
import { EnvironmentBadgeList } from './EnvironmentBadgeList'
import styles from './ProjectInfoPanel.module.css'

function formatDateTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16)
}

function InfoRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className={styles.row}>
      <span className={`${styles.label} text-ivory-faint`}>{label}</span>
      {children}
    </div>
  )
}

export function ProjectInfoPanel({ project }: { project: ProjectSummary }): JSX.Element {
  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([])

  useEffect(() => {
    let cancelled = false
    window.api.projects.environments(project.id).then((result) => {
      if (!cancelled) setEnvironments(result)
    })
    return () => {
      cancelled = true
    }
  }, [project.id])

  return (
    <div className={`${styles.panel} bg-raised border-line`}>
      <div className={styles.grid}>
        <InfoRow label="프로젝트명">
          <span className="text-ivory">{project.name}</span>
        </InfoRow>
        <InfoRow label="상태">
          <StatusBadge status={project.status} />
        </InfoRow>
        <InfoRow label="테스트">
          <span className="text-ivory">{project.test_count}개</span>
        </InfoRow>
        <InfoRow label="테스트 케이스">
          <span className="text-ivory">{project.test_case_count}개</span>
        </InfoRow>
        <InfoRow label="등록된 환경">
          <EnvironmentBadgeList environments={environments} />
        </InfoRow>
        <InfoRow label="생성일">
          <span className="text-ivory">{formatDateTime(project.created_dt)}</span>
        </InfoRow>
      </div>
    </div>
  )
}
