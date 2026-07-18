import type { PetSize } from './types'

// 펫 크기 프리셋 — 메인 프로세스(펫 창 크기 조절)와 펫 렌더러(스프라이트/그림자 CSS 크기)가
// 같은 수치를 쓰도록 한 곳에서 계산한다. spriteSize는 16px 네이티브 스프라이트 그리드의
// 정수 배율(6/8/10배)로 잡아 image-rendering:pixelated 확대 시 픽셀이 또렷하게 보이게 한다.

export type PetSizeMeta = {
  id: PetSize
  label: string
  spriteSize: number
}

export const PET_SIZES: PetSizeMeta[] = [
  { id: 'small', label: '작게', spriteSize: 32 },
  { id: 'medium', label: '보통', spriteSize: 64 },
  { id: 'large', label: '크게', spriteSize: 96 }
]

export const DEFAULT_PET_SIZE: PetSize = 'medium'

const BASE_SPRITE_SIZE = 128
const BASE_SLOT_HEIGHT = 140
const BASE_SHADOW_WIDTH = 84
const BASE_SHADOW_HEIGHT = 12
// 펫 몸체가 창 바닥에서 떨어진 여백 — 크기와 무관하게 고정한다
const BOTTOM_MARGIN = 10
// 툴팁 패널이 펼쳐질 때 필요한 세로 여유 공간 — 패널 내용 크기는 펫 크기와 무관하므로 고정값
const TOOLTIP_RESERVED_HEIGHT = 230
// 창 너비는 툴팁 패널(268px + 여백)이 기준이라 가장 큰 펫 프리셋에서도 여유가 있어 고정한다
export const PET_WINDOW_WIDTH = 300

export type PetMetrics = {
  spriteSize: number
  slotHeight: number
  shadowWidth: number
  shadowHeight: number
  bottomMargin: number
  windowWidth: number
  windowHeight: number
}

export function getPetMetrics(size: PetSize): PetMetrics {
  const meta = PET_SIZES.find((item) => item.id === size) ?? PET_SIZES[1]
  const factor = meta.spriteSize / BASE_SPRITE_SIZE
  const slotHeight = Math.round(BASE_SLOT_HEIGHT * factor)
  return {
    spriteSize: meta.spriteSize,
    slotHeight,
    shadowWidth: Math.round(BASE_SHADOW_WIDTH * factor),
    shadowHeight: Math.round(BASE_SHADOW_HEIGHT * factor),
    bottomMargin: BOTTOM_MARGIN,
    windowWidth: PET_WINDOW_WIDTH,
    windowHeight: TOOLTIP_RESERVED_HEIGHT + slotHeight + BOTTOM_MARGIN
  }
}
