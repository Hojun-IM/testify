import { useEffect, useState } from 'react'
import type { TestCasePolicy, TestCaseStatus, TestCaseStep, TestType } from '../../../../shared/types'
import { DEFAULT_TEST_CASE_POLICY } from '../../../../shared/constants'
import { SlidePanel } from '../ui/SlidePanel'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { type DropdownOption } from '../ui/Dropdown'
import { CodeIcon } from '../ui/icons'
import { FORM_PANEL_WIDTH } from '../layout/layoutMetrics'
import { CaseRecorderModal } from './CaseRecorderModal'
import { ApiRecorderModal } from './ApiRecorderModal'
import { ScenarioStepsEditor, cleanScenarioSteps } from './ScenarioStepsEditor'
import styles from './TestCaseFormPanel.module.css'

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'deprecated', label: 'Deprecated' }
]

export type TestCaseFormValues = {
  name: string
  status: TestCaseStatus
  precondition: string
  steps: TestCaseStep[]
  tags: string[]
  policy: TestCasePolicy
}

export function TestCaseFormPanel({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  testType,
  sidebarCollapsed,
  initialValues
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: TestCaseFormValues) => Promise<void>
  mode?: 'create' | 'edit'
  // 소속 테스트의 종류 — e2e일 때만 브라우저 기록 기능을 노출한다
  testType?: TestType
  // 브라우저 기록 오버레이가 사이드바를 제외한 영역에 맞춰 뜨도록 전달
  sidebarCollapsed?: boolean
  initialValues?: TestCaseFormValues
}): JSX.Element {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<TestCaseStatus>('draft')
  const [precondition, setPrecondition] = useState('')
  const [steps, setSteps] = useState<TestCaseStep[]>([])
  const [tagsText, setTagsText] = useState('')
  const [policy, setPolicy] = useState<TestCasePolicy>(DEFAULT_TEST_CASE_POLICY)
  const [submitting, setSubmitting] = useState(false)
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [apiRecorderOpen, setApiRecorderOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setStatus(initialValues?.status ?? 'draft')
      setPrecondition(initialValues?.precondition ?? '')
      setSteps(initialValues?.steps ?? [])
      setTagsText((initialValues?.tags ?? []).join(', '))
      setPolicy(initialValues?.policy ?? DEFAULT_TEST_CASE_POLICY)
    }
    // 패널이 닫히면 기록 오버레이도 함께 닫는다
    if (!open) {
      setRecorderOpen(false)
      setApiRecorderOpen(false)
    }
    // 패널이 열릴 때만 초기값으로 리셋한다 (열려 있는 동안 initialValues 재생성으로 인한 입력값 덮어쓰기 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 브라우저 기록 오버레이에서 스텝이 기록될 때마다 폼의 시나리오 끝에 하나씩 추가한다.
  // 폼이 스텝 목록의 단일 소스이므로, 사용자가 중간에 지운 스텝이 되살아나지 않는다.
  // 재생 시작 URL은 비어 있을 때 첫 기록 페이지로 채운다
  function appendRecordedStep(step: TestCaseStep, pageUrl?: string): void {
    setSteps((prev) => [...prev, step])
    if (pageUrl) {
      setPolicy((prev) => ({ ...prev, automationStartUrl: prev.automationStartUrl || pageUrl }))
    }
  }

  // API 요청 빌더에서 "시나리오에 추가"를 누를 때마다 스텝 하나를 끝에 붙인다.
  // 브라우저 기록과 같은 단일 소스 append 패턴 — 폼에서 지운 스텝이 되살아나지 않는다
  function appendApiStep(step: TestCaseStep): void {
    setSteps((prev) => [...prev, step])
  }

  async function handleSubmit(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return

    const cleanTags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setSubmitting(true)
    await onSubmit({
      name: trimmed,
      status,
      precondition: precondition.trim(),
      steps: cleanScenarioSteps(steps),
      tags: cleanTags,
      policy
    })
    setSubmitting(false)
    onClose()
  }

  const isEdit = mode === 'edit'

  // 기록 오버레이가 열려 있을 때 패널의 Escape/바깥 클릭은 기록만 닫는다.
  // 요소 액션 메뉴까지 열려 있으면 메뉴만 닫히도록 아무것도 하지 않는다
  function handlePanelClose(): void {
    if (document.querySelector('[data-element-action-menu]')) return
    if (recorderOpen) setRecorderOpen(false)
    else if (apiRecorderOpen) setApiRecorderOpen(false)
    else onClose()
  }

  return (
    <SlidePanel
      open={open}
      onClose={handlePanelClose}
      icon={<CodeIcon />}
      title={isEdit ? '테스트 케이스 수정' : '새 테스트 케이스'}
      width={FORM_PANEL_WIDTH}
      dim={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? (isEdit ? '수정 중...' : '생성 중...') : isEdit ? '수정' : '생성'}
          </Button>
        </>
      }
    >
      <div className={styles.nameField}>
        <TextField label="케이스명" value={name} onChange={setName} placeholder="테스트 케이스명을 입력하세요" autoFocus />
      </div>

      <label className={styles.field}>
        <span className={`${styles.label} text-ivory-dim`}>케이스 설명</span>
        <textarea
          className={`${styles.textarea} bg-raised border-line text-ivory`}
          value={precondition}
          onChange={(event) => setPrecondition(event.target.value)}
          placeholder="테스트 케이스에 대한 설명을 입력하세요"
        />
      </label>

      <div className={styles.field}>
        <span className={`${styles.label} text-ivory-dim`}>상태</span>
        <div className={styles.statusGroup}>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.statusBtn} ${status === option.value ? styles.statusActive : ''}`}
              onClick={() => setStatus(option.value as TestCaseStatus)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ScenarioStepsEditor
        steps={steps}
        onStepsChange={setSteps}
        testType={testType}
        onOpenRecorder={() => setRecorderOpen(true)}
        onOpenApiRecorder={() => setApiRecorderOpen(true)}
      />

      <label className={`${styles.field} ${styles.tagField}`}>
        <span className={`${styles.label} text-ivory-dim`}>태그</span>
        <input
          type="text"
          className={`${styles.tagInput} bg-raised border-line text-ivory`}
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="쉼표(,)로 구분 (예: auth, critical-path)"
        />
      </label>

      <CaseRecorderModal
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onAddStep={appendRecordedStep}
        sidebarCollapsed={sidebarCollapsed}
      />
      <ApiRecorderModal
        open={apiRecorderOpen}
        onClose={() => setApiRecorderOpen(false)}
        onAddStep={appendApiStep}
        sidebarCollapsed={sidebarCollapsed}
      />
    </SlidePanel>
  )
}
