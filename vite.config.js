import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon.svg'],
        manifest: {
          name: '¿Cuánto es en Dólares?',
          short_name: 'En Dólares',
          description: 'Convierte bolívares a dólares en tiempo real con la tasa del BCV.',
          lang: 'es',
          theme_color: '#2ECC71',
          background_color: '#FFFFFF',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,ico}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/ve\.dolarapi\.com\/v1\/dolares$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'bcv-api-cache-v2',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    server: {
      port: Number(process.env.PORT) || 5173,
      host: true,
      open: false,
      strictPort: false
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2018'
    }
  }
})
