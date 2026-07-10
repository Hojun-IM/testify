import type { ReactNode } from 'react'
import type { ProjectSummary } from '../../../../shared/types'
import { StatusBadge } from '../ui/StatusBadge'
import { EnvironmentBadgeList, type ProjectEnvironment } from './EnvironmentBadgeList'
import styles from './ProjectInfoPanel.module.css'

// TODO: 프로젝트별 환경 등록 기능이 생기면 실제 데이터로 교체
const MOCK_ENVIRONMENTS: ProjectEnvironment[] = [
  { name: 'local', url: 'http://localhost:5173' },
  { name: 'dev', url: 'https://dev.testify.example.com' },
  { name: 'prod', url: 'https://testify.example.com' }
]

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
          <EnvironmentBadgeList environments={MOCK_ENVIRONMENTS} />
        </InfoRow>
        <InfoRow label="생성일">
          <span className="text-ivory">{formatDateTime(project.created_dt)}</span>
        </InfoRow>
      </div>
    </div>
  )
}
