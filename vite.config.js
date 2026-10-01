import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 1000
    },
    base: '/projekt-ertekelo/'
  }
})
