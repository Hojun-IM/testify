import { useEffect, useState } from 'react'
import type { ProjectSummary } from '../../../../shared/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { CodeIcon } from '../ui/icons'
import styles from './TestFormModal.module.css'

// 사이드바에서 "새 테스트"를 눌렀는데 현재 열려 있는 프로젝트가 없을 때,
// 테스트를 만들 프로젝트를 먼저 고르게 하는 중간 단계
export function ProjectPickerModal({
  open,
  projects,
  onClose,
  onSelect,
  sidebarCollapsed
}: {
  open: boolean
  projects: ProjectSummary[]
  onClose: () => void
  onSelect: (project: ProjectSummary) => void
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    if (open) setProjectId(projects[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const options: DropdownOption[] = projects.map((project) => ({ value: project.id, label: project.name }))

  function handleConfirm(): void {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return
    onSelect(project)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<CodeIcon />}
      title="테스트를 만들 프로젝트 선택"
      sidebarCollapsed={sidebarCollapsed}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!projectId}>
            다음
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {projects.length === 0 ? (
          <p className="text-ivory-faint">먼저 프로젝트를 하나 만들어야 합니다.</p>
        ) : (
          <div className={styles.field}>
            <span className={`${styles.label} text-ivory-dim`}>프로젝트</span>
            <Dropdown options={options} value={projectId} onChange={setProjectId} minWidth={160} />
          </div>
        )}
      </div>
    </Modal>
  )
}
