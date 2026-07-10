import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from './icons'
import styles from './Dropdown.module.css'

export type DropdownOption = {
  value: string
  label: string
}

export function Dropdown({
  label,
  options,
  value,
  onChange
}: {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

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
        className={`${styles.trigger} bg-raised hover:bg-overlay text-ivory`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-ivory-faint">{label}</span>
        <span>{selected?.label ?? value}</span>
        <span className="text-ivory-faint chevron" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
          <ChevronDownIcon size={12} />
        </span>
      </button>
      {open && (
        <ul className={`${styles.menu} bg-raised border-line`}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`${styles.item} hover:bg-overlay ${
                  option.value === value ? 'text-ivory' : 'text-ivory-dim'
                }`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
