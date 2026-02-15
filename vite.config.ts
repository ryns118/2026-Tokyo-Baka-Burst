import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // IMPORTANT: Matches your GitHub repository name for correct asset loading
  base: '/2026-Tokyo-Baka-Burst/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})