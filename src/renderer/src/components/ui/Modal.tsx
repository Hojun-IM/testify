import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export function Modal({
  open,
  onClose,
  size = 'md',
  icon,
  title,
  children,
  footer
}: {
  open: boolean
  onClose: () => void
  size?: ModalSize
  icon?: ReactNode
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
}): JSX.Element | null {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles[size]} bg-raised border-line`}
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
