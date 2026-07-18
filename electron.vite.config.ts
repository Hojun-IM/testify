import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // index: 메인 창 preload, pet: 데스크톱 펫 창 preload
        input: {
          index: resolve('src/preload/index.ts'),
          pet: resolve('src/preload/pet.ts')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs'
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        // index: 메인 앱, pet: 데스크톱 펫 창 (투명한 소형 창에 뜨는 별도 페이지)
        input: {
          index: resolve('src/renderer/index.html'),
          pet: resolve('src/renderer/pet.html')
        }
      }
    }
  }
})
