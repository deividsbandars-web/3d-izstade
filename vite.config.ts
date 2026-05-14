import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

function resolveBuildStamp() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA ||
    (() => {
      try {
        return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
      } catch {
        return 'local'
      }
    })()

  const target = process.env.VERCEL_ENV ? `vercel-${process.env.VERCEL_ENV}` : 'local'
  return `${target}:${commit.slice(0, 12)}`
}

export default defineConfig({
  define: {
    global: 'window',
    __WARPALA_EXPO_BUILD_STAMP__: JSON.stringify(resolveBuildStamp()),
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
      '/api': 'http://localhost:3000',
      '/ws': {
        target: 'ws://localhost:3000',
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
