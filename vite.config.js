import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
            urlPattern: /^https:\/\/bcvapi\.tech\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bcv-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
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
      // Evita CORS proxeando la API BCV a través del dev server.
      // En producción, Netlify hace lo mismo vía netlify.toml.
      '/api/bcv': {
        target: 'https://bcvapi.tech',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bcv/, '/api/v1/dolar')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2018'
  }
})
