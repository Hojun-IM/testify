import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { PetAppearance, PetCommandAction, PetRunState } from '../shared/types'

// 데스크톱 펫 창 전용 브리지. 메인 창의 window.api와 달리 DB에는 접근하지 않고,
// 실행 상태 구독 · 제어 명령 전달 · 창 이동(드래그) · 클릭 통과 토글만 노출한다
const petApi = {
  getState: (): Promise<PetRunState> => ipcRenderer.invoke('pet:getState'),
  onState: (callback: (state: PetRunState) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, state: PetRunState): void => callback(state)
    ipcRenderer.on('pet:stateChanged', listener)
    return () => ipcRenderer.removeListener('pet:stateChanged', listener)
  },
  // 외형 = 선택된 캐릭터 id + 상태별 커스텀 GIF({userData}/pet-animations/{status}.gif, data URL)
  getAppearance: (): Promise<PetAppearance> => ipcRenderer.invoke('pet:getAppearance'),
  onAppearance: (callback: (appearance: PetAppearance) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, appearance: PetAppearance): void =>
      callback(appearance)
    ipcRenderer.on('pet:appearanceChanged', listener)
    return () => ipcRenderer.removeListener('pet:appearanceChanged', listener)
  },
  command: (action: PetCommandAction): Promise<void> => ipcRenderer.invoke('pet:command', action),
  // 투명 영역은 클릭이 아래 창으로 통과하도록, 펫 몸체/툴팁 위에서만 마우스를 받는다
  setIgnoreMouse: (ignore: boolean): void => {
    ipcRenderer.send('pet:setIgnoreMouse', ignore)
  },
  // 드래그 이동 — 시작 시점 창 위치를 main이 기억하고, 이후 시작점 대비 누적 오프셋으로 이동한다
  dragStart: (): Promise<void> => ipcRenderer.invoke('pet:dragStart'),
  dragMove: (dx: number, dy: number): void => {
    ipcRenderer.send('pet:dragMove', { dx, dy })
  },
  dragEnd: (): void => {
    ipcRenderer.send('pet:dragEnd')
  }
}

export type PetApi = typeof petApi

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('petApi', petApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.petApi = petApi
}
