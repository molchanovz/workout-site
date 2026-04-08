import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/v1\//,
              handler: 'NetworkFirst',
              options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 }
            }
          ]
        },
        manifest: {
          name: 'Training Calendar',
          short_name: 'Workout',
          start_url: '/app',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#111827',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        devOptions: { enabled: true }
      })
    ],
    server: {
      port: 5173,
      allowedHosts: ['mailable-supernaturally-marlana.ngrok-free.dev'],
      proxy: {
        '/auth': {
          target: env.VITE_API_URL.replace(/\/$/, ''),
          changeOrigin: true
        }
      }
    }
  }
})