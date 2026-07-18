import type { PetRunStatus } from '../../../../shared/types'

// 펫 캐릭터 추상화 — 캐릭터 하나는 "상태별 프레임 목록 + 팔레트 + 상태별 모션"으로 정의된다.
// 새 캐릭터는 이 인터페이스를 구현해 characters/index.ts 레지스트리에 등록하고,
// shared/petCharacters.ts 목록에 메타데이터를 추가하면 트레이 메뉴에서 바로 선택할 수 있다.

export const SPRITE_SIZE = 16

export type SpriteFrame = {
  grid: string[]
  durationMs: number
  // 이 프레임 동안 몸체를 세로로 옮길 거리 (화면 px, 음수 = 위).
  // CSS 무한 애니메이션은 매 vsync마다 컴포지터를 깨워 유휴 CPU를 상시 소모하므로
  // (측정: GPU+렌더러 합산 ~12%p), 모션도 프레임 틱에 맞춰 이산적으로만 움직인다
  offsetY?: number
}

export type PetCharacter = {
  id: string
  // 그리드 문자 → 색상. 캐릭터마다 자유롭게 정의한다
  palette: Record<string, string>
  frames: Record<PetRunStatus, SpriteFrame[]>
}

export type PixelEdit = [row: number, col: number, colorKey: string]

// 기본 그리드에 일부 픽셀만 바꾼 변형 프레임을 만든다
export function patch(rows: string[], edits: PixelEdit[]): string[] {
  const next = rows.map((row) => row.split(''))
  for (const [row, col, colorKey] of edits) {
    next[row][col] = colorKey
  }
  return next.map((chars) => chars.join(''))
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  palette: Record<string, string>
): void {
  ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  for (let y = 0; y < SPRITE_SIZE; y++) {
    const row = frame.grid[y]
    for (let x = 0; x < SPRITE_SIZE; x++) {
      const color = palette[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }
}
