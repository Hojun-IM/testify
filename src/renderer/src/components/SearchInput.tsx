import { SearchIcon } from './icons'
import styles from './SearchInput.module.css'

export function SearchInput({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}): JSX.Element {
  return (
    <div className={`${styles.search} bg-raised`}>
      <span className="text-ivory-faint">
        <SearchIcon />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        className="text-ivory"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
