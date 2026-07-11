import styles from './TextField.module.css'

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}): JSX.Element {
  return (
    <label className={styles.field}>
      <span className={`${styles.label} text-ivory-dim`}>{label}</span>
      <input
        type="text"
        className={`${styles.input} bg-raised border-line text-ivory`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </label>
  )
}
