import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/projekt-ertekelo/',

  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        projects: resolve(import.meta.dirname, 'projects.html'),
        project: resolve(import.meta.dirname, 'project.html'),
        recover: resolve(import.meta.dirname, 'recover.html'),
        register: resolve(import.meta.dirname, 'register.html'),
        recoverReset: resolve(import.meta.dirname, 'recover-reset.html')
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
