import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from './icons'
import styles from './MultiSelectDropdown.module.css'

export type MultiSelectOption = {
  value: string
  label: string
}

export function MultiSelectDropdown({
  label,
  options,
  values,
  onChange,
  placeholder = '선택 안 함',
  allLabel = '전체'
}: {
  label?: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  allLabel?: string
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

  function toggleValue(value: string): void {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const summary =
    values.length === 0
      ? placeholder
      : values.length === options.length
        ? allLabel
        : options
            .filter((option) => values.includes(option.value))
            .map((option) => option.label)
            .join(', ')

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} bg-raised hover:bg-overlay text-ivory`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label && <span className="text-ivory-faint">{label}</span>}
        <span className={styles.summary}>{summary}</span>
        <span className="text-ivory-faint chevron" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
          <ChevronDownIcon size={12} />
        </span>
      </button>
      {open && (
        <ul className={`${styles.menu} bg-raised border-line`}>
          {options.map((option) => (
            <li key={option.value}>
              <label className={`${styles.item} hover:bg-overlay text-ivory-dim`}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={values.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                />
                <span>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
