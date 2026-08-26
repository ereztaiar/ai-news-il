import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  base: '/ai-news-il/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@components': path.resolve(srcDir, 'components'),
      '@hooks': path.resolve(srcDir, 'hooks'),
      '@utils': path.resolve(srcDir, 'utils'),
      '@': srcDir,
    },
  },
})
