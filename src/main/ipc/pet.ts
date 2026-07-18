import { app, ipcMain, BrowserWindow } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type {
  PetAppearance,
  PetAssetMap,
  PetCommandAction,
  PetRunState,
  PetRunStatus
} from '../../shared/types'
import { getPetState, setPetState, subscribePetState } from '../pet/petState'
import { getPetCharacter, getPetSize, getPetWindow } from '../pet/petWindow'

const PET_STATUSES: PetRunStatus[] = ['idle', 'running', 'success', 'failure']

type PetIpcDeps = {
  getMainWindow: () => BrowserWindow | null
  ensureMainWindow: () => BrowserWindow
  showMainWindow: () => void
}

// 상태별 커스텀 GIF 오버라이드 — 사용자가 {userData}/pet-animations/idle.gif 등을 넣어두면
// 내장 픽셀 스프라이트 대신 그 GIF를 재생한다. 펫 페이지는 http(dev)/file(prod)로 뜨므로
// file:// 이미지를 직접 참조할 수 없어 data URL로 읽어 전달한다 (로드 시 1회, 상태당 수십 KB 수준)
function loadPetAssets(): PetAssetMap {
  const dir = join(app.getPath('userData'), 'pet-animations')
  const assets: PetAssetMap = {}
  for (const status of PET_STATUSES) {
    const file = join(dir, `${status}.gif`)
    try {
      if (existsSync(file)) {
        assets[status] = `data:image/gif;base64,${readFileSync(file).toString('base64')}`
      }
    } catch {
      // 읽기 실패한 상태는 내장 스프라이트로 폴백한다
    }
  }
  return assets
}

function currentAppearance(): PetAppearance {
  return { characterId: getPetCharacter(), size: getPetSize(), overrides: loadPetAssets() }
}

// 트레이 메뉴에서 캐릭터를 바꿨을 때 펫 창에 새 외형을 밀어넣는다
export function broadcastPetAppearance(): void {
  const win = getPetWindow()
  if (win) win.webContents.send('pet:appearanceChanged', currentAppearance())
}

// 재생 제어는 대시보드 렌더러가 수행하므로 명령을 메인 창으로 전달한다.
// 창이 로딩 중이면(비정상 종료 후 재생성 등) 로드 완료 후에 보낸다
function forwardCommandToMain(deps: PetIpcDeps, action: PetCommandAction): void {
  const win = deps.ensureMainWindow()
  if (win.webContents.isLoading()) {
    win.webContents.once('did-finish-load', () => {
      if (!win.isDestroyed()) win.webContents.send('pet:executeCommand', action)
    })
  } else {
    win.webContents.send('pet:executeCommand', action)
  }
}

export function registerPetHandlers(deps: PetIpcDeps): void {
  // 대시보드 렌더러 → 상태 갱신
  ipcMain.handle('pet:reportState', (_event, state: PetRunState): void => {
    setPetState(state)
  })

  // 펫 창 초기화 시 현재 상태/외형(캐릭터 + 커스텀 GIF) 조회
  ipcMain.handle('pet:getState', (): PetRunState => getPetState())
  ipcMain.handle('pet:getAppearance', (): PetAppearance => currentAppearance())

  // 펫 툴팁 버튼 → 제어 명령. 현재 상태와 맞지 않는 명령(실행 중 재실행 등)은 무시한다
  ipcMain.handle('pet:command', (_event, action: PetCommandAction): void => {
    const status = getPetState().status
    if (action === 'open-app') {
      deps.showMainWindow()
      return
    }
    if (action === 'rerun') {
      if (status === 'running') return
      forwardCommandToMain(deps, action)
      return
    }
    // stop / cancel — 실행 중일 때만 의미가 있다
    if (status !== 'running') return
    forwardCommandToMain(deps, action)
  })

  // 투명 창 클릭 통과 토글 — 렌더러가 펫 몸체/툴팁 위 hover 여부에 따라 호출한다
  ipcMain.on('pet:setIgnoreMouse', (_event, ignore: boolean): void => {
    getPetWindow()?.setIgnoreMouseEvents(ignore, { forward: true })
  })

  // 펫 드래그 이동 — 시작 시점 창 위치를 기억하고 시작점 대비 누적 오프셋으로 이동한다.
  // 델타 누적 방식보다 라운딩 오차가 쌓이지 않는다
  let dragOrigin: { x: number; y: number } | null = null
  ipcMain.handle('pet:dragStart', (): void => {
    const win = getPetWindow()
    dragOrigin = win ? win.getBounds() : null
  })
  ipcMain.on('pet:dragMove', (_event, { dx, dy }: { dx: number; dy: number }): void => {
    const win = getPetWindow()
    if (!win || !dragOrigin) return
    win.setPosition(Math.round(dragOrigin.x + dx), Math.round(dragOrigin.y + dy))
  })
  ipcMain.on('pet:dragEnd', (): void => {
    dragOrigin = null
    // 'moved' 저장 디바운스가 마지막 위치를 기록한다
  })

  // 상태 변경을 펫 창으로 푸시
  subscribePetState((state) => {
    const win = getPetWindow()
    if (win) win.webContents.send('pet:stateChanged', state)
  })
}
