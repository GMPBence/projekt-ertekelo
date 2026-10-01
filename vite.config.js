import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/projekt-ertekelo/',

  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'projects.html'),
        project: resolve(__dirname, 'project.html')
      }
    }
  },

  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
})
