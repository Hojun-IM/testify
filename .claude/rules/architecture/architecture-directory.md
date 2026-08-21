# 디렉토리 구조

파일 위치만 보고도 "이 코드가 무슨 역할인지, 어느 프로세스에서 도는지"를 알 수 있어야 한다.

## 전체 구조

```
src/
├── main/                  # Electron 메인 프로세스 (Node.js 환경)
│   ├── index.ts           # 앱 엔트리, 생명주기
│   ├── windows/           # BrowserWindow 생성/관리
│   ├── ipc/               # ipcMain 핸들러 등록
│   ├── services/          # 도메인 로직 (파일 IO, DB, 외부 API)
│   └── lib/               # 메인 프로세스 전용 유틸
│
├── preload/               # 브릿지 (격리된 컨텍스트)
│   ├── index.ts           # contextBridge 노출
│   ├── index.d.ts         # window 타입 선언
│   └── api/               # 도메인별 API 정의
│
├── renderer/              # UI (브라우저 환경)
│   ├── index.html
│   └── src/
│       ├── main.tsx       # React 진입점
│       ├── App.tsx        # 최상위 컴포넌트
│       ├── app/           # 전역 설정 (프로바이더, 라우터, 전역 CSS)
│       ├── features/      # 기능(도메인) 단위 모듈  ← 대부분의 코드가 여기
│       ├── components/    # 여러 feature가 함께 쓰는 공용 UI
│       ├── hooks/         # 공용 훅
│       ├── stores/        # 전역 스토어 (feature에 속하지 않는 것만)
│       ├── lib/           # 순수 유틸 (React 비의존)
│       └── types/         # 공용 타입
│
└── shared/                # 세 프로세스가 함께 쓰는 코드 (IPC 채널 상수, DTO 타입)
```

## feature 디렉토리

기능 단위로 묶는다. 화면 하나 또는 하나의 도메인이 기준이다.

```
src/renderer/src/features/test-runner/
├── components/            # 이 기능에서만 쓰는 컴포넌트
│   ├── TestRunnerPanel.tsx
│   └── TestResultItem.tsx
├── hooks/                 # 이 기능의 로직 훅
│   └── useTestRunner.ts
├── stores/                # 이 기능의 상태
│   └── testRunnerStore.ts
├── api/                   # IPC 호출 래퍼
│   └── testRunnerApi.ts
├── model/                 # 타입, 상수, 순수 변환 함수
│   └── types.ts
└── index.ts               # 공개 API (배럴)
```

### 배치 판단 기준

1. **한 기능에서만 쓰는가** → 그 feature 안에 둔다. 기본값은 항상 이쪽이다.
2. **두 개 이상의 feature에서 쓰는가** → 공용(`components/`, `hooks/`, `lib/`)으로 올린다.
3. **세 프로세스가 함께 아는 값인가** (IPC 채널명, 요청/응답 타입) → `src/shared/`에 둔다.

처음부터 공용에 두지 않는다. 두 번째 사용처가 생겼을 때 옮긴다.

## 의존 방향

```
features/*  →  components/, hooks/, lib/, types/, shared/   (O)
components/, hooks/, lib/  →  features/*                    (X)
features/a  →  features/b                                   (X)
renderer  →  main 코드 직접 import                           (X, IPC로만)
```

- 공용 코드는 feature를 모른다. 공용에서 feature를 import하고 싶어지면 그 코드는 공용이 아니다.
- feature 간 참조가 필요하면 공통 부분을 공용으로 올리거나, 상위(`app/`, 페이지 컴포넌트)에서 조합한다.
- feature 외부에서는 `index.ts`가 내보낸 것만 쓴다. 내부 파일을 직접 import하지 않는다.

## 파일 네이밍

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| 컴포넌트 | PascalCase | `TestResultItem.tsx` |
| 훅 | camelCase, `use` 접두 | `useTestRunner.ts` |
| 스토어 | camelCase, `Store` 접미 | `testRunnerStore.ts` |
| 그 외 모듈 | camelCase | `formatDuration.ts` |
| 디렉토리 | kebab-case | `test-runner/` |
| 테스트 | 대상 파일명 + `.test` | `formatDuration.test.ts` |

- 파일 하나에 주 export 하나. 파일명과 주 export 이름을 일치시킨다.
- `index.ts`는 배럴 용도로만 쓴다. 여기에 로직을 넣지 않는다.
- `utils.ts`, `helpers.ts`, `common.ts` 같은 이름은 쓰지 않는다. 무엇을 하는지로 이름 짓는다.

## 경로 alias

```ts
import { Button } from '@renderer/components/Button'
import { IPC_CHANNEL } from '@shared/ipc'
```

- 같은 feature 안에서는 상대 경로(`./`, `../`)를 쓴다.
- feature 밖을 참조할 때는 alias를 쓴다. `../../../` 형태는 만들지 않는다.

## 도입 체크리스트

`src/shared/`와 React를 도입할 때 함께 갱신해야 하는 설정:

- `electron.vite.config.ts` → renderer `resolve.alias`에 `@shared` 추가, `@vitejs/plugin-react` 등록
- `tsconfig.node.json` → `include`에 `src/shared/**/*` 추가
- `tsconfig.web.json` → `include`에 `src/shared/**/*` 추가, `paths`에 `@shared/*` 추가
- `src/renderer/index.html` → 진입 스크립트를 `./src/main.tsx`로 변경
