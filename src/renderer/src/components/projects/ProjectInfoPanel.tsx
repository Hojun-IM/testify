import { useEffect, useState, type ReactNode } from 'react'
import type { ProjectEnvironment, ProjectSummary } from '../../../../shared/types'
import { StatusBadge } from '../ui/StatusBadge'
import { EnvironmentBadgeList } from './EnvironmentBadgeList'
import { formatDateTime } from '../../utils/format'
import styles from './ProjectInfoPanel.module.css'

function InfoRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className={styles.row}>
      <span className={`${styles.label} text-ivory-faint`}>{label}</span>
      {children}
    </div>
  )
}

export function ProjectInfoPanel({
  project,
  environmentsVersion
}: {
  project: ProjectSummary
  environmentsVersion?: number
}): JSX.Element {
  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([])

  useEffect(() => {
    let cancelled = false
    window.api.projects.environments(project.id).then((result) => {
      if (!cancelled) setEnvironments(result)
    })
    return () => {
      cancelled = true
    }
    // 프로젝트 수정 모달에서 환경을 바꾸면 project.id는 그대로라 이 effect가 재실행되지 않으므로,
    // 수정 성공 시 부모가 올려주는 environmentsVersion을 의존성에 포함해 강제로 재조회한다
  }, [project.id, environmentsVersion])

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
