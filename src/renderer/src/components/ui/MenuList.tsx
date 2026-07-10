import type { ReactNode } from 'react'
import styles from './MenuList.module.css'

export function MenuList({ children }: { children: ReactNode }): JSX.Element {
  return <ul className={styles.list}>{children}</ul>
}
