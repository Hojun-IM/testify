import type { ReactNode } from 'react'
import styles from './Button.module.css'

export function Button({
  children,
  onClick,
  variant = 'primary'
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}): JSX.Element {
  const variantClass = variant === 'primary' ? styles.primary : 'btn-ghost bg-raised hover:bg-overlay text-ivory'

  return (
    <button type="button" onClick={onClick} className={`${styles.btn} ${variantClass}`}>
      {children}
    </button>
  )
}
