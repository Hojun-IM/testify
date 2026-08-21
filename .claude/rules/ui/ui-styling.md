# 스타일링 컨벤션

Tailwind CSS를 쓴다. 스타일은 마크업 옆에 두고, 커스텀 CSS는 최소로 유지한다.

## 기본 원칙

- 스타일은 클래스로 작성한다. 인라인 `style`은 런타임 계산값(동적 위치, 진행률 너비)에만 쓴다.
- 색상, 간격, 폰트 크기는 Tailwind 스케일을 쓴다. `w-[137px]` 같은 임의값은 예외적으로만 쓰고, 반복되면 테마에 등록한다.
- 값이 아니라 의미로 정한다. 브랜드 색은 `bg-blue-500`이 아니라 테마에 `primary`로 등록해 `bg-primary`로 쓴다.

## 클래스 정렬

Tailwind 권장 순서를 따른다. 레이아웃 → 크기 → 여백 → 타이포 → 색 → 테두리 → 효과 → 상태.

```tsx
<button className="flex items-center gap-2 h-9 px-3 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50">
```

- 상태 변형(`hover:`, `focus:`, `disabled:`)은 기본 스타일 뒤에 모은다.
- 반응형(`sm:`, `md:`)은 작은 화면 기준을 먼저 쓰고 뒤에 덧붙인다.

## 클래스가 길어질 때

한 요소의 클래스가 길어지는 것 자체는 문제가 아니다. 문제는 **같은 조합이 반복될 때**다.

1. 같은 조합이 3번째 등장 → 컴포넌트로 추출한다 (`<Button variant="primary">`)
2. `@apply`로 CSS 클래스를 만드는 방식은 쓰지 않는다. 컴포넌트로 뽑는 쪽이 타입 안전하고 찾기 쉽다.

## 조건부 클래스

문자열을 직접 이어붙이지 않는다. `clsx`(또는 `cn` 유틸)로 조합한다.

```tsx
<li className={cn('px-3 py-2 rounded', isSelected && 'bg-primary/10', isDisabled && 'opacity-50')} />
```

- 변형(variant)이 3개를 넘으면 매핑 객체로 정리한다.

```tsx
const STATUS_STYLE: Record<TestStatus, string> = {
  idle: 'text-gray-500 bg-gray-100',
  running: 'text-blue-600 bg-blue-50',
  passed: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50'
}
```

## 전역 CSS

`src/renderer/src/app/index.css` 한 곳만 둔다. 여기에 들어가는 것:

- Tailwind 지시어
- CSS 변수(테마 토큰)
- `body`, 스크롤바, 폰트 같은 앱 전역 기본값

컴포넌트별 CSS 파일은 만들지 않는다. Tailwind로 표현할 수 없는 경우(복잡한 키프레임, 서드파티 라이브러리 오버라이드)에만 전역 CSS에 이름을 붙여 추가하고 주석으로 이유를 남긴다.

## Electron 관련

- 데스크톱 앱이므로 모바일 반응형은 기본 고려 대상이 아니다. 창 최소 너비를 기준으로 레이아웃을 짠다.
- 드래그 가능한 타이틀바 영역은 `app-region: drag`가 필요하다. 전역 CSS에 유틸 클래스로 정의해 쓴다.
- 다크 모드를 지원한다면 `dark:` 변형과 OS 테마(`nativeTheme`)를 연결한다. 색을 한 번이라도 하드코딩하면 다크 모드에서 깨진다.

## 접근성

- 클릭 가능한 요소는 `div`가 아니라 `button` / `a`를 쓴다.
- 아이콘만 있는 버튼에는 `aria-label`을 붙인다.
- 포커스 링을 제거하지 않는다. 바꿔야 하면 `focus-visible:ring-*`로 대체한다.
- 색만으로 상태를 구분하지 않는다. 아이콘이나 텍스트를 함께 쓴다.

## 도입 체크리스트

- `npm i -D tailwindcss @tailwindcss/vite`, `npm i clsx`
- `electron.vite.config.ts`의 renderer plugins에 Tailwind 플러그인 등록
- `src/renderer/src/app/index.css` 생성 후 `main.tsx`에서 import
- 테마 토큰(색, 폰트, 간격)을 CSS 변수로 먼저 정의하고 시작한다
