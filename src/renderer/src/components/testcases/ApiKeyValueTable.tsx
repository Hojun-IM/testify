import type { ApiKeyValue } from '../../../../shared/types'
import { CloseIcon, PlusIcon } from '../ui/icons'
import styles from './ApiKeyValueTable.module.css'

// Params/Headers/Form-body 탭에서 공용으로 쓰는 key-value-description 편집 테이블
export function ApiKeyValueTable({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value'
}: {
  rows: ApiKeyValue[]
  onChange: (rows: ApiKeyValue[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}): JSX.Element {
  function updateRow(index: number, patch: Partial<ApiKeyValue>): void {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number): void {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addRow(): void {
    onChange([...rows, { key: '', value: '', description: '', enabled: true }])
  }

  return (
    <div className={styles.table}>
      {rows.length > 0 && (
        <div className={styles.headerRow}>
          <span className={styles.checkCol} />
          <span className="text-ivory-faint">{keyPlaceholder}</span>
          <span className="text-ivory-faint">{valuePlaceholder}</span>
          <span className="text-ivory-faint">Description</span>
          <span className={styles.deleteCol} />
        </div>
      )}
      {rows.map((row, index) => (
        <div key={index} className={styles.row}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={row.enabled}
            onChange={(event) => updateRow(index, { enabled: event.target.checked })}
            aria-label={row.key ? `${row.key} 사용 여부` : '행 사용 여부'}
          />
          <input
            type="text"
            className={`${styles.input} bg-raised border-line text-ivory`}
            value={row.key}
            onChange={(event) => updateRow(index, { key: event.target.value })}
            placeholder={keyPlaceholder}
          />
          <input
            type="text"
            className={`${styles.input} bg-raised border-line text-ivory`}
            value={row.value}
            onChange={(event) => updateRow(index, { value: event.target.value })}
            placeholder={valuePlaceholder}
          />
          <input
            type="text"
            className={`${styles.input} bg-raised border-line text-ivory`}
            value={row.description}
            onChange={(event) => updateRow(index, { description: event.target.value })}
            placeholder="Description"
          />
          <button
            type="button"
            className="icon-btn text-ivory-faint"
            aria-label="행 삭제"
            onClick={() => removeRow(index)}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
      <button type="button" className={`${styles.addBtn} border-line text-ivory-dim`} onClick={addRow}>
        <PlusIcon size={12} /> 항목 추가
      </button>
    </div>
  )
}
