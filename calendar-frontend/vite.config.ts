/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simuloi selainta, jotta komponentteja voi testata ilman oikeaa selainta
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
