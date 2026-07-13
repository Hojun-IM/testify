import styles from './Switch.module.css'

export function Switch({
  checked,
  onChange,
  ariaLabel
}: {
  checked: boolean
  onChange: (value: boolean) => void
  ariaLabel?: string
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${styles.switch} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    />
  )
}
