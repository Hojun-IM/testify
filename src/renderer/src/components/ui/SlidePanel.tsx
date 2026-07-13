import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import styles from './SlidePanel.module.css'

export function SlidePanel({
  open,
  onClose,
  icon,
  title,
  children,
  footer,
  width = 440,
  dim = true
}: {
  open: boolean
  onClose: () => void
  icon?: ReactNode
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
  dim?: boolean
}): JSX.Element {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <div
      className={`${styles.backdrop} ${open ? styles.open : ''} ${dim ? '' : styles.transparent}`}
      onClick={onClose}
    >
      <div
        className={`${styles.panel} ${open ? styles.open : ''} bg-surface border-line`}
        style={{ width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {icon && <span className={`${styles.icon} bg-overlay text-ivory-faint`}>{icon}</span>}
            <h2 className={`${styles.title} text-ivory`}>{title}</h2>
          </div>
          <button type="button" className="icon-btn text-ivory-faint" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
