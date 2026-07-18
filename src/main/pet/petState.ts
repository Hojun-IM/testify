import type { PetRunState } from '../../shared/types'

// 데스크톱 펫이 보여줄 테스트 실행 상태의 단일 저장소 (메인 프로세스 메모리).
// 대시보드 렌더러가 재생 진행에 맞춰 갱신하고, 펫 창이 구독한다.
// 메인 창이 숨겨져 있어도(닫기 버튼 = 숨김) 렌더러는 살아 있으므로 상태는 계속 흐른다.

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

type PetStateListener = (state: PetRunState) => void

let currentState: PetRunState = INITIAL_STATE
const listeners = new Set<PetStateListener>()

export function getPetState(): PetRunState {
  return currentState
}

export function setPetState(state: PetRunState): void {
  // 동일한 상태가 반복 보고되면 펫 창으로의 IPC 푸시를 생략한다
  if (JSON.stringify(state) === JSON.stringify(currentState)) return
  currentState = state
  for (const listener of listeners) listener(currentState)
}

export function subscribePetState(listener: PetStateListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
