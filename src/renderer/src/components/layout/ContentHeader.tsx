import type { ReactNode } from 'react'
import styles from './ContentHeader.module.css'

export function ContentHeader({
  left,
  right,
  sidebarCollapsed
}: {
  left?: ReactNode
  right?: ReactNode
  sidebarCollapsed?: boolean
}): JSX.Element {
  return (
    <div className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.left}>{left}</div>
      <div className={styles.right}>{right}</div>
    </div>
  )
}
