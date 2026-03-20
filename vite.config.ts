import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Platformu Centrs',
        short_name: 'PCentrs',
        description: 'Būvniecības Metaversa Izstāde un PRO Kalkulatori',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000
      },
      devOptions: {
        enabled: false // IZSLEEDZAM CACHING IZSTRĀDES LAIKĀ!!!
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost',
      '/ws': {
        target: 'ws://localhost',
        ws: true
      }
    }
  }
})