import { DEFAULT_PET_CHARACTER_ID } from '../../../../shared/petCharacters'
import type { PetCharacter } from './types'
import { catCharacter } from './cat'
import { robotCharacter } from './robot'

// 캐릭터 레지스트리 — 새 캐릭터를 추가하려면 여기 등록하고
// shared/petCharacters.ts의 PET_CHARACTERS 목록에 메타데이터를 추가한다

const REGISTRY: Record<string, PetCharacter> = {
  [catCharacter.id]: catCharacter,
  [robotCharacter.id]: robotCharacter
}

export function getCharacter(id: string): PetCharacter {
  return REGISTRY[id] ?? REGISTRY[DEFAULT_PET_CHARACTER_ID]
}
