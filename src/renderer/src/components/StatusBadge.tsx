import type { ProjectStatus } from '../../../shared/types'
import styles from './StatusBadge.module.css'

export function StatusBadge({
  status,
  className
}: {
  status: ProjectStatus
  className?: string
}): JSX.Element {
  const isActive = status === 'active'

  return (
    <span
      className={`${styles.badge} ${isActive ? `${styles.active} text-ivory-dim` : `${styles.archived} text-ivory-faint`} ${className ?? ''}`}
    >
      {isActive ? 'active' : 'archived'}
    </span>
  )
}
