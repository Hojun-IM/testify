import type { ReactNode } from 'react'
import styles from './Table.module.css'

export type TableColumn<T> = {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right'
  truncate?: boolean
  render: (row: T) => ReactNode
}

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = '표시할 항목이 없습니다.'
}: {
  columns: TableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
}): JSX.Element {
  const gridTemplateColumns = columns.map((column) => column.width ?? '1fr').join(' ')

  return (
    <div className={`${styles.table} border-line`}>
      <div className={styles.headerRow} style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <span key={column.key} className={`${styles.headerCell} text-ivory-faint`}>
            {column.header}
          </span>
        ))}
      </div>
      {data.length === 0 ? (
        <div className={`${styles.empty} text-ivory-faint`}>{emptyMessage}</div>
      ) : (
        data.map((row) => (
          <div
            key={rowKey(row)}
            className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
            style={{ gridTemplateColumns }}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((column) => (
              <span
                key={column.key}
                className={`${styles.cell} ${column.truncate === false ? styles.cellVisible : ''} ${
                  column.align === 'right' ? styles.alignRight : ''
                }`}
              >
                {column.render(row)}
              </span>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
