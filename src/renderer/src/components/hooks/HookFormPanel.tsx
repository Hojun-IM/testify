import { useEffect, useState } from 'react'
import type { Hook, HookTiming, TestCaseStep, TestType } from '../../../../shared/types'
import { SlidePanel } from '../ui/SlidePanel'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Switch } from '../ui/Switch'
import { CodeIcon } from '../ui/icons'
import { FORM_PANEL_WIDTH } from '../layout/layoutMetrics'
import { CaseRecorderModal } from '../testcases/CaseRecorderModal'
import { ApiRecorderModal } from '../testcases/ApiRecorderModal'
import { ScenarioStepsEditor, cleanScenarioSteps } from '../testcases/ScenarioStepsEditor'
import { HOOK_TIMING_DESCRIPTIONS, HOOK_TIMING_LABELS, HOOK_TIMING_ORDER } from './hookTimings'
import styles from './HookFormPanel.module.css'

export type HookFormValues = {
  name: string
  description: string
  type: TestType
  timing: HookTiming
  enabled: boolean
  steps: TestCaseStep[]
  start_url: string | null
}

export function HookFormPanel({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  sidebarCollapsed,
  initialValues
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: HookFormValues) => Promise<void>
  mode?: 'create' | 'edit'
  // 기록 오버레이가 사이드바를 제외한 영역에 맞춰 뜨도록 전달
  sidebarCollapsed?: boolean
  initialValues?: Hook | null
}): JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TestType>('e2e')
  const [timing, setTiming] = useState<HookTiming>('beforeEach')
  const [enabled, setEnabled] = useState(true)
  const [steps, setSteps] = useState<TestCaseStep[]>([])
  const [startUrl, setStartUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [apiRecorderOpen, setApiRecorderOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setDescription(initialValues?.description ?? '')
      setType(initialValues?.type ?? 'e2e')
      setTiming(initialValues?.timing ?? 'beforeEach')
      setEnabled(initialValues?.enabled ?? true)
      setSteps(initialValues?.steps ?? [])
      setStartUrl(initialValues?.start_url ?? null)
    }
    // 패널이 닫히면 기록 오버레이도 함께 닫는다
    if (!open) {
      setRecorderOpen(false)
      setApiRecorderOpen(false)
    }
    // 패널이 열릴 때만 초기값으로 리셋한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 브라우저 기록: 스텝 하나씩 append (폼이 단일 소스라 지운 스텝이 되살아나지 않는다)
  function appendRecordedStep(step: TestCaseStep, pageUrl?: string): void {
    setSteps((prev) => [...prev, step])
    if (pageUrl) setStartUrl((prev) => prev || pageUrl)
  }

  function appendApiStep(step: TestCaseStep): void {
    setSteps((prev) => [...prev, step])
  }

  async function handleSubmit(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    await onSubmit({
      name: trimmed,
      description: description.trim(),
      type,
      timing,
      enabled,
      steps: cleanScenarioSteps(steps),
      start_url: type === 'e2e' ? startUrl : null
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
      title={isEdit ? '훅 수정' : '새 훅'}
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
        <TextField
          label="훅 이름"
          value={name}
          onChange={setName}
          placeholder="예: 로그인, 테스트 데이터 초기화"
          autoFocus
        />
      </div>

      <label className={styles.field}>
        <span className={`${styles.label} text-ivory-dim`}>설명</span>
        <textarea
          className={`${styles.textarea} bg-raised border-line text-ivory`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="이 훅이 어떤 공통 작업을 수행하는지 설명하세요"
        />
      </label>

      <div className={styles.field}>
        <span className={`${styles.label} text-ivory-dim`}>타입</span>
        <div className={styles.optionGroup}>
          {(['e2e', 'api'] as TestType[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.optionBtn} ${type === option ? styles.optionActive : ''}`}
              onClick={() => setType(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={`${styles.label} text-ivory-dim`}>실행 시점</span>
        <div className={styles.optionGroup}>
          {HOOK_TIMING_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.optionBtn} ${timing === option ? styles.optionActive : ''}`}
              title={HOOK_TIMING_DESCRIPTIONS[option]}
              onClick={() => setTiming(option)}
            >
              {HOOK_TIMING_LABELS[option]}
            </button>
          ))}
        </div>
        <span className={`${styles.timingHint} text-ivory-faint`}>{HOOK_TIMING_DESCRIPTIONS[timing]}</span>
      </div>

      <div className={styles.field}>
        <div className={styles.switchRow}>
          <span className={`${styles.label} text-ivory-dim`}>활성화</span>
          <Switch checked={enabled} onChange={setEnabled} ariaLabel="훅 활성화" />
        </div>
        <span className={`${styles.timingHint} text-ivory-faint`}>
          비활성화하면 훅을 삭제하지 않고도 실행 대상에서 제외할 수 있습니다.
        </span>
      </div>

      <ScenarioStepsEditor
        steps={steps}
        onStepsChange={setSteps}
        testType={type}
        onOpenRecorder={() => setRecorderOpen(true)}
        onOpenApiRecorder={() => setApiRecorderOpen(true)}
      />

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
