import type { ReactNode } from 'react'
import styles from './ContentHeaderTitle.module.css'

export function ContentHeaderTitle({ children }: { children: ReactNode }): JSX.Element {
  return <h2 className={`${styles.title} text-ivory`}>{children}</h2>
}
