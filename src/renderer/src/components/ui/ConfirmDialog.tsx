import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '삭제',
  danger = true,
  sidebarCollapsed
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm(): Promise<void> {
    setSubmitting(true)
    await onConfirm()
    setSubmitting(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      sidebarCollapsed={sidebarCollapsed}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} disabled={submitting}>
            {submitting ? '처리 중...' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-ivory-dim">{description}</p>
    </Modal>
  )
}
