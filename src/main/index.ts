import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { getDb } from './db'
import { registerProjectHandlers } from './ipc/projects'
import { registerTestHandlers } from './ipc/tests'
import { registerTestCaseHandlers } from './ipc/testCases'
import { registerHttpHandlers } from './ipc/http'

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

function createWindow(): void {
  const mainWindow = new BrowserWindow({
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
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  getDb()
  registerProjectHandlers()
  registerTestHandlers()
  registerTestCaseHandlers()
  registerHttpHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
