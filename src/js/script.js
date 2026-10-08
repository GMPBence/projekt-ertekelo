const API = (import.meta.env.VITE_API_URL || 'https://projectapi.rabbence.eu/api/v1').replace(/\/$/, ''), token = () => localStorage.getItem('authToken')
const user = JSON.parse(localStorage.getItem('currentUser') || '{}'), byId = (id) => document.getElementById(id)
const request = async (path, options = {}) => {
  const response = await fetch(API + path, { ...options, headers: { ...(options.body && { 'Content-Type': 'application/json' }), ...(token() && { Authorization: `Bearer ${token()}` }) } })
  const result = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token()) { localStorage.removeItem('authToken'); localStorage.removeItem('currentUser'); location.assign('./index.html') }
    throw Error(result?.error || 'A kérés nem sikerült. Próbáld újra.')
  }
  return result
}
const requireAuth = () => token() || (location.replace('./index.html'), false)
const message = (element, text, error = false) => {
  if (!element) return
  element.textContent = text; element.classList.toggle('auth-message--error', error); element.classList.toggle('evaluation-message--error', error)
}
if (byId('registerForm')) {
  const form = byId('registerForm'), username = byId('registerUsername'), email = byId('registerEmail'), password = byId('registerPassword')
  const validate = () => {
    const usernameLength = Array.from(username.value.trim()).length, emailBytes = new TextEncoder().encode(email.value.trim()).length, passwordBytes = new TextEncoder().encode(password.value).length
    username.setCustomValidity(username.value && (usernameLength < 3 || usernameLength > 50) ? 'A felhasználónév 3–50 karakter legyen.' : '')
    email.setCustomValidity(email.value && emailBytes > 254 ? 'Az email cím legfeljebb 254 bájt lehet.' : '')
    password.setCustomValidity(password.value && passwordBytes > 72 ? 'A jelszó legfeljebb 72 bájt lehet.' : '')
  }
  form.addEventListener('input', validate)
  validate()
}
if (byId('loginForm') && token()) location.replace('./projects.html')
if (byId('recoverFinishEmail')) byId('recoverFinishEmail').value = new URLSearchParams(location.search).get('email') || ''
if (byId('recoverPasswordConfirm')) {
  const password = byId('recoverPassword'), confirmation = byId('recoverPasswordConfirm')
  const validatePasswords = () => confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'A két jelszó nem egyezik.')
  password.addEventListener('input', validatePasswords); confirmation.addEventListener('input', validatePasswords)
}
if (byId('projectDialog')) {
  const dialog = byId('projectDialog')
  byId('openProjectDialog').addEventListener('click', () => dialog.showModal())
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close() })
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dialog.close() })
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && dialog.open) dialog.close() })
  dialog.querySelectorAll('[data-close-project-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()))
}
if (byId('currentUsername')) {
  byId('currentUsername').textContent = user.username || 'Felhasználó'; document.querySelector('.sidebar__content__footer .avatar').textContent = (user.username || 'F').slice(0, 1).toLocaleUpperCase('hu')
}
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-logout]')) { localStorage.removeItem('authToken'); localStorage.removeItem('currentUser') }
})
document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-api]'); if (!form) return
  event.preventDefault()
  const status = form.querySelector('[role="status"]'), button = event.submitter || form.querySelector('[type="submit"]')
  const data = Object.fromEntries(new FormData(form, event.submitter).entries())
  if (form.id === 'recoverCompleteForm' && data.password !== data.confirmPassword) return message(status, 'A két jelszó nem egyezik.', true)
  delete data.confirmPassword
  if (form.id === 'registerForm') data.username = data.username.trim()
  form.querySelectorAll('[data-number]').forEach((field) => { if (data[field.name]) data[field.name] = Number(data[field.name]) })
  if (data.published !== undefined) data.published = data.published === 'true'
  if (form.hasAttribute('data-evaluation') && data.published && ['grade', 'theme', 'design', 'animations', 'javascript'].some((key) => !data[key])) {
    return message(status, 'Közzététel előtt válassz pontszámot minden kritériumhoz és érdemjegyet.', true)
  }
  button.disabled = true
  message(status, '')
  try {
    const path = form.dataset.api.replace('{projectId}', new URLSearchParams(location.search).get('id') || '')
    const result = await request(path, { method: form.dataset.method || 'POST', body: JSON.stringify(data) })
    if (form.id === 'registerForm' && (!result?.token || !result.user)) throw Error('A regisztráció nem fejeződött be: a szerver válasza hiányos. Próbáld újra később.')
    if (result?.token) {
      localStorage.setItem('authToken', result.token); localStorage.setItem('currentUser', JSON.stringify(result.user))
      return location.assign('./projects.html')
    }
    if (form.dataset.redirect) {
      const target = new URL(form.dataset.redirect, location.href)
      if (form.dataset.redirectEmail) target.searchParams.set('email', data[form.dataset.redirectEmail])
      return location.assign(target.href)
    }
    message(status, form.dataset.success || (form.hasAttribute('data-evaluation') ? data.published ? 'Az értékelés közzétéve.' : 'A vázlat mentése sikerült.' : result?.message || 'Mentés sikerült.'))
    if (data.published) { byId('projectStatus')?.classList.replace('badge--orange', 'badge--green'); if (byId('projectStatus')) byId('projectStatus').textContent = 'Értékelve' }
    if (form.hasAttribute('data-reset-on-success')) form.reset()
    if (form.hasAttribute('data-reload-on-success')) {
      if (form.id === 'newProjectForm') form.closest('dialog')?.close()
      location.reload()
    }
  } catch (error) {
    message(status, error instanceof TypeError ? 'Nem sikerült kapcsolódni a szerverhez. Ellenőrizd a kapcsolatot, majd próbáld újra.' : error.message || 'Váratlan hiba történt. Próbáld újra.', true)
  }
  finally { if (button.isConnected) button.disabled = false }
})
if (byId('statsList') && requireAuth()) {
  request('/projects').then(({ projects }) => {
    const evaluated = projects.filter(({ evaluation }) => evaluation?.published), average = evaluated.length ? (evaluated.reduce((sum, item) => sum + item.evaluation.grade, 0) / evaluated.length).toFixed(1).replace('.', ',') : '–'
    ;[['Összes projekt', projects.length], ['Értékelt', evaluated.length], ['Várakozik', projects.length - evaluated.length], ['Átlagjegy', average]].forEach(([label, value]) => {
      const card = document.createElement('div'); card.className = 'stat-card'; card.innerHTML = '<p class="stat-card__label"></p><h3 class="stat-card__value"></h3>'
      card.children[0].textContent = label; card.children[1].textContent = value; byId('statsList').append(card)
    })
    projects.forEach((project) => {
      const row = byId('projectRowTemplate').content.firstElementChild.cloneNode(true), done = Boolean(project.evaluation?.published)
      row.querySelector('h4').textContent = project.title; row.querySelector('.submissions__project p').textContent = project.authors
      row.querySelector('.badge').textContent = done ? 'Értékelve' : 'Értékelésre vár'; row.querySelector('.badge').classList.add(done ? 'badge--green' : 'badge--orange')
      row.querySelector('.grade').textContent = done ? project.evaluation.grade : '–'; row.querySelector('.grade').classList.add(done ? 'grade--filled' : 'grade--empty')
      const href = `./project.html?id=${encodeURIComponent(project.id)}`
      row.querySelectorAll('a').forEach((link) => { link.href = href })
      row.querySelector('.submissions__cell--action a').textContent = 'Megnyitás →'; row.querySelector('.submissions__mobile-link').textContent = 'Projekt megnyitása →'
      byId('submissionsRows').append(row)
    })
    byId('submissionsCount').textContent = `${projects.length} projekt`
  }).catch((error) => { message(byId('submissionsCount'), error.message, true) })
}
if (byId('evaluationForm') && requireAuth()) {
  const showError = (error) => message(byId('projectLoadMessage'), error.message, true), projectId = new URLSearchParams(location.search).get('id'); (projectId ? request(`/projects/${encodeURIComponent(projectId)}`) : Promise.reject(Error('A projekt azonosítója hiányzik. Térj vissza a projektekhez.'))).then((project) => {
    byId('project_name').textContent = project.title; byId('projectAuthors').textContent = project.authors; document.title = `${project.title} – Értékelő`
    const url = byId('websiteUrl'), frame = document.querySelector('.project-viewer iframe'), viewer = document.querySelector('.project-viewer')
    if (project.website_url) { url.value = project.website_url; frame.src = project.website_url }
    url.addEventListener('change', () => {
      try { const next = new URL(/^https?:\/\//i.test(url.value) ? url.value : `https://${url.value}`); if (!['http:', 'https:'].includes(next.protocol)) throw Error(); url.value = frame.src = next.href }
      catch { showError(Error('Adj meg érvényes http vagy https webcímet.')) }
    })
    byId('refreshButton').addEventListener('click', () => { if (frame.src !== 'about:blank') frame.src = frame.src })
    byId('fullscreenButton').addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await viewer.requestFullscreen() }
      catch { showError(Error('A teljes képernyős nézet nem érhető el.')) }
    })
    document.addEventListener('fullscreenchange', () => byId('fullscreenButton').classList.toggle('is-active', Boolean(document.fullscreenElement)))
    const evaluation = project.evaluation
    if (evaluation) {
      ;['grade', 'theme', 'design', 'animations', 'javascript'].forEach((name) => { const input = document.querySelector(`[name="${name}"][value="${evaluation[name]}"]`); if (input) input.checked = true })
      document.querySelector('[name="feedback"]').value = evaluation.feedback || ''
      if (evaluation.published) { byId('projectStatus').textContent = 'Értékelve'; byId('projectStatus').classList.replace('badge--orange', 'badge--green'); document.querySelector('.evaluation-visibility').textContent = 'Közzétéve' }
    }
    const update = () => {
      const scores = ['theme', 'design', 'animations', 'javascript'].map((name) => document.querySelector(`[name="${name}"]:checked`)).filter(Boolean).map((input) => Number(input.value))
      const sum = scores.reduce((total, score) => total + score, 0)
      byId('criteriaScore').textContent = scores.length ? (sum / scores.length).toFixed(1) : '0.0'
      byId('averageScore').textContent = scores.length ? Math.round(sum / scores.length) : '–'
    }
    byId('evaluationForm').addEventListener('change', update); update()
  }).catch(showError)
}
