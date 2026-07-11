import type { ReactNode } from 'react'
import styles from './Button.module.css'

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  disabled?: boolean
}): JSX.Element {
  const variantClass = variant === 'primary' ? styles.primary : 'btn-ghost bg-raised hover:bg-overlay text-ivory'

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${styles.btn} ${variantClass}`}>
      {children}
    </button>
  )
}
