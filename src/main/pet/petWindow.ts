import { app, BrowserWindow, screen } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_PET_CHARACTER_ID, PET_CHARACTERS } from '../../shared/petCharacters'
import { DEFAULT_PET_SIZE, PET_SIZES, getPetMetrics, type PetMetrics } from '../../shared/petSize'
import type { PetSize } from '../../shared/types'

// 데스크톱 펫 창 — 투명·프레임리스·항상 위 소형 창. clawd-on-desk와 같은 방식으로
// 기본은 클릭 통과(setIgnoreMouseEvents + forward)이고, 렌더러가 펫 몸체/툴팁 위에
// 커서가 올라온 순간에만 마우스 이벤트를 받도록 토글한다.
// 창 크기는 "펫 + 위로 펼쳐지는 툴팁"이 들어가는 크기로 잡고(크기 프리셋에 따라 가변),
// 나머지는 투명 영역이다.

const isDev = !app.isPackaged

type PetWindowSettings = {
  x?: number
  y?: number
  visible?: boolean
  character?: string
  size?: PetSize
}

let petWindow: BrowserWindow | null = null
let saveTimer: NodeJS.Timeout | null = null
let topmostWatchdog: NodeJS.Timeout | null = null

// macOS에서는 'floating' 레벨만으로는 같은 앱의 다른 창(메인 창)이 포커스를 받는 순간
// 펫이 그 뒤로 밀리는 경우가 있다 — 'floating'보다 훨씬 높은 'screen-saver' 레벨을 쓰고,
// 그래도 z-order가 흐트러질 수 있는 경우(창 포커스 전환, 풀스크린 전환 등)를 대비해
// 주기적으로 재확인한다. setAlwaysOnTop 자체는 OS 레벨 플래그 설정이라 호출 비용이
// 거의 0에 가까우므로 몇 초 간격 watchdog로도 상시 CPU 부담이 없다
const TOPMOST_LEVEL = process.platform === 'darwin' ? 'screen-saver' : 'floating'
const TOPMOST_WATCHDOG_MS = 4000

export function reassertPetOnTop(): void {
  const win = getPetWindow()
  if (!win) return
  win.setAlwaysOnTop(true, TOPMOST_LEVEL)
  win.moveTop()
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'pet-window.json')
}

function loadSettings(): PetWindowSettings {
  try {
    if (existsSync(settingsPath())) {
      return JSON.parse(readFileSync(settingsPath(), 'utf-8')) as PetWindowSettings
    }
  } catch {
    // 설정 파일이 깨져 있으면 기본 위치로 시작한다
  }
  return {}
}

function saveSettings(patch: PetWindowSettings): void {
  const next = { ...loadSettings(), ...patch }
  try {
    writeFileSync(settingsPath(), JSON.stringify(next))
  } catch {
    // 위치 저장 실패는 치명적이지 않다 — 다음 실행에서 기본 위치로 뜰 뿐
  }
}

// 저장된 좌표가 모니터 구성 변경으로 화면 밖에 있으면 기본 위치(주 모니터 우하단)로 되돌린다
function resolveInitialPosition(saved: PetWindowSettings, metrics: PetMetrics): { x: number; y: number } {
  if (typeof saved.x === 'number' && typeof saved.y === 'number') {
    const onScreen = screen.getAllDisplays().some((display) => {
      const area = display.workArea
      return (
        saved.x! + metrics.windowWidth > area.x + 20 &&
        saved.x! < area.x + area.width - 20 &&
        saved.y! + metrics.windowHeight > area.y + 20 &&
        saved.y! < area.y + area.height - 20
      )
    })
    if (onScreen) return { x: saved.x, y: saved.y }
  }
  const area = screen.getPrimaryDisplay().workArea
  return {
    x: area.x + area.width - metrics.windowWidth - 24,
    y: area.y + area.height - metrics.windowHeight - 24
  }
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow && !petWindow.isDestroyed() ? petWindow : null
}

export function isPetVisible(): boolean {
  return getPetWindow()?.isVisible() ?? false
}

// 앱 시작 시 펫 창을 만들지 여부 (마지막 표시 상태를 따른다)
export function isPetEnabled(): boolean {
  return loadSettings().visible !== false
}

// 표시 = 창 생성, 숨김 = 창 파괴 — 단순 hide 대신 렌더러 프로세스를 통째로 내려서
// 펫을 꺼둔 동안에는 추가 메모리를 전혀 쓰지 않는다. 상태는 메인 프로세스(petState)가
// 들고 있으므로 다시 켜면 현재 상태 그대로 복원된다
export function setPetVisible(visible: boolean): void {
  saveSettings({ visible })
  if (visible) {
    createPetWindow()
  } else {
    const win = getPetWindow()
    if (win) win.destroy()
  }
}

export function getPetCharacter(): string {
  const saved = loadSettings().character
  return PET_CHARACTERS.some((meta) => meta.id === saved) ? saved! : DEFAULT_PET_CHARACTER_ID
}

export function setPetCharacter(id: string): void {
  saveSettings({ character: id })
}

export function getPetSize(): PetSize {
  const saved = loadSettings().size
  return PET_SIZES.some((meta) => meta.id === saved) ? saved! : DEFAULT_PET_SIZE
}

// 크기를 바꾸면 실제 OS 창 크기도 함께 조절한다. 창 너비는 모든 프리셋에서 동일하므로
// 화면상 펫의 좌·하단 위치가 그대로 유지되도록 높이 변화분만큼 y를 보정한다
// (바닥 기준으로 커지거나 작아지는 것처럼 보이게)
export function setPetSize(size: PetSize): void {
  saveSettings({ size })
  const win = getPetWindow()
  if (!win) return
  const metrics = getPetMetrics(size)
  const bounds = win.getBounds()
  win.setBounds(
    {
      x: bounds.x,
      y: bounds.y + bounds.height - metrics.windowHeight,
      width: metrics.windowWidth,
      height: metrics.windowHeight
    },
    true
  )
}

export function createPetWindow(): BrowserWindow {
  const existing = getPetWindow()
  if (existing) return existing

  const saved = loadSettings()
  const metrics = getPetMetrics(getPetSize())
  const { x, y } = resolveInitialPosition(saved, metrics)

  const win = new BrowserWindow({
    width: metrics.windowWidth,
    height: metrics.windowHeight,
    x,
    y,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false, // 이동은 렌더러 드래그 → IPC로만 처리한다
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    // 펫을 클릭해도 다른 앱의 포커스를 빼앗지 않는다 (마우스 이벤트는 그대로 전달됨)
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/pet.cjs'),
      sandbox: false
      // backgroundThrottling은 기본값(true)을 쓴다 — 펫 창은 항상 화면에 보이는 동안만
      // 존재하므로(숨김 = 파괴) 스로틀링이 걸릴 상황 자체가 없고, 걸리면 걸리는 대로 이득이다
    }
  })

  // 전체화면 앱 위에서도, 같은 앱의 메인 창이 포커스를 받아도 항상 위에 보이도록
  // (clawd-on-desk와 동일한 접근 — macOS 'floating' 레벨만으로는 부족하다)
  win.setAlwaysOnTop(true, TOPMOST_LEVEL)
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // 기본은 전체 클릭 통과 — 렌더러가 펫 위에 커서가 올라오면 false로 토글한다
  win.setIgnoreMouseEvents(true, { forward: true })

  if (topmostWatchdog) clearInterval(topmostWatchdog)
  topmostWatchdog = setInterval(reassertPetOnTop, TOPMOST_WATCHDOG_MS)

  win.on('moved', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const bounds = win.isDestroyed() ? null : win.getBounds()
      if (bounds) saveSettings({ x: bounds.x, y: bounds.y })
    }, 500)
  })

  win.on('ready-to-show', () => {
    win.showInactive()
  })

  win.on('closed', () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null
    if (topmostWatchdog) clearInterval(topmostWatchdog)
    topmostWatchdog = null
    petWindow = null
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/pet.html'))
  }

  petWindow = win
  return win
}
