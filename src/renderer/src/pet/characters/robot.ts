import type { PetCharacter, PixelEdit } from './types'
import { patch } from './types'

// 두 번째 내장 캐릭터 — 안테나 달린 사각 로봇.
// 캐릭터 추상화가 실제로 동작함을 보여주는 레퍼런스 구현이기도 하다

const PALETTE: Record<string, string> = {
  K: '#2b303a', // 외곽선
  M: '#b3bcc7', // 메탈 바디
  D: '#7e8894', // 어두운 메탈 (그릴/패널)
  S: '#3f4a57', // 꺼진 눈
  E: '#5fd1e8', // 눈/패널 불빛
  A: '#e8a13f', // 안테나 불빛
  G: '#7fbf7f', // 성공 안테나
  Y: '#f2c94c', // 성공 별
  R: '#d96c6c', // 실패 X/눈
  C: '#7fb8d9' // 진행 점/스파크
}

const BASE: string[] = [
  '................',
  '.......A........',
  '.......K........',
  '...KKKKKKKKKK...',
  '..KMMMMMMMMMMK..',
  '..KMEEMMMMEEMK..',
  '..KMMMMMMMMMMK..',
  '..KMDDDDDDDDMK..',
  '...KKKKKKKKKK...',
  '..KMMMMMMMMMMK..',
  '..KMMDDMMDDMMK..',
  '..KMMMMMMMMMMK..',
  '...KKKKKKKKKK...',
  '....KDK..KDK....',
  '....KDK..KDK....',
  '...KKKK..KKKK...'
]

// 눈 끄기 (깜빡임)
const BLINK: PixelEdit[] = [
  [5, 4, 'S'],
  [5, 5, 'S'],
  [5, 10, 'S'],
  [5, 11, 'S']
]

// 실행 중 — 머리 위 점 + 몸통 패널 불빛이 좌우로 번갈아 켜진다
const DOT_1: PixelEdit[] = [[0, 10, 'C']]
const DOT_2: PixelEdit[] = [...DOT_1, [0, 12, 'C']]
const DOT_3: PixelEdit[] = [...DOT_2, [0, 14, 'C']]
const PANEL_LEFT: PixelEdit[] = [
  [10, 5, 'E'],
  [10, 6, 'E']
]
const PANEL_RIGHT: PixelEdit[] = [
  [10, 9, 'E'],
  [10, 10, 'E']
]

// 성공 — 안테나가 초록으로 켜지고 별이 반짝인다
const ANTENNA_OK: PixelEdit[] = [[1, 7, 'G']]
const STAR_BIG: PixelEdit[] = [
  ...ANTENNA_OK,
  [0, 3, 'Y'],
  [1, 2, 'Y'],
  [1, 3, 'Y'],
  [1, 4, 'Y'],
  [2, 3, 'Y']
]
const STAR_SMALL: PixelEdit[] = [...ANTENNA_OK, [1, 3, 'Y'], [0, 5, 'Y']]

// 실패 — 안테나/눈이 붉게 변하고 옆에서 스파크가 튄다
const ERROR_FACE: PixelEdit[] = [
  [1, 7, 'R'],
  [5, 4, 'R'],
  [5, 5, 'R'],
  [5, 10, 'R'],
  [5, 11, 'R'],
  [0, 11, 'R'],
  [0, 13, 'R'],
  [1, 12, 'R'],
  [2, 11, 'R'],
  [2, 13, 'R']
]
const FAIL_1: PixelEdit[] = [...ERROR_FACE, [4, 1, 'C']]
const FAIL_2: PixelEdit[] = [...ERROR_FACE, [5, 1, 'C']]

export const robotCharacter: PetCharacter = {
  id: 'robot',
  palette: PALETTE,
  frames: {
    idle: [
      { grid: BASE, durationMs: 1600 },
      { grid: BASE, durationMs: 1600, offsetY: -2 },
      { grid: patch(BASE, BLINK), durationMs: 160 }
    ],
    running: [
      { grid: patch(BASE, [...DOT_1, ...PANEL_LEFT]), durationMs: 280 },
      { grid: patch(BASE, [...DOT_2, ...PANEL_RIGHT]), durationMs: 280, offsetY: -2 },
      { grid: patch(BASE, [...DOT_3, ...PANEL_LEFT]), durationMs: 420 }
    ],
    success: [
      { grid: patch(BASE, STAR_BIG), durationMs: 380, offsetY: -10 },
      { grid: patch(BASE, STAR_SMALL), durationMs: 380 }
    ],
    failure: [
      { grid: patch(BASE, FAIL_1), durationMs: 420, offsetY: 1 },
      { grid: patch(BASE, FAIL_2), durationMs: 420, offsetY: 2 }
    ]
  }
}
