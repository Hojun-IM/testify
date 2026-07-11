import { ChevronLeftIcon, ChevronRightIcon } from './icons'
import styles from './Pagination.module.css'

type PageEntry = number | 'ellipsis'

function getPageEntries(page: number, totalPages: number): PageEntry[] {
  const entries: PageEntry[] = [1]
  const windowStart = Math.max(2, page - 1)
  const windowEnd = Math.min(totalPages - 1, page + 1)

  if (windowStart > 2) entries.push('ellipsis')
  for (let p = windowStart; p <= windowEnd; p++) entries.push(p)
  if (windowEnd < totalPages - 1) entries.push('ellipsis')
  if (totalPages > 1) entries.push(totalPages)

  return entries
}

export function Pagination({
  page,
  totalPages,
  onChange,
  totalItems
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  totalItems?: number
}): JSX.Element | null {
  if (totalPages <= 1 && totalItems === undefined) return null

  const entries = totalPages > 1 ? getPageEntries(page, totalPages) : []

  return (
    <div className={styles.pagination}>
      {totalItems !== undefined ? (
        <span className={`${styles.total} text-ivory-faint`}>총 {totalItems}개</span>
      ) : (
        <span />
      )}
      {totalPages > 1 && (
        <div className={styles.pages}>
          <button
            type="button"
            className="icon-btn"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          >
            <ChevronLeftIcon />
          </button>
          {entries.map((entry, index) =>
            entry === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className={`${styles.ellipsis} text-ivory-faint`}>
                ···
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                className={`${styles.pageBtn} ${entry === page ? `${styles.active} text-ivory` : 'text-ivory-dim'}`}
                onClick={() => onChange(entry)}
              >
                {entry}
              </button>
            )
          )}
          <button
            type="button"
            className="icon-btn"
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  )
}
