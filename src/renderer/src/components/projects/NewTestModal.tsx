import { useState } from 'react'
import type { TestType } from '../../../../shared/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { CodeIcon } from '../ui/icons'
import styles from './NewTestModal.module.css'

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'api', label: 'API' },
  { value: 'e2e', label: 'E2E' }
]

export function NewTestModal({
  open,
  onClose,
  onCreate
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; type: TestType }) => Promise<void>
}): JSX.Element {
  const [name, setName] = useState('')
  const [type, setType] = useState('api')
  const [submitting, setSubmitting] = useState(false)

  function reset(): void {
    setName('')
    setType('api')
  }

  function handleClose(): void {
    reset()
    onClose()
  }

  async function handleSubmit(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    await onCreate({ name: trimmed, type: type as TestType })
    setSubmitting(false)
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon={<CodeIcon />}
      title="새 테스트"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? '생성 중...' : '테스트 생성'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField label="테스트명" value={name} onChange={setName} placeholder="예: 로그인 시나리오" autoFocus />
        <div className={styles.field}>
          <span className={`${styles.label} text-ivory-dim`}>타입</span>
          <Dropdown options={TYPE_OPTIONS} value={type} onChange={setType} />
        </div>
      </div>
    </Modal>
  )
}
