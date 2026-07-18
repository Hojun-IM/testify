import { Menu, Tray, nativeImage } from 'electron'
import { PET_CHARACTERS } from '../../shared/petCharacters'
import { PET_SIZES } from '../../shared/petSize'
import {
  getPetCharacter,
  getPetSize,
  isPetVisible,
  setPetCharacter,
  setPetSize,
  setPetVisible
} from './petWindow'

// 시스템 트레이 — 메인 창을 닫아도(숨김) 앱이 백그라운드에 남으므로,
// 창 다시 열기 · 펫 표시 토글 · 캐릭터/크기 선택 · 완전 종료 진입점을 트레이에 둔다.

// scripts 없이 소스에 내장한 트레이 아이콘 (플라스크 모양, 검정+알파 PNG).
// macOS에서는 template 이미지로 지정해 라이트/다크 메뉴바에 자동 대응한다
const TRAY_ICON_16 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAhElEQVR4nGNgoBFoYGBg+I+G95NigAIDA8N5NAMMSHXFfjQDSAYDb8B9BgYGBwYGBgEGBob30HAhGoBiYT4SP4GUWBCA2o5u43moiwiC+VAn70fD96EYLzDAkoDQcQE+A9BDHht+D/UmBkggQjMMz0fXDAs4Yg3ASNoC0BAmBZOULnACANu2TfUjvxB8AAAAAElFTkSuQmCC'
const TRAY_ICON_32 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA0klEQVR4nGNgGAWkgf9EYodh64AGBgaG/Xgsvg9Vo0ArB8AcgcsB+2lp8agDRh0w6gAYWA+1rAFJzAGpHBCgpeX4LMLmMKqD+1BLErDIKSBFBU1KwgIi4hmWPtZT23JQcL8noqIhVh3JoB9q6Hwi1CZA1Z6nluXIcQtyQAMR+D+etEIywFf9EsLvKc2WDhRYDsMUZcv7VHAA2dmygEqWk5UtkbMTtTBJ2XI+lS2HFd9EAQMaWA7DBcQ4gJJsRwgTzJYBNLQchvsJBb8DHfAoGDwAAGgjMB+uo6/HAAAAAElFTkSuQmCC'

let tray: Tray | null = null

type TrayDeps = {
  onOpenApp: () => void
  // 캐릭터/크기 변경 시 펫 창으로 새 외형을 밀어넣는 콜백 (ipc/pet.ts의 broadcastPetAppearance)
  onAppearanceChanged: () => void
  onQuit: () => void
}

function buildMenu(deps: TrayDeps): Menu {
  return Menu.buildFromTemplate([
    { label: 'Testify 열기', click: deps.onOpenApp },
    {
      label: isPetVisible() ? '펫 숨기기' : '펫 표시',
      click: () => {
        setPetVisible(!isPetVisible())
        // 토글 후 라벨을 갱신하기 위해 메뉴를 다시 만든다
        tray?.setContextMenu(buildMenu(deps))
      }
    },
    {
      label: '캐릭터',
      submenu: PET_CHARACTERS.map((meta) => ({
        label: meta.label,
        type: 'radio' as const,
        checked: getPetCharacter() === meta.id,
        click: () => {
          setPetCharacter(meta.id)
          deps.onAppearanceChanged()
        }
      }))
    },
    {
      label: '크기',
      submenu: PET_SIZES.map((meta) => ({
        label: meta.label,
        type: 'radio' as const,
        checked: getPetSize() === meta.id,
        click: () => {
          setPetSize(meta.id)
          deps.onAppearanceChanged()
        }
      }))
    },
    { type: 'separator' },
    { label: '종료', click: deps.onQuit }
  ])
}

export function createTray(deps: TrayDeps): Tray {
  if (tray) return tray

  const icon = nativeImage.createEmpty()
  icon.addRepresentation({
    scaleFactor: 1,
    dataURL: `data:image/png;base64,${TRAY_ICON_16}`
  })
  icon.addRepresentation({
    scaleFactor: 2,
    dataURL: `data:image/png;base64,${TRAY_ICON_32}`
  })
  if (process.platform === 'darwin') icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Testify — 테스트 실행 펫')
  tray.setContextMenu(buildMenu(deps))
  // 트레이 아이콘 클릭(맥은 우클릭 메뉴가 기본) 시 앱 창을 다시 연다
  tray.on('double-click', deps.onOpenApp)
  return tray
}
