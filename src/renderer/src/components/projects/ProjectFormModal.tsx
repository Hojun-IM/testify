import { useState } from 'react'
import type { ProjectEnvironmentInput } from '../../../../shared/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { FolderIcon, PlusIcon, CloseIcon } from '../ui/icons'
import styles from './NewProjectModal.module.css'

export function NewProjectModal({
  open,
  onClose,
  onCreate
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; environments: ProjectEnvironmentInput[] }) => Promise<void>
}): JSX.Element {
  const [name, setName] = useState('')
  const [environments, setEnvironments] = useState<ProjectEnvironmentInput[]>([])
  const [submitting, setSubmitting] = useState(false)

  function reset(): void {
    setName('')
    setEnvironments([])
  }

  function handleClose(): void {
    reset()
    onClose()
  }

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
    await onCreate({ name: trimmedName, environments: validEnvironments })
    setSubmitting(false)
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      icon={<FolderIcon />}
      title="새 프로젝트"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? '생성 중...' : '프로젝트 생성'}
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
