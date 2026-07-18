// 내장 펫 캐릭터 목록 — 메인 프로세스(트레이 메뉴)와 펫 렌더러가 공유하는 메타데이터.
// 실제 스프라이트 데이터는 렌더러(src/renderer/src/pet/characters/)에만 있고,
// 여기에는 선택 UI에 필요한 id/이름만 둔다. 새 캐릭터를 추가하려면
// 1) 렌더러 characters/에 PetCharacter 구현을 등록하고 2) 이 목록에 한 줄 추가하면 된다.

export type PetCharacterMeta = {
  id: string
  label: string
}

export const PET_CHARACTERS: PetCharacterMeta[] = [
  { id: 'cat', label: '고양이' },
  { id: 'robot', label: '로봇' }
]

export const DEFAULT_PET_CHARACTER_ID = 'cat'
