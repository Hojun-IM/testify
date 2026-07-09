import type { ReactNode } from 'react'

export function Button({
  children,
  onClick,
  variant = 'primary'
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}): JSX.Element {
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-ghost bg-raised hover:bg-overlay text-ivory'

  return (
    <button type="button" onClick={onClick} className={`btn ${variantClass}`}>
      {children}
    </button>
  )
}
