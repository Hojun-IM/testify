import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 조건부 클래스를 합치고 Tailwind 유틸리티 충돌을 뒤에 온 값으로 정리한다.
 * shadcn ui가 생성하는 컴포넌트가 이 이름을 그대로 import한다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
