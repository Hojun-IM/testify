/// <reference types="vite/client" />

// Electron <webview> 태그를 JSX에서 사용하기 위한 최소 선언
declare namespace JSX {
  interface IntrinsicElements {
    webview: import('react').DetailedHTMLProps<
      import('react').HTMLAttributes<HTMLElement> & {
        src?: string
        allowpopups?: string
      },
      HTMLElement
    >
  }
}
