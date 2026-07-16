import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TestCaseStep } from '../../../../shared/types'
import { Button } from '../ui/Button'
import { CloseIcon, TargetIcon } from '../ui/icons'
import { LiveBrowserPane } from '../dashboard/LiveBrowserPane'
import type { ScenarioStepInput } from '../dashboard/ScenarioPanel'
import { TEST_CASE_PANEL_WIDTH } from './TestCaseFormPanel'
import styles from './CaseRecorderModal.module.css'

// 브라우저를 띄워 클릭/우클릭으로 테스트 케이스 스텝을 기록하는 오버레이.
// 우측의 케이스 생성/수정 패널과 좌측 사이드바를 가리지 않도록 그 사이 콘텐츠 영역에만 뜬다.
// 스텝 목록의 단일 소스는 폼(패널)이며, 여기서는 "스텝 하나 추가" 이벤트만 올려보낸다 —
// 전체 목록을 덮어쓰면 사용자가 폼에서 지운 스텝이 다음 기록 때 되살아나기 때문
export function CaseRecorderModal({
  open,
  onClose,
  onAddStep,
  sidebarCollapsed
}: {
  open: boolean
  onClose: () => void
  // 기록된 스텝 하나(자동화 바인딩 포함)와 기록 당시 페이지 URL을 폼에 추가한다
  onAddStep: (step: TestCaseStep, pageUrl?: string) => void
  sidebarCollapsed?: boolean
}): JSX.Element | null {
  const [recordedCount, setRecordedCount] = useState(0)
  const stepIdRef = useRef(0)

  useEffect(() => {
    if (open) {
      setRecordedCount(0)
      stepIdRef.current = 0
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent): void {
      // 요소 액션 메뉴가 열려 있으면 Escape는 메뉴만 닫는다 (메뉴가 자체 처리)
      if (event.key === 'Escape' && !document.querySelector('[data-element-action-menu]')) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const onAddStepRef = useRef(onAddStep)
  onAddStepRef.current = onAddStep

  function handleRecordStep(step: ScenarioStepInput): number {
    stepIdRef.current += 1
    setRecordedCount((count) => count + 1)
    onAddStepRef.current(
      {
        action: step.actionLabel,
        expected: step.targetLabel,
        outcome: step.value ?? '',
        automation: { actionType: step.actionType, selector: step.selector, value: step.value }
      },
      step.pageUrl
    )
    return stepIdRef.current
  }

  if (!open) return null

  // SlidePanel(케이스 폼) 내부에서 렌더링되면 패널의 transform이 fixed 기준점을 바꾸고,
  // 패널 backdrop(z-100)에 가려지므로 body로 포털을 띄운다
  return createPortal(
    <div
      className={`${styles.overlay} bg-raised border-line`}
      style={{
        left: (sidebarCollapsed ? 0 : 285) + 12,
        right: TEST_CASE_PANEL_WIDTH + 12
      }}
    >
      <div className={`${styles.header} border-line`}>
        <span className={`${styles.title} text-ivory`}>
          <span className="text-clay-300">
            <TargetIcon size={14} />
          </span>
          브라우저로 케이스 기록
        </span>
        <span className={`${styles.hint} text-ivory-faint`}>
          요소를 클릭/우클릭해 동작을 고르세요. 주소 이동도 스텝으로 기록되며, 우측 패널의 시나리오에 바로
          반영됩니다.
        </span>
        <Button variant="ghost" onClick={onClose}>
          기록 완료{recordedCount > 0 ? ` (${recordedCount})` : ''}
        </Button>
        <button type="button" className="icon-btn text-ivory-faint" aria-label="기록 닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {/* 기록된 스텝은 우측 케이스 패널의 시나리오 섹션에 실시간 반영되므로
          오버레이 안에서는 브라우저에 전체 폭을 준다 */}
      <div className={styles.layout}>
        <div className={styles.browserArea}>
          <LiveBrowserPane recording defaultSelectMode onRecordStep={handleRecordStep} />
        </div>
      </div>
    </div>,
    document.body
  )
}
