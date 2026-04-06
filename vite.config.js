import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue()],
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