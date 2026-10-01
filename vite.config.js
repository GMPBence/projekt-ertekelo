import { defineConfig } from 'vite'

export default defineConfig({
  base: '/projekt-ertekelo/',
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
})
