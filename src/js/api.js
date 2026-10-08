import '@fontsource/manrope'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource-variable/space-grotesk'
import '../css/style.css'
import '../css/sidebar.css'

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}`.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('authToken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser')
      window.location.assign('./index.html')
    }
    throw new ApiError(payload?.error || 'A kérés nem sikerült. Próbáld újra.', response.status)
  }

  return payload
}

export function requireAuthentication() {
  if (!localStorage.getItem('authToken')) {
    window.location.replace('./index.html')
    return false
  }
  return true
}
