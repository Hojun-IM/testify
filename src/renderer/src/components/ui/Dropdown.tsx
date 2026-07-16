import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  onChange,
  minWidth
}: {
  label?: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  // 드롭다운 메뉴는 트리거 버튼의 실측 너비를 그대로 물려받는다(Dropdown.module.css .menu).
  // 선택된 값이 짧아 트리거가 좁아지면 긴 옵션 텍스트가 메뉴 안에서 줄바꿈되므로,
  // 옵션 중 가장 긴 텍스트가 한 줄로 들어갈 만큼 트리거의 최소 너비를 지정할 때 쓴다
  minWidth?: number
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const selected = options.find((option) => option.value === value)

  useLayoutEffect(() => {
    if (!open) return

    function updatePosition(): void {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }

    updatePosition()

    function handleClickOutside(event: MouseEvent): void {
      const target = event.target as Node
      // 메뉴가 document.body로 포탈되므로 rootRef의 DOM 서브트리 밖에 있어 별도로 확인해야 한다
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} bg-raised hover:bg-overlay text-ivory`}
        style={minWidth ? { minWidth } : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label && <span className="text-ivory-faint">{label}</span>}
        <span>{selected?.label ?? value}</span>
        <span className="text-ivory-faint chevron" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
          <ChevronDownIcon size={12} />
        </span>
      </button>
      {open &&
        menuRect &&
        createPortal(
          <ul
            ref={menuRef}
            className={`${styles.menu} ${styles.portalMenu} bg-raised border-line`}
            style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
          >
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
          </ul>,
          document.body
        )}
    </div>
  )
}
