import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import { contentAreaLeft } from '../layout/layoutMetrics'
import styles from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export function Modal({
  open,
  onClose,
  size = 'md',
  icon,
  title,
  children,
  footer,
  sidebarCollapsed
}: {
  open: boolean
  onClose: () => void
  size?: ModalSize
  icon?: ReactNode
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  // 사이드바가 있으면 그 옆 콘텐츠 영역 중앙에, 없으면 전체 폭 중앙에 뜨도록 전달
  sidebarCollapsed?: boolean
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
    <div
      className={styles.backdrop}
      style={{ left: contentAreaLeft(sidebarCollapsed) }}
      onClick={onClose}
    >
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
