import { useEffect, useState } from 'react'
import type { Hook } from '../../../../shared/types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { HOOK_TIMING_LABELS } from './HookFormPanel'
import styles from './TestHooksModal.module.css'

// 사이드바 훅 탭에서 관리하는 전역 훅을 이 테스트에 불러와(연결해) 사용하도록 선택하는 모달.
// 프로젝트 전용 훅은 연결 없이 해당 프로젝트 안에서 자동으로 적용 대상이므로 여기에 나오지 않는다
export function TestHooksModal({
  open,
  testId,
  onClose,
  onSaved,
  sidebarCollapsed
}: {
  open: boolean
  testId: string
  onClose: () => void
  onSaved?: (linkedCount: number) => void
  sidebarCollapsed?: boolean
}): JSX.Element | null {
  const [globalHooks, setGlobalHooks] = useState<Hook[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    void (async () => {
      const [hooks, linked] = await Promise.all([
        window.api.hooks.list(),
        window.api.hooks.listForTest(testId)
      ])
      setGlobalHooks(hooks)
      setSelectedIds(new Set(linked.map((hook) => hook.id)))
    })()
  }, [open, testId])

  if (!open) return null

  function toggle(hookId: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(hookId)) next.delete(hookId)
      else next.add(hookId)
      return next
    })
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    // 목록 표시 순서(시점 순)를 연결 순서로 저장한다
    const orderedIds = globalHooks.filter((hook) => selectedIds.has(hook.id)).map((hook) => hook.id)
    try {
      await window.api.hooks.setForTest({ test_id: testId, hook_ids: orderedIds })
      onSaved?.(orderedIds.length)
      onClose()
    } finally {
      // 저장 실패 시에도 버튼이 "저장 중..."에 멈추지 않도록
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="전역 훅 불러오기"
      sidebarCollapsed={sidebarCollapsed}
      footer={
        <>
          <span className={`${styles.count} text-ivory-faint`}>{selectedIds.size}개 선택됨</span>
          <div className={styles.footerRight}>
            <Button variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </>
      }
    >
      <p className={`${styles.hint} text-ivory-faint`}>
        사이드바 훅 탭에서 관리하는 공통 훅을 이 테스트에 연결합니다. 연결된 훅은 이 테스트의 케이스 실행
        시점(Before All 등)에 함께 사용됩니다.
      </p>
      {globalHooks.length === 0 ? (
        <p className={`${styles.empty} text-ivory-faint`}>
          등록된 전역 훅이 없습니다. 사이드바의 훅 탭에서 먼저 훅을 만들어주세요.
        </p>
      ) : (
        <ul className={styles.list}>
          {globalHooks.map((hook) => (
            <li key={hook.id}>
              <label className={`${styles.row} ${hook.enabled ? '' : styles.rowDisabled} hover:bg-overlay`}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedIds.has(hook.id)}
                  onChange={() => toggle(hook.id)}
                />
                <span className={styles.info}>
                  <span className={`${styles.name} text-ivory`}>
                    {hook.name}
                    {!hook.enabled && <span className="text-ivory-faint"> (비활성)</span>}
                  </span>
                  {hook.description && (
                    <span className={`${styles.description} text-ivory-faint`}>{hook.description}</span>
                  )}
                </span>
                <span className={`${styles.meta} text-ivory-dim`}>{hook.type.toUpperCase()}</span>
                <span className={styles.timingBadge}>{HOOK_TIMING_LABELS[hook.timing]}</span>
                <span className={`${styles.meta} text-ivory-faint`}>{hook.steps.length} 스텝</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
