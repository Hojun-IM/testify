import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { getDb } from './db'
import { registerProjectHandlers } from './ipc/projects'
import { registerTestHandlers } from './ipc/tests'
import { registerTestCaseHandlers } from './ipc/testCases'
import { registerHttpHandlers } from './ipc/http'
import { registerHookHandlers } from './ipc/hooks'
import { registerTestRunHandlers } from './ipc/testRuns'
import { broadcastPetAppearance, registerPetHandlers } from './ipc/pet'
import { subscribePetState } from './pet/petState'
import { createPetWindow, isPetEnabled, reassertPetOnTop } from './pet/petWindow'
import { createTray } from './pet/tray'

const isDev = !app.isPackaged

// dev에서는 vite가 unsafe-eval을 쓰고 CSP가 없어서 Electron이 렌더러/웹뷰마다
// "Electron Security Warning"을 콘솔에 찍는다. 패키징 빌드에는 원래 뜨지 않는 경고라 dev에서만 끈다
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
}

// 개발 편의: TESTIFY_DEBUG_PORT 환경변수가 설정된 경우에만 CDP 원격 디버깅 포트를 연다
if (isDev && process.env.TESTIFY_DEBUG_PORT) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env.TESTIFY_DEBUG_PORT)
}

let mainWindow: BrowserWindow | null = null
// 트레이 "종료"나 Cmd+Q로 실제 종료할 때만 true — 그 전까지 메인 창 닫기는 숨김으로 처리한다
let quitting = false

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 760,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1f1e1d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 20 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      // 대시보드의 임베디드 브라우저(<webview>) 사용을 위해 필요
      webviewTag: true
      // backgroundThrottling은 기본값(true)으로 두고, 테스트 재생 중에만 동적으로 푼다
      // (아래 subscribePetState) — 평소 창이 숨겨져 있을 때는 렌더러 타이머가 스로틀되어
      // 백그라운드 CPU 사용을 아낀다
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  // 메인 창이 포커스를 받는 순간 macOS가 같은 앱의 펫 창을 뒤로 밀어내는 경우가 있어
  // (알려진 Electron/macOS z-order 이슈) 포커스 시점마다 펫을 즉시 다시 맨 위로 올린다.
  // 워치독(petWindow.ts)이 몇 초 간격으로도 재확인하지만, 포커스 전환 시점엔 지연 없이 반응한다
  win.on('focus', reassertPetOnTop)

  // 닫기 = 숨김. 프로세스는 트레이/펫과 함께 백그라운드에 남고,
  // 실행 중이던 테스트 재생(렌더러)도 그대로 이어진다
  win.on('close', (event) => {
    if (quitting) return
    event.preventDefault()
    win.hide()
  })

  win.on('closed', () => {
    mainWindow = null
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = win
  return win
}

function ensureMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow
  return createWindow()
}

function showMainWindow(): void {
  const win = ensureMainWindow()
  win.show()
  win.focus()
}

app.whenReady().then(() => {
  getDb()
  registerProjectHandlers()
  registerTestHandlers()
  registerTestCaseHandlers()
  registerHttpHandlers()
  registerHookHandlers()
  registerTestRunHandlers()
  registerPetHandlers({
    getMainWindow: () => mainWindow,
    ensureMainWindow,
    showMainWindow
  })
  createWindow()
  // 마지막에 펫을 꺼둔 상태였다면 창(렌더러)을 아예 만들지 않는다 — 트레이에서 켤 수 있다
  if (isPetEnabled()) createPetWindow()
  createTray({
    onOpenApp: showMainWindow,
    onAppearanceChanged: broadcastPetAppearance,
    onQuit: () => {
      quitting = true
      app.quit()
    }
  })

  // 테스트 재생 중에만 메인 창 렌더러의 백그라운드 스로틀링을 푼다.
  // 창이 숨겨진 채 실행이 이어져야 하는 구간에서만 타이머를 온전히 돌리고,
  // 실행이 끝나면 다시 스로틀링해 유휴 CPU 사용을 줄인다
  subscribePetState((state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.setBackgroundThrottling(state.status !== 'running')
    }
  })

  app.on('activate', () => {
    showMainWindow()
  })
})

app.on('before-quit', () => {
  quitting = true
})

app.on('window-all-closed', () => {
  // 펫 창이 상주하므로 평소에는 발생하지 않는다. 렌더러 크래시 등으로
  // 모든 창이 사라진 예외 상황에서만 기존 정책대로 정리한다
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
