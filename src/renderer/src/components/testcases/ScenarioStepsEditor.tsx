import type { TestCaseStep, TestType } from '../../../../shared/types'
import { CloseIcon, PlusIcon, SendIcon, TargetIcon } from '../ui/icons'
import styles from './ScenarioStepsEditor.module.css'

// 편집 가능한 스텝 텍스트 필드 (automation 바인딩은 이 편집기에서 건드리지 않는다)
type StepTextField = 'action' | 'expected' | 'outcome'

// 제출 직전에 스텝 텍스트를 다듬고 완전히 빈 행을 걸러낸다.
// 자동화 스텝은 텍스트를 수정하더라도 실행 바인딩(selector 등)이 유지되어야 한다
export function cleanScenarioSteps(steps: TestCaseStep[]): TestCaseStep[] {
  return steps
    .map((step) => ({
      action: step.action.trim(),
      expected: step.expected.trim(),
      outcome: step.outcome.trim(),
      ...(step.automation ? { automation: step.automation } : {})
    }))
    .filter((step) => step.action || step.expected || step.outcome)
}

// 케이스/훅 폼이 공유하는 "시나리오" 섹션 — Action/Expected/Outcome 스텝 표와
// 항목 추가·브라우저 기록·API 요청 작성 버튼. 스텝 목록의 소유자는 부모 폼이며,
// 여기서는 변경된 전체 목록을 onStepsChange로 올려보내기만 한다
export function ScenarioStepsEditor({
  steps,
  onStepsChange,
  testType,
  onOpenRecorder,
  onOpenApiRecorder
}: {
  steps: TestCaseStep[]
  onStepsChange: (steps: TestCaseStep[]) => void
  // e2e면 브라우저 기록, api면 API 요청 작성 버튼을 노출한다 (없으면 직접 입력만 가능)
  testType?: TestType
  onOpenRecorder: () => void
  onOpenApiRecorder: () => void
}): JSX.Element {
  function addStep(): void {
    onStepsChange([...steps, { action: '', expected: '', outcome: '' }])
  }

  function updateStep(index: number, field: StepTextField, value: string): void {
    onStepsChange(steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)))
  }

  function removeStep(index: number): void {
    onStepsChange(steps.filter((_, i) => i !== index))
  }

  return (
    <>
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
        {testType === 'e2e' && (
          <button
            type="button"
            className={`${styles.addStepBtn} ${styles.recordBtn} border-line`}
            onClick={onOpenRecorder}
          >
            <TargetIcon size={13} /> 브라우저로 기록
          </button>
        )}
        {testType === 'api' && (
          <button
            type="button"
            className={`${styles.addStepBtn} ${styles.recordBtn} border-line`}
            onClick={onOpenApiRecorder}
          >
            <SendIcon size={13} /> API 요청 작성
          </button>
        )}
      </div>
    </>
  )
}
