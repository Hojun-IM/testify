import { Fragment, useState } from 'react'
import { CloseIcon } from '../ui/icons'
import type { StepResult } from './elementPicker'
import styles from './ScenarioPanel.module.css'

export type ScenarioStep = {
  id: number
  actionType: string
  actionLabel: string
  selector: string
  value?: string
  targetLabel: string
  // 스텝을 기록할 당시 열려 있던 페이지 URL. 시나리오 저장 시 첫 스텝의 값을
  // 재생 시작 URL로 사용한다 (저장된 케이스를 불러올 때는 비어 있을 수 있음)
  pageUrl?: string
  // 저장된 테스트 케이스를 불러와 재생할 때, 어느 케이스의 스텝인지 (수동 기록에는 없음)
  caseId?: string
  caseName?: string
  // 등록 시 게스트 페이지에서 실제 실행한 결과 (이동 등으로 유실되면 undefined)
  result?: StepResult
}

export type ScenarioStepInput = Omit<ScenarioStep, 'id' | 'result'>

function resultLabel(result: StepResult): string {
  if (result.ok) return '실행됨'
  if (result.error === 'not-found') return '요소를 찾을 수 없음'
  if (result.error === 'not-visible') return '요소가 보이지 않음'
  if (result.error?.startsWith('text-mismatch:')) {
    return `텍스트 불일치 — 실제: "${result.error.slice('text-mismatch:'.length)}"`
  }
  return `실행 실패${result.error ? ` — ${result.error}` : ''}`
}

// 브라우저 조작을 막지 않도록 backdrop 없이 우측에 도킹되는 패널.
// SlidePanel은 투명 backdrop이 바깥 클릭을 가로채서 기록 흐름이 끊기므로 쓰지 않는다.
// inline이 true면 도킹 대신 부모 레이아웃 안에 일반 컬럼으로 배치된다 (케이스 기록 모달용)
export function ScenarioPanel({
  open,
  steps,
  playing,
  inline,
  onClose,
  onDeleteStep,
  onClearAll,
  onSaveAsCase
}: {
  open: boolean
  steps: ScenarioStep[]
  playing?: boolean
  inline?: boolean
  onClose?: () => void
  onDeleteStep: (id: number) => void
  onClearAll: () => void
  onSaveAsCase?: () => void
}): JSX.Element {
  const [copied, setCopied] = useState(false)

  async function copyAsJson(): Promise<void> {
    const payload = steps.map(({ id: _id, ...rest }) => rest)
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 접근이 막힌 환경에서는 조용히 무시
    }
  }

  return (
    <aside
      className={`${styles.panel} ${inline ? styles.inline : open ? styles.open : ''} bg-surface border-line`}
    >
      <div className={styles.header}>
        <h2 className={`${styles.title} text-ivory`}>
          시나리오
          {steps.length > 0 && <span className="text-ivory-faint"> · {steps.length} 스텝</span>}
          {playing && <span className={styles.playingDot} />}
        </h2>
        {onClose && (
          <button type="button" className="icon-btn text-ivory-faint" aria-label="시나리오 패널 닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={styles.body}>
        {steps.length === 0 ? (
          <p className={`${styles.empty} text-ivory-faint`}>
            브라우저 툴바의 요소 선택 모드를 켜고, 페이지의 요소를 클릭하거나 우클릭해 동작을 추가하세요.
          </p>
        ) : (
          <ol className={styles.list}>
            {steps.map((step, index) => (
              <Fragment key={step.id}>
                {/* 여러 케이스를 한 번에 실행할 때 케이스 경계마다 구분 헤더를 넣는다 */}
                {step.caseName && (index === 0 || steps[index - 1].caseId !== step.caseId) && (
                  <li className={`${styles.caseHeader} text-ivory-dim`}>{step.caseName}</li>
                )}
                <li className={`${styles.step} bg-raised border-line`}>
                  <span className={`${styles.stepIndex} text-ivory-faint`}>{index + 1}</span>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepAction}>
                      <span className="text-clay-300">{step.actionLabel}</span>
                      <span className="text-ivory-dim"> — {step.targetLabel}</span>
                    </span>
                    {step.value !== undefined && step.actionType !== 'goto' && (
                      <span className={`${styles.stepValue} text-ivory`}>&quot;{step.value}&quot;</span>
                    )}
                    {step.selector && (
                      <span className={`${styles.stepSelector} text-ivory-faint`} title={step.selector}>
                        {step.selector}
                      </span>
                    )}
                    {step.result && (
                      <span className={`${styles.stepResult} ${step.result.ok ? 'text-ok' : 'text-danger'}`}>
                        {step.result.ok ? '✓' : '✕'} {resultLabel(step.result)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="icon-btn text-ivory-faint"
                    aria-label="스텝 삭제"
                    onClick={() => onDeleteStep(step.id)}
                  >
                    <CloseIcon />
                  </button>
                </li>
              </Fragment>
            ))}
          </ol>
        )}
      </div>

      {steps.length > 0 && (
        <div className={`${styles.footer} border-line`}>
          <button
            type="button"
            className={`${styles.footerBtn} text-danger hover:bg-overlay`}
            onClick={onClearAll}
            disabled={playing}
          >
            전체 삭제
          </button>
          <div className={styles.footerRight}>
            <button
              type="button"
              className={`${styles.footerBtn} bg-raised hover:bg-overlay text-ivory`}
              onClick={copyAsJson}
            >
              {copied ? '복사됨 ✓' : 'JSON 복사'}
            </button>
            {onSaveAsCase && (
              <button
                type="button"
                className={`${styles.footerBtn} bg-clay-500 hover:bg-clay-400`}
                onClick={onSaveAsCase}
                disabled={playing}
              >
                테스트 케이스로 저장
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
