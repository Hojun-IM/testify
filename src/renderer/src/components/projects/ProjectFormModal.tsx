import { useEffect, useState } from 'react'
import type { ProjectEnvironmentInput } from '../../../../shared/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { FolderIcon, PlusIcon, CloseIcon } from '../ui/icons'
import styles from './ProjectFormModal.module.css'

export type ProjectFormValues = {
  name: string
  environments: ProjectEnvironmentInput[]
}

export function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  initialValues,
  sidebarCollapsed
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: ProjectFormValues) => Promise<void>
  mode?: 'create' | 'edit'
  initialValues?: ProjectFormValues
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [name, setName] = useState('')
  const [environments, setEnvironments] = useState<ProjectEnvironmentInput[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setEnvironments(initialValues?.environments ?? [])
    }
    // 모달이 열릴 때만 초기값으로 리셋한다 (열려 있는 동안 initialValues 재생성으로 인한 입력값 덮어쓰기 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function addEnvironment(): void {
    setEnvironments((prev) => [...prev, { name: '', url: '' }])
  }

  function removeEnvironment(index: number): void {
    setEnvironments((prev) => prev.filter((_, i) => i !== index))
  }

  function updateEnvironment(index: number, field: 'name' | 'url', value: string): void {
    setEnvironments((prev) => prev.map((env, i) => (i === index ? { ...env, [field]: value } : env)))
  }

  async function handleSubmit(): Promise<void> {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const validEnvironments = environments
      .map((env) => ({ name: env.name.trim(), url: env.url.trim() }))
      .filter((env) => env.name && env.url)

    setSubmitting(true)
    await onSubmit({ name: trimmedName, environments: validEnvironments })
    setSubmitting(false)
    onClose()
  }

  const isEdit = mode === 'edit'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<FolderIcon />}
      title={isEdit ? '프로젝트 수정' : '새 프로젝트'}
      sidebarCollapsed={sidebarCollapsed}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? (isEdit ? '수정 중...' : '생성 중...') : isEdit ? '수정' : '프로젝트 생성'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField label="프로젝트명" value={name} onChange={setName} placeholder="예: Alpha Project" autoFocus />

        <div className={styles.envSection}>
          <div className={styles.envHeader}>
            <span className="text-ivory-dim">등록할 환경</span>
            <button type="button" className="icon-btn text-ivory-faint" aria-label="환경 추가" onClick={addEnvironment}>
              <PlusIcon size={14} />
            </button>
          </div>
          {environments.map((env, index) => (
            <div key={index} className={styles.envRow}>
              <input
                type="text"
                className={`${styles.envInput} bg-raised border-line text-ivory`}
                placeholder="환경명 (예: dev)"
                value={env.name}
                onChange={(event) => updateEnvironment(index, 'name', event.target.value)}
              />
              <input
                type="text"
                className={`${styles.envInput} bg-raised border-line text-ivory`}
                placeholder="도메인 (예: https://dev.example.com)"
                value={env.url}
                onChange={(event) => updateEnvironment(index, 'url', event.target.value)}
              />
              <button
                type="button"
                className="icon-btn text-ivory-faint"
                aria-label="환경 삭제"
                onClick={() => removeEnvironment(index)}
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
