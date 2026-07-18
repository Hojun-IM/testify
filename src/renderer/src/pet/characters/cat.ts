import type { PetCharacter, PixelEdit } from './types'
import { patch } from './types'

// 기본 캐릭터 — 앉아 있는 고양이형 블롭 (아이보리 톤, 앱 테마와 맞춤)

const PALETTE: Record<string, string> = {
  E: '#33302b', // 외곽선/눈/입
  B: '#ece3d2', // 몸통 (아이보리)
  S: '#cfc4ab', // 감은 눈/음영
  P: '#e8a3a0', // 볼터치
  Y: '#f2c94c', // 성공 별
  R: '#d96c6c', // 실패 X
  C: '#7fb8d9' // 진행 점/땀방울
}

const BASE: string[] = [
  '................',
  '..E..........E..',
  '.EBE........EBE.',
  '.EBBE......EBBE.',
  '.EBBBEEEEEEBBBE.',
  '.EBBBBBBBBBBBBE.',
  'EBBBBBBBBBBBBBBE',
  'EBBEBBBBBBBBEBBE',
  'EBBBBBBEEBBBBBBE',
  'EBPBBBBBBBBBBPBE',
  'EBBBBBBBBBBBBBBE',
  '.EBBBBBBBBBBBBE.',
  '.EBBBBBBBBBBBBE.',
  '..EBBBEEEEBBBE..',
  '...EEE....EEE...',
  '................'
]

// 눈 감기 (깜빡임)
const BLINK: PixelEdit[] = [
  [7, 2, 'S'],
  [7, 3, 'S'],
  [7, 4, 'S'],
  [7, 11, 'S'],
  [7, 12, 'S'],
  [7, 13, 'S']
]

// 실행 중 — 머리 위 말풍선 점이 하나씩 늘어난다
const DOT_1: PixelEdit[] = [[0, 8, 'C']]
const DOT_2: PixelEdit[] = [...DOT_1, [0, 10, 'C']]
const DOT_3: PixelEdit[] = [...DOT_2, [0, 12, 'C']]

// 성공 — 머리 위 별이 반짝인다 + 입이 웃는 모양으로 넓어진다
const SMILE: PixelEdit[] = [
  [8, 6, 'E'],
  [8, 9, 'E']
]
const STAR_BIG: PixelEdit[] = [
  ...SMILE,
  [0, 8, 'Y'],
  [1, 7, 'Y'],
  [1, 8, 'Y'],
  [1, 9, 'Y'],
  [2, 8, 'Y']
]
const STAR_SMALL: PixelEdit[] = [
  ...SMILE,
  [1, 8, 'Y'],
  [0, 11, 'Y'],
  [2, 5, 'Y']
]

// 실패 — 머리 옆 붉은 X + 땀방울이 흘러내린다
const CROSS: PixelEdit[] = [
  [0, 11, 'R'],
  [0, 13, 'R'],
  [1, 12, 'R'],
  [2, 11, 'R'],
  [2, 13, 'R']
]
const FAIL_1: PixelEdit[] = [...CROSS, [5, 14, 'C']]
const FAIL_2: PixelEdit[] = [...CROSS, [6, 14, 'C']]

export const catCharacter: PetCharacter = {
  id: 'cat',
  palette: PALETTE,
  frames: {
    idle: [
      { grid: BASE, durationMs: 1500 },
      { grid: BASE, durationMs: 1500, offsetY: -3 },
      { grid: patch(BASE, BLINK), durationMs: 140 }
    ],
    running: [
      { grid: patch(BASE, DOT_1), durationMs: 280 },
      { grid: patch(BASE, DOT_2), durationMs: 280, offsetY: -3 },
      { grid: patch(BASE, DOT_3), durationMs: 420 }
    ],
    success: [
      { grid: patch(BASE, STAR_BIG), durationMs: 380, offsetY: -10 },
      { grid: patch(BASE, STAR_SMALL), durationMs: 380 }
    ],
    failure: [
      { grid: patch(BASE, FAIL_1), durationMs: 420, offsetY: 2 },
      { grid: patch(BASE, FAIL_2), durationMs: 420, offsetY: 3 }
    ]
  }
}
