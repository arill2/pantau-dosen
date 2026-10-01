import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // xlsx dan jspdf dimuat hanya saat admin menekan Ekspor (dynamic import),
    // jadi ukuran chunk-nya memang besar tetapi tidak masuk muatan awal.
    chunkSizeWarningLimit: 900,
  },
})
