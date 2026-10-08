import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages などのサブディレクトリにも置けるように相対パスで出力する
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'けいさん ちゃれんじ',
        short_name: 'けいさん',
        description: '小学1・2年生のための計算練習アプリ',
        lang: 'ja',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fff7e6',
        theme_color: '#fff7e6',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 日本語フォントは分割されたファイルが多いので、すべてキャッシュしてオフラインでも使えるようにする
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
