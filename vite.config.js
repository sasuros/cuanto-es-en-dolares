import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Carga TODAS las env vars (incluyendo BCV_API_KEY sin prefijo VITE_).
  // Solo se usa en este archivo, NO se inyecta al bundle del cliente.
  const env = loadEnv(mode, process.cwd(), '')

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
              urlPattern: /\/api\/bcv$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'bcv-api-cache',
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
      strictPort: false,
      proxy: {
        // En dev: simula la Netlify Function inyectando la key server-side.
        // En prod: este proxy no existe (lo reemplaza la función en /api/bcv).
        '/api/bcv': {
          target: 'https://bcvapi.tech',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bcv/, '/api/v1/dolar'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.BCV_API_KEY) {
                proxyReq.setHeader('Authorization', env.BCV_API_KEY)
              }
            })
            proxy.on('error', (err) => {
              console.error('[vite-proxy /api/bcv]', err.message)
            })
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
