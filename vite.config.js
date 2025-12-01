import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: 'chrome',
    // Proxy /api requests to the backend (Kestrel) to avoid SPA HTML being returned
    proxy: {
      '/api': {
        target: 'http://localhost:5238',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet']
  }
})
