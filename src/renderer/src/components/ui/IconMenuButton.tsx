import { useEffect, useRef, useState } from 'react'
import { MoreIcon } from './icons'
import styles from './IconMenuButton.module.css'

export type IconMenuItem = {
  label: string
  onClick: () => void
  danger?: boolean
}

export function IconMenuButton({
  items,
  ariaLabel = '더보기'
}: {
  items: IconMenuItem[]
  ariaLabel?: string
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreIcon />
      </button>
      {open && (
        <ul className={`${styles.menu} bg-raised border-line`}>
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={`${styles.item} hover:bg-overlay ${item.danger ? 'text-danger' : 'text-ivory-dim'}`}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
