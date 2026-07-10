import { useState } from 'react'
import styles from './EnvironmentBadgeList.module.css'

export type ProjectEnvironment = {
  name: string
  url: string
}

const TOOLTIP_OFFSET = 12

function EnvironmentBadge({ env }: { env: ProjectEnvironment }): JSX.Element {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <li
      className={styles.item}
      onMouseMove={(event) => setPos({ x: event.clientX, y: event.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      <span className={`${styles.badge} text-ivory-dim`}>{env.name}</span>
      {pos && (
        <span
          className={`${styles.tooltip} bg-raised border-line text-ivory`}
          style={{ left: pos.x + TOOLTIP_OFFSET, top: pos.y + TOOLTIP_OFFSET }}
        >
          {env.url}
        </span>
      )}
    </li>
  )
}

export function EnvironmentBadgeList({ environments }: { environments: ProjectEnvironment[] }): JSX.Element {
  return (
    <ul className={styles.list}>
      {environments.map((env) => (
        <EnvironmentBadge key={env.name} env={env} />
      ))}
    </ul>
  )
}
