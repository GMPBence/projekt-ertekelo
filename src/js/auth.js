import { apiRequest } from './api.js'
import '../css/style.css'

const forms = {
  login: document.getElementById('loginForm'),
  register: document.getElementById('registerForm'),
  recover: document.getElementById('recoverForm')
}
const title = document.getElementById('login-title')
const description = document.getElementById('auth-description')
const message = document.getElementById('authMessage')
let recoveryEmail = ''

const headings = {
  login: ['Üdv újra.', 'Jelentkezzen be a projektértékelő felületre!'],
  register: ['Hozd létre a fiókod.', 'Regisztrálj az értékelő használatához!'],
  recover: ['Jelszó visszaállítása.', 'Kérj időkorlátos helyreállító kódot emailben.']
}

function showMessage(text, isError = false) {
  message.textContent = text
  message.classList.toggle('auth-message--error', isError)
}

function setView(view) {
  Object.entries(forms).forEach(([name, form]) => {
    form.hidden = name !== view
  })
  title.textContent = headings[view][0]
  description.textContent = headings[view][1]
  showMessage('')
}

document.querySelectorAll('[data-auth-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.authView))
})

async function submitForm(form, path, body) {
  const submitButton = form.querySelector('button[type="submit"]')
  if (submitButton) submitButton.disabled = true
  showMessage('')
  try {
    const result = await apiRequest(path, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    if (result?.token) {
      localStorage.setItem('authToken', result.token)
      localStorage.setItem('currentUser', JSON.stringify(result.user))
      window.location.assign('./projects.html')
    }
    return result
  } catch (error) {
    showMessage(error.message, true)
    return null
  } finally {
    if (submitButton) submitButton.disabled = false
  }
}

forms.login.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(forms.login)
  await submitForm(forms.login, '/auth/login', {
    email: data.get('email'),
    password: data.get('password')
  })
})

forms.register.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(forms.register)
  await submitForm(forms.register, '/auth/register', {
    username: data.get('username'),
    email: data.get('email'),
    password: data.get('password')
  })
})

forms.recover.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(forms.recover)
  recoveryEmail = String(data.get('email')).trim()
  const result = await submitForm(forms.recover, '/auth/recover', { email: recoveryEmail })
  if (result) {
    document.getElementById('recoverRequestFields').hidden = true
    document.getElementById('recoverFinishFields').hidden = false
    showMessage('Ha az email címhez tartozik fiók, elküldtük a kódot. 15 percig használható.')
  }
})

document.getElementById('completeRecovery').addEventListener('click', async () => {
  const token = document.getElementById('recoverToken').value.trim()
  const password = document.getElementById('recoverPassword').value
  if (!/^\d{9}$/.test(token) || password.length < 8) {
    showMessage('Adj meg egy érvényes 9 jegyű kódot és legalább 8 karakteres jelszót.', true)
    return
  }
  const result = await submitForm(forms.recover, '/auth/recover/complete', {
    email: recoveryEmail,
    token,
    password
  })
  if (result) {
    document.getElementById('recoverRequestFields').hidden = false
    document.getElementById('recoverFinishFields').hidden = true
    forms.recover.reset()
    setView('login')
    showMessage('A jelszavad frissült. Most már bejelentkezhetsz.')
  }
})

if (localStorage.getItem('authToken')) {
  window.location.replace('./projects.html')
}
