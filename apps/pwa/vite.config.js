import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/game/core', import.meta.url)),
      '@systems': fileURLToPath(new URL('./src/game/systems', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/game/data', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url))
    }
  },
  build: {
    target: 'es2022'
  },
  server: {
    port: 5173,
    open: false
  }
});
