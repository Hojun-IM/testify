import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, CloseIcon } from '../ui/icons'
import type { PickedElement } from './elementPicker'
import styles from './ElementActionMenu.module.css'

export type ActionDef = {
  type: string
  label: string
  needsValue?: boolean
  valuePlaceholder?: string
}

type ActionGroup = {
  title: string
  actions: ActionDef[]
}

// E2E 시나리오에서 요소에 적용할 수 있는 이벤트 목록
const ACTION_GROUPS: ActionGroup[] = [
  {
    title: '동작',
    actions: [
      { type: 'click', label: '클릭' },
      { type: 'dblclick', label: '더블 클릭' },
      { type: 'rightclick', label: '우클릭' },
      { type: 'hover', label: '호버' },
      { type: 'scroll', label: '요소까지 스크롤' },
      { type: 'check', label: '체크' },
      { type: 'uncheck', label: '체크 해제' }
    ]
  },
  {
    title: '입력',
    actions: [
      { type: 'fill', label: '텍스트 입력', needsValue: true, valuePlaceholder: '입력할 텍스트' },
      { type: 'press', label: '키 입력', needsValue: true, valuePlaceholder: '예: Enter, Tab, Escape' },
      { type: 'select', label: '옵션 선택', needsValue: true, valuePlaceholder: '선택할 옵션 값' }
    ]
  },
  {
    title: '검증',
    actions: [
      { type: 'assert-visible', label: '표시 검증' },
      { type: 'assert-text', label: '텍스트 검증', needsValue: true, valuePlaceholder: '기대하는 텍스트' },
      { type: 'wait', label: '요소 대기' }
    ]
  }
]

export function ElementActionMenu({
  element,
  position,
  onSelect,
  onClose
}: {
  element: PickedElement
  position: { left: number; top: number }
  onSelect: (action: ActionDef, value?: string) => void
  onClose: () => void
}): JSX.Element {
  const [pendingAction, setPendingAction] = useState<ActionDef | null>(null)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (pendingAction) inputRef.current?.focus()
  }, [pendingAction])

  function choose(action: ActionDef): void {
    if (action.needsValue) {
      setPendingAction(action)
      // 텍스트 검증은 현재 요소의 텍스트를 기본값으로 채워준다
      setValue(action.type === 'assert-text' ? element.text : '')
      return
    }
    onSelect(action)
  }

  function submitValue(): void {
    if (!pendingAction || !value.trim()) return
    onSelect(pendingAction, value.trim())
  }

  const targetLabel = `${element.tag}${element.text ? ` "${element.text}"` : ''}`

  return (
    // data 속성은 상위 오버레이/패널이 Escape 처리 시 "메뉴가 열려 있는지"를 확인하는 용도
    <div className={`${styles.menu} bg-raised border-line`} style={position} data-element-action-menu>
      <div className={`${styles.header} border-line`}>
        <span className={`${styles.target} text-ivory`} title={element.selector}>
          {targetLabel}
        </span>
        <button type="button" className="icon-btn text-ivory-faint" aria-label="메뉴 닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className={`${styles.selector} text-ivory-faint`} title={element.selector}>
        {element.selector}
      </div>

      {pendingAction ? (
        <div className={styles.valueForm}>
          <button
            type="button"
            className={`${styles.backBtn} text-ivory-faint hover:bg-overlay`}
            onClick={() => setPendingAction(null)}
          >
            <ChevronLeftIcon size={12} />
            {pendingAction.label}
          </button>
          <input
            ref={inputRef}
            className={`${styles.valueInput} bg-canvas text-ivory border-line`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitValue()
            }}
            placeholder={pendingAction.valuePlaceholder}
            spellCheck={false}
          />
          <button
            type="button"
            className={`${styles.addBtn} bg-clay-500 hover:bg-clay-400`}
            onClick={submitValue}
            disabled={!value.trim()}
          >
            스텝 추가
          </button>
        </div>
      ) : (
        <div className={styles.groups}>
          {ACTION_GROUPS.map((group) => (
            <div key={group.title} className={styles.group}>
              <span className={`${styles.groupTitle} text-ivory-faint`}>{group.title}</span>
              {group.actions.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  className={`${styles.item} text-ivory-dim hover:bg-overlay`}
                  onClick={() => choose(action)}
                >
                  {action.label}
                  {action.needsValue && <span className="text-ivory-faint">…</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
