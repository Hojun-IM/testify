import type { ReactNode } from 'react'
import styles from './Tabs.module.css'

export type TabItem = {
  value: string
  icon?: ReactNode
  label: string
}

export function Tabs({
  items,
  value,
  onChange
}: {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <nav className={`${styles.tabs} bg-raised`}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`${styles.tab} ${item.value === value ? `${styles.active} text-ivory` : 'text-ivory-faint'}`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  )
}
