import type { PetAppearance, PetCommandAction, PetRunState } from '../shared/types'

export {}

// 데스크톱 펫 창(pet.html)에서만 주입되는 브리지. 메인 창에는 window.api가 주입된다
declare global {
  interface Window {
    petApi: {
      getState: () => Promise<PetRunState>
      onState: (callback: (state: PetRunState) => void) => () => void
      getAppearance: () => Promise<PetAppearance>
      onAppearance: (callback: (appearance: PetAppearance) => void) => () => void
      command: (action: PetCommandAction) => Promise<void>
      setIgnoreMouse: (ignore: boolean) => void
      dragStart: () => Promise<void>
      dragMove: (dx: number, dy: number) => void
      dragEnd: () => void
    }
  }
}
