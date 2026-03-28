import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    global: 'window',
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  resolve: {
    alias: {
      ioredis: '/src/shims/ioredis-browser.ts',
    },
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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/three/') ||
              id.includes('@react-three') ||
              id.includes('three-stdlib') ||
              id.includes('@pmndrs') ||
              id.includes('troika-') ||
              id.includes('suspend-react')
            ) {
              return 'three-vendor'
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('react-router') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor'
            }

            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }

            if (id.includes('@stripe') || id.includes('/stripe/')) {
              return 'stripe-vendor'
            }
          }

          return undefined
        }
      }
    }
  }
})
