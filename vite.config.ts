import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 2222,
    proxy: {
      '/api': {
        target: 'http://localhost:2223',
        changeOrigin: true,
      },
    },
  },
})
