import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/projekt-ertekelo/',

  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        projects: resolve(import.meta.dirname, 'projects.html'),
        project: resolve(import.meta.dirname, 'project.html')
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
