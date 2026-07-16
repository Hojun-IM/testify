import { useEffect, useState } from 'react'
import type { TestType } from '../../../../shared/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { CodeIcon } from '../ui/icons'
import styles from './TestFormModal.module.css'

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'api', label: 'API' },
  { value: 'e2e', label: 'E2E' }
]

export type TestFormValues = {
  name: string
  type: TestType
}

export function TestFormModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
  sidebarCollapsed
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: TestFormValues) => Promise<void>
  mode?: 'create' | 'edit'
  initialValues?: TestFormValues
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [name, setName] = useState('')
  const [type, setType] = useState('api')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setType(initialValues?.type ?? 'api')
    }
    // 모달이 열릴 때만 초기값으로 리셋한다 (열려 있는 동안 initialValues 재생성으로 인한 입력값 덮어쓰기 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSubmit(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    await onSubmit({ name: trimmed, type: type as TestType })
    setSubmitting(false)
    onClose()
  }

  const isEdit = mode === 'edit'

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<CodeIcon />}
      title={isEdit ? '테스트 수정' : '새 테스트'}
      sidebarCollapsed={sidebarCollapsed}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? (isEdit ? '수정 중...' : '생성 중...') : isEdit ? '수정' : '테스트 생성'}
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
