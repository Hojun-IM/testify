import type { ReactNode } from 'react'
import styles from './ContentDetailHeader.module.css'

export function ContentDetailHeader({
  left,
  right,
  children
}: {
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
}): JSX.Element {
  return (
    <div className={styles.header}>
      {(left || right) && (
        <div className={styles.controlsRow}>
          <div className={styles.left}>{left}</div>
          <div className={styles.right}>{right}</div>
        </div>
      )}
      {children}
    </div>
  )
}
