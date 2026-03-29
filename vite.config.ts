import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/api\.nytimes\.com\/svc\/books\/v3\/lists\/.*\.json(\?.*)?$/,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nyt-books-api-v1',
              networkTimeoutSeconds: 4,
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 604800,
                purgeOnQuotaError: true
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            method: 'GET',
            handler: 'CacheFirst',
            options: {
              cacheName: 'nyt-books-images-v1',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 2592000,
                purgeOnQuotaError: true
              }
            }
          }
        ]
      },
      manifest: {
        id: '/',
        name: 'NYT Books Mass Market Paperback',
        short_name: 'NYT Books',
        description: 'Top books from NYT Mass Market Paperback list',
        theme_color: '#2596be',
        background_color: '#2596be',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})
