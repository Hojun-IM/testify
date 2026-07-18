import { useEffect, useRef, useState } from 'react'
import type { PetAppearance, PetCommandAction, PetRunState, PetRunStatus } from '../../../shared/types'
import { DEFAULT_PET_CHARACTER_ID } from '../../../shared/petCharacters'
import { DEFAULT_PET_SIZE, getPetMetrics } from '../../../shared/petSize'
import { getCharacter } from './characters'
import { drawFrame, SPRITE_SIZE } from './characters/types'
import styles from './PetApp.module.css'

// 데스크톱 펫 창 루트. 항상 위에 떠 있는 투명 창에서
// - 테스트 실행 상태(대기/실행/성공/실패)를 캐릭터 애니메이션으로 보여주고
// - 클릭하면 실행 요약 툴팁 + 제어 버튼(실행/중지/취소/앱 열기)을 펼친다
// - 드래그로 화면 어디로든 옮길 수 있다 (위치는 메인 프로세스가 기억)

const INITIAL_STATE: PetRunState = {
  status: 'idle',
  total: 0,
  passed: 0,
  failed: 0,
  runningCaseName: null,
  startedAt: null,
  finishedAt: null,
  canRerun: false,
  message: null
}

const STATUS_LABELS: Record<PetRunStatus, string> = {
  idle: '대기 중',
  running: '실행 중',
  success: '성공',
  failure: '실패'
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}분 ${sec}초` : `${sec}초`
}

export function PetApp(): JSX.Element {
  const [state, setState] = useState<PetRunState>(INITIAL_STATE)
  const [appearance, setAppearance] = useState<PetAppearance>({
    characterId: DEFAULT_PET_CHARACTER_ID,
    size: DEFAULT_PET_SIZE,
    overrides: {}
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  // 창이 안 보이는 동안(펫 숨김 전환 중 등)은 프레임 루프를 완전히 멈춘다
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // 프레임 오프셋(모션)을 리렌더 없이 직접 반영하기 위한 몸체 요소 ref
  const petBodyRef = useRef<HTMLDivElement | null>(null)

  const character = getCharacter(appearance.characterId)
  const metrics = getPetMetrics(appearance.size)
  const gifSrc = appearance.overrides[state.status]

  // 초기 상태/외형(캐릭터 + 커스텀 GIF) 로드 + 변경 구독
  useEffect(() => {
    void window.petApi.getState().then(setState)
    void window.petApi.getAppearance().then(setAppearance)
    const offState = window.petApi.onState(setState)
    const offAppearance = window.petApi.onAppearance(setAppearance)
    return () => {
      offState()
      offAppearance()
    }
  }, [])

  useEffect(() => {
    const onVisibility = (): void => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // 내장 스프라이트 프레임 루프 — 커스텀 GIF가 있으면 <img>가 대신 재생하므로 돌리지 않고,
  // 창이 안 보일 때도 멈춘다. 몸체 모션(offsetY)도 CSS 무한 애니메이션 대신 여기서
  // 프레임 단위로만 갱신한다 — 연속 CSS 애니메이션은 매 vsync 컴포지팅으로 유휴 CPU를
  // 상시 소모하지만(측정 시 GPU+렌더러 합산 ~12%p), 이 루프는 수백 ms에 한 번만 깨어난다
  useEffect(() => {
    if (gifSrc || !pageVisible) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const body = petBodyRef.current
    const frames = character.frames[state.status]
    const palette = character.palette
    let index = 0
    let timer: ReturnType<typeof setTimeout>
    function tick(): void {
      drawFrame(ctx!, frames[index], palette)
      if (body) body.style.transform = `translateY(${frames[index].offsetY ?? 0}px)`
      timer = setTimeout(() => {
        index = (index + 1) % frames.length
        tick()
      }, frames[index].durationMs)
    }
    tick()
    return () => {
      clearTimeout(timer)
      if (body) body.style.transform = ''
    }
  }, [state.status, gifSrc, character, pageVisible])

  // 실행 중 경과 시간 표시용 1초 틱 — 패널이 열려 있고 실행 중일 때만 돈다
  useEffect(() => {
    if (!panelOpen || state.status !== 'running') return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [panelOpen, state.status])

  // 투명 창 클릭 통과 제어 — 펫/패널([data-hit]) 위에 있을 때만 마우스를 받는다.
  // forward:true 덕분에 통과 중에도 mousemove는 계속 들어오므로 여기서 다시 복구할 수 있다
  useEffect(() => {
    let lastIgnore: boolean | null = null
    function apply(ignore: boolean): void {
      if (ignore === lastIgnore) return
      lastIgnore = ignore
      window.petApi.setIgnoreMouse(ignore)
    }
    function onMove(event: MouseEvent): void {
      const target = event.target as Element | null
      apply(!target?.closest?.('[data-hit]'))
    }
    function onLeave(): void {
      apply(true)
    }
    document.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // 드래그 이동 / 클릭(툴팁 토글) 구분 — 4px 이상 움직이면 드래그로 본다
  const dragRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null)

  function onPetPointerDown(event: React.PointerEvent): void {
    if (event.button !== 0) return
    ;(event.target as Element).setPointerCapture(event.pointerId)
    dragRef.current = { startX: event.screenX, startY: event.screenY, moved: false }
    void window.petApi.dragStart()
  }

  function onPetPointerMove(event: React.PointerEvent): void {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.screenX - drag.startX
    const dy = event.screenY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true
    if (drag.moved) window.petApi.dragMove(dx, dy)
  }

  function onPetPointerUp(): void {
    const drag = dragRef.current
    dragRef.current = null
    window.petApi.dragEnd()
    if (drag && !drag.moved) setPanelOpen((open) => !open)
  }

  function sendCommand(action: PetCommandAction): void {
    void window.petApi.command(action)
  }

  const running = state.status === 'running'
  const doneCount = state.passed + state.failed
  const elapsedMs = running
    ? now - (state.startedAt ?? now)
    : state.startedAt && state.finishedAt
      ? state.finishedAt - state.startedAt
      : null

  // 크기 프리셋(shared/petSize.ts)의 수치를 CSS 커스텀 프로퍼티로 흘려보낸다.
  // 창 자체의 실제 픽셀 크기는 메인 프로세스가 setBounds로 조절하고(petWindow.ts),
  // 여기서는 그 안의 펫/그림자/툴팁 위치만 같은 수치로 맞춘다
  const stageStyle = {
    '--sprite-size': `${metrics.spriteSize}px`,
    '--slot-height': `${metrics.slotHeight}px`,
    '--shadow-width': `${metrics.shadowWidth}px`,
    '--shadow-height': `${metrics.shadowHeight}px`,
    '--panel-bottom': `${metrics.slotHeight + metrics.bottomMargin + 8}px`
  } as React.CSSProperties

  return (
    <div className={styles.stage} style={stageStyle}>
      {panelOpen && (
        <div className={styles.panel} data-hit>
          <div className={styles.panelHeader}>
            <span className={`${styles.statusDot} ${styles[`dot-${state.status}`] ?? ''}`} />
            <span className={styles.statusLabel}>{STATUS_LABELS[state.status]}</span>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="툴팁 닫기"
              onClick={() => setPanelOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={styles.panelBody}>
            {running ? (
              <>
                {state.runningCaseName && (
                  <p className={styles.caseName} title={state.runningCaseName}>
                    ▶ {state.runningCaseName}
                  </p>
                )}
                <p className={styles.summary}>
                  진행 {doneCount}/{state.total} · 성공 {state.passed} · 실패 {state.failed}
                </p>
                {elapsedMs !== null && <p className={styles.meta}>경과 {formatElapsed(elapsedMs)}</p>}
              </>
            ) : state.total > 0 ? (
              <>
                <p className={styles.summary}>
                  전체 {state.total} · 성공 {state.passed} · 실패 {state.failed}
                </p>
                {elapsedMs !== null && <p className={styles.meta}>소요 {formatElapsed(elapsedMs)}</p>}
              </>
            ) : (
              <p className={styles.meta}>아직 실행한 테스트가 없습니다</p>
            )}
            {state.message && <p className={styles.message}>{state.message}</p>}
          </div>

          <div className={styles.buttonRow}>
            {running ? (
              <>
                <button type="button" className={styles.button} onClick={() => sendCommand('stop')}>
                  중지
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.danger}`}
                  onClick={() => sendCommand('cancel')}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                disabled={!state.canRerun}
                title={state.canRerun ? undefined : '대시보드에서 한 번 실행한 뒤 재실행할 수 있습니다'}
                onClick={() => sendCommand('rerun')}
              >
                {state.total > 0 ? '재실행' : '실행'}
              </button>
            )}
            <button type="button" className={styles.button} onClick={() => sendCommand('open-app')}>
              앱 열기
            </button>
          </div>
        </div>
      )}

      <div
        className={styles.petSlot}
        data-hit
        onPointerDown={onPetPointerDown}
        onPointerMove={onPetPointerMove}
        onPointerUp={onPetPointerUp}
      >
        <div ref={petBodyRef} className={styles.pet}>
          {gifSrc ? (
            <img className={styles.sprite} src={gifSrc} alt={STATUS_LABELS[state.status]} draggable={false} />
          ) : (
            <canvas
              ref={canvasRef}
              className={styles.sprite}
              width={SPRITE_SIZE}
              height={SPRITE_SIZE}
              aria-label={STATUS_LABELS[state.status]}
            />
          )}
        </div>
        <div className={styles.shadow} />
      </div>
    </div>
  )
}
