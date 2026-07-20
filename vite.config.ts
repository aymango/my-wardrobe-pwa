import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
        manifest: {
          name: 'Мой гардероб',
          short_name: 'Гардероб',
          description: 'Личный цифровой гардероб, образы и идеи',
          theme_color: '#69C9C3',
          background_color: '#FAFAF8',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: base,
          scope: base,
          lang: 'ru',
          icons: [
            {
              src: `${base}pwa-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: `${base}pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-runtime',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24
                }
              }
            }
          ]
        }
      })
    ]
  }
})
