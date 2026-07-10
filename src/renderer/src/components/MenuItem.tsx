import type { CSSProperties, ReactNode } from 'react'
import styles from './MenuItem.module.css'

export function MenuItem({
  icon,
  iconClassName,
  iconStyle,
  label,
  onClick,
  muted
}: {
  icon: ReactNode
  iconClassName?: string
  iconStyle?: CSSProperties
  label: string
  onClick?: () => void
  muted?: boolean
}): JSX.Element {
  return (
    <li>
      <button
        type="button"
        className={`${styles.item} ${muted ? 'text-ivory-dim' : 'text-ivory'} hover:bg-overlay`}
        onClick={onClick}
      >
        <span className={`text-ivory-faint ${iconClassName ?? ''}`} style={iconStyle}>
          {icon}
        </span>
        {label}
      </button>
    </li>
  )
}
