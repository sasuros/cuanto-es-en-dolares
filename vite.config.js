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
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,svg,ico}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/ve\.dolarapi\.com/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\/api\/usdt$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'usdt-api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 3,
                  maxAgeSeconds: 5 * 60
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(js|css|png|svg|ico|woff2?)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 7 * 24 * 60 * 60
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
      strictPort: false,
      proxy: {
        '/api/usdt': {
          target: 'https://api.cotizave.com',
          changeOrigin: true,
          rewrite: () => '/v1/fx/rates',
          headers: {
            'X-API-Key': process.env.COTIZAVE_API_KEY || '',
            'Accept': 'application/json'
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2018'
    }
  }
})
