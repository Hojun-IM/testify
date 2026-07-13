import { useEffect, useState } from 'react'
import type { TestCasePolicy, TestCaseStatus, TestCaseStep } from '../../../../shared/types'
import { SlidePanel } from '../ui/SlidePanel'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { type DropdownOption } from '../ui/Dropdown'
import { Switch } from '../ui/Switch'
import { CodeIcon, PlusIcon, CloseIcon } from '../ui/icons'
import styles from './TestCaseFormPanel.module.css'

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'deprecated', label: 'Deprecated' }
]

export const TEST_CASE_PANEL_WIDTH = 660

const DEFAULT_POLICY: TestCasePolicy = {
  targetEnvs: [],
  trigger: 'manual',
  retryCount: 0,
  timeoutSec: 30,
  notifyOnFailure: false
}

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
  initialValues,
  environmentOptions
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: TestCaseFormValues) => Promise<void>
  mode?: 'create' | 'edit'
  initialValues?: TestCaseFormValues
  environmentOptions: string[]
}): JSX.Element {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<TestCaseStatus>('draft')
  const [precondition, setPrecondition] = useState('')
  const [steps, setSteps] = useState<TestCaseStep[]>([])
  const [tagsText, setTagsText] = useState('')
  const [policy, setPolicy] = useState<TestCasePolicy>(DEFAULT_POLICY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setStatus(initialValues?.status ?? 'draft')
      setPrecondition(initialValues?.precondition ?? '')
      setSteps(initialValues?.steps ?? [])
      setTagsText((initialValues?.tags ?? []).join(', '))
      setPolicy(initialValues?.policy ?? DEFAULT_POLICY)
    }
    // 패널이 열릴 때만 초기값으로 리셋한다 (열려 있는 동안 initialValues 재생성으로 인한 입력값 덮어쓰기 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function addStep(): void {
    setSteps((prev) => [...prev, { action: '', expected: '', outcome: '' }])
  }

  function updateStep(index: number, field: keyof TestCaseStep, value: string): void {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)))
  }

  function removeStep(index: number): void {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePolicy(patch: Partial<TestCasePolicy>): void {
    setPolicy((prev) => ({ ...prev, ...patch }))
  }

  function toggleTargetEnv(env: string): void {
    setPolicy((prev) => ({
      ...prev,
      targetEnvs: prev.targetEnvs.includes(env)
        ? prev.targetEnvs.filter((item) => item !== env)
        : [...prev.targetEnvs, env]
    }))
  }

  async function handleSubmit(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return

    const cleanSteps = steps
      .map((step) => ({ action: step.action.trim(), expected: step.expected.trim(), outcome: step.outcome.trim() }))
      .filter((step) => step.action || step.expected || step.outcome)
    const cleanTags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setSubmitting(true)
    await onSubmit({
      name: trimmed,
      status,
      precondition: precondition.trim(),
      steps: cleanSteps,
      tags: cleanTags,
      policy
    })
    setSubmitting(false)
    onClose()
  }

  const isEdit = mode === 'edit'

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      icon={<CodeIcon />}
      title={isEdit ? '테스트 케이스 수정' : '새 테스트 케이스'}
      width={TEST_CASE_PANEL_WIDTH}
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

      <div className={`${styles.sectionTitle} text-clay-300`}>정책관리</div>
      <div className={`${styles.stepHeaderRow} text-ivory-faint`}>
        <span className={styles.stepHeaderCell}>Action</span>
        <span className={styles.stepHeaderCell}>Expected</span>
        <span className={styles.stepHeaderCell}>Outcome</span>
        <span className={styles.stepHeaderSpacer} />
      </div>
      {steps.map((step, index) => (
        <div key={index} className={styles.stepRow}>
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
      <button type="button" className={`${styles.addStepBtn} border-line text-ivory-dim`} onClick={addStep}>
        <PlusIcon size={13} /> 항목 추가
      </button>

      <label className={styles.field} style={{ marginTop: 16 }}>
        <span className={`${styles.label} text-ivory-dim`}>태그</span>
        <input
          type="text"
          className={`${styles.tagInput} bg-raised border-line text-ivory`}
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="쉼표(,)로 구분 (예: auth, critical-path)"
        />
      </label>

      <div className={`${styles.sectionTitle} text-clay-300`}>상세 설정</div>
      <div className={styles.field}>
        <span className={`${styles.label} text-ivory-dim`}>실행 대상 환경</span>
        <div className={styles.envCheckGroup}>
          {environmentOptions.length === 0 ? (
            <span className="text-ivory-faint" style={{ fontSize: 11.5 }}>
              등록된 환경이 없습니다. 미선택 시 전체 환경에서 실행됩니다.
            </span>
          ) : (
            environmentOptions.map((env) => {
              const checked = policy.targetEnvs.includes(env)
              return (
                <label
                  key={env}
                  className={`${styles.envCheckBtn} ${checked ? styles.envCheckActive : ''} border-line`}
                >
                  <input
                    type="checkbox"
                    className={styles.envCheckbox}
                    checked={checked}
                    onChange={() => toggleTargetEnv(env)}
                  />
                  {env}
                </label>
              )
            })
          )}
        </div>
      </div>

      <div className={styles.policyGrid}>
        <div className={styles.field}>
          <span className={`${styles.label} text-ivory-dim`}>재시도 횟수</span>
          <input
            type="number"
            min={0}
            className={`${styles.numberInput} bg-raised border-line text-ivory`}
            value={policy.retryCount}
            onChange={(event) => updatePolicy({ retryCount: Number(event.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <span className={`${styles.label} text-ivory-dim`}>타임아웃(초)</span>
          <input
            type="number"
            min={0}
            className={`${styles.numberInput} bg-raised border-line text-ivory`}
            value={policy.timeoutSec}
            onChange={(event) => updatePolicy({ timeoutSec: Number(event.target.value) })}
          />
        </div>
      </div>
      <div className={styles.toggleRow}>
        <div>
          <div className="text-ivory">실패 시 알림</div>
          <div className={`${styles.toggleHint} text-ivory-faint`}>실행 실패 시 담당자에게 알림 발송</div>
        </div>
        <Switch checked={policy.notifyOnFailure} onChange={(value) => updatePolicy({ notifyOnFailure: value })} />
      </div>
    </SlidePanel>
  )
}
