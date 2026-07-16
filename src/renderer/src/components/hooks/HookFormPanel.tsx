import { useEffect, useState } from 'react'
import type { Hook, HookTiming, TestCaseStep, TestType } from '../../../../shared/types'
import { SlidePanel } from '../ui/SlidePanel'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Switch } from '../ui/Switch'
import { CodeIcon, PlusIcon, CloseIcon, SendIcon, TargetIcon } from '../ui/icons'
import { CaseRecorderModal } from '../testcases/CaseRecorderModal'
import { ApiRecorderModal } from '../testcases/ApiRecorderModal'
import styles from './HookFormPanel.module.css'

export const HOOK_PANEL_WIDTH = 660

export const HOOK_TIMING_LABELS: Record<HookTiming, string> = {
  beforeAll: 'Before All',
  beforeEach: 'Before Each',
  afterEach: 'After Each',
  afterAll: 'After All',
  onFailure: 'On Failure'
}

export const HOOK_TIMING_DESCRIPTIONS: Record<HookTiming, string> = {
  beforeAll: '전체 실행 시작 전 1회 실행',
  beforeEach: '각 케이스 실행 전마다 실행',
  afterEach: '각 케이스 실행 후마다 실행',
  afterAll: '전체 실행 종료 후 1회 실행',
  onFailure: '케이스가 실패했을 때만 실행 (정리/상태 복구용)'
}

const TIMING_ORDER: HookTiming[] = ['beforeAll', 'beforeEach', 'afterEach', 'afterAll', 'onFailure']

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

  function addStep(): void {
    setSteps((prev) => [...prev, { action: '', expected: '', outcome: '' }])
  }

  function updateStep(index: number, field: 'action' | 'expected' | 'outcome', value: string): void {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)))
  }

  function removeStep(index: number): void {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

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

    const cleanSteps = steps
      .map((step) => ({
        action: step.action.trim(),
        expected: step.expected.trim(),
        outcome: step.outcome.trim(),
        // 자동화 스텝은 텍스트를 수정해도 실행 바인딩이 유지되어야 한다
        ...(step.automation ? { automation: step.automation } : {})
      }))
      .filter((step) => step.action || step.expected || step.outcome)

    setSubmitting(true)
    await onSubmit({
      name: trimmed,
      description: description.trim(),
      type,
      timing,
      enabled,
      steps: cleanSteps,
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
      width={HOOK_PANEL_WIDTH}
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
          {TIMING_ORDER.map((option) => (
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

      <div className={`${styles.sectionTitle} text-clay-300`}>시나리오</div>
      <div className={`${styles.stepHeaderRow} text-ivory-faint`}>
        <span className={styles.stepHeaderCell}>Action</span>
        <span className={styles.stepHeaderCell}>Expected</span>
        <span className={styles.stepHeaderCell}>Outcome</span>
        <span className={styles.stepHeaderSpacer} />
      </div>
      {steps.map((step, index) => (
        <div key={index} className={styles.stepRow}>
          {step.automation && (
            <span
              className={styles.autoBadge}
              title={`자동화 스텝 — ${step.automation.actionType}${step.automation.selector ? ` (${step.automation.selector})` : ''}`}
            >
              ●
            </span>
          )}
          <input
            type="text"
            className={`${styles.stepInput} bg-raised border-line text-ivory`}
            value={step.action}
            onChange={(event) => updateStep(index, 'action', event.target.value)}
            placeholder="수행 동작"
          />
          <input
            type="text"
            className={`${styles.stepInput} bg-raised border-line text-ivory`}
            value={step.expected}
            onChange={(event) => updateStep(index, 'expected', event.target.value)}
            placeholder="기대 결과"
          />
          <input
            type="text"
            className={`${styles.stepInput} bg-raised border-line text-ivory`}
            value={step.outcome}
            onChange={(event) => updateStep(index, 'outcome', event.target.value)}
            placeholder="실제 결과"
          />
          <button
            type="button"
            className="icon-btn text-ivory-faint"
            aria-label="항목 삭제"
            onClick={() => removeStep(index)}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
      <div className={styles.stepActions}>
        <button type="button" className={`${styles.addStepBtn} border-line text-ivory-dim`} onClick={addStep}>
          <PlusIcon size={13} /> 항목 추가
        </button>
        {type === 'e2e' && (
          <button
            type="button"
            className={`${styles.addStepBtn} ${styles.recordBtn} border-line`}
            onClick={() => setRecorderOpen(true)}
          >
            <TargetIcon size={13} /> 브라우저로 기록
          </button>
        )}
        {type === 'api' && (
          <button
            type="button"
            className={`${styles.addStepBtn} ${styles.recordBtn} border-line`}
            onClick={() => setApiRecorderOpen(true)}
          >
            <SendIcon size={13} /> API 요청 작성
          </button>
        )}
      </div>

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
