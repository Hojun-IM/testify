import { useEffect, useRef, useState } from 'react'
import type { ProjectStatus } from '../../../shared/types'
import { MoreIcon } from './icons'
import styles from './ProjectActionsMenu.module.css'

export function ProjectActionsMenu({ status }: { status: ProjectStatus }): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const isActive = status === 'active'

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        type="button"
        className="icon-btn text-ivory-faint"
        aria-label="프로젝트 설정"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreIcon />
      </button>
      {open && (
        <ul className={`${styles.menu} bg-raised border-line`}>
          <li>
            <button
              type="button"
              className={`${styles.item} hover:bg-overlay text-ivory-dim`}
              onClick={() => setOpen(false)}
            >
              {isActive ? '비활성화' : '활성화'}
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.item} hover:bg-overlay text-ivory-dim`}
              onClick={() => setOpen(false)}
            >
              수정
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.item} hover:bg-overlay text-danger`}
              onClick={() => setOpen(false)}
            >
              삭제
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
