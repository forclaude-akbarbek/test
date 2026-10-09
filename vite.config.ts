import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works on any static host (Vercel, GitHub Pages, preview links).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 1200 },
})
