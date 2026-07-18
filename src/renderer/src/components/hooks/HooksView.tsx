import { ProjectHooksSection } from './ProjectHooksSection'
import styles from './HooksView.module.css'

// 사이드바 "훅" 탭 — 전역 훅(모든 프로젝트의 테스트에서 불러와 쓰는 공통 시나리오)을 관리한다
export function HooksView({
  sidebarCollapsed,
  autoOpenCreate,
  onAutoOpenConsumed
}: {
  sidebarCollapsed?: boolean
  autoOpenCreate?: boolean
  onAutoOpenConsumed?: () => void
}): JSX.Element {
  return (
    <div className={styles.view}>
      <div className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <span className="text-ivory">훅</span>
        <span className="text-ivory-faint">— 공통 시나리오를 만들어 두고 각 테스트에서 불러와 재사용합니다</span>
      </div>
      <div className={styles.body}>
        <div className={styles.content}>
          <ProjectHooksSection
            sidebarCollapsed={sidebarCollapsed}
            autoOpenCreate={autoOpenCreate}
            onAutoOpenConsumed={onAutoOpenConsumed}
          />
        </div>
      </div>
    </div>
  )
}
