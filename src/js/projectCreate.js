import { apiRequest, requireAuthentication } from './api.js'

const dialog = document.getElementById('newProjectDialog')
const form = document.getElementById('newProjectForm')
const message = document.getElementById('projectFormMessage')

document.getElementById('newProjectButton').addEventListener('click', () => {
  form.reset()
  message.textContent = ''
  dialog.showModal()
})

document.getElementById('closeProjectDialog').addEventListener('click', () => dialog.close())

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close()
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!requireAuthentication()) return
  const submit = form.querySelector('[type="submit"]')
  submit.disabled = true
  message.textContent = ''
  const data = new FormData(form)
  try {
    await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({
        title: data.get('title'),
        authors: data.get('authors'),
        website_url: data.get('website_url') || null,
        description: data.get('description') || null
      })
    })
    dialog.close()
    window.location.reload()
  } catch (error) {
    message.textContent = error.message
    message.classList.add('auth-message--error')
  } finally {
    submit.disabled = false
  }
})

document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
  window.location.replace('./index.html')
})
