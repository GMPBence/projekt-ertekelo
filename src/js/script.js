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
document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = byId(button.getAttribute('aria-controls'))
    const visible = input.type === 'password'
    input.type = visible ? 'text' : 'password'
    button.setAttribute('aria-pressed', String(visible))
    button.setAttribute('aria-label', visible ? 'Jelszó elrejtése' : 'Jelszó megjelenítése')
    button.dataset.visible = String(visible)
  })
})
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
if (byId('publishSuccessDialog')) {
  const dialog = byId('publishSuccessDialog')
  dialog.querySelectorAll('[data-close-publish-success]').forEach((button) => button.addEventListener('click', () => dialog.close()))
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close() })
}
let snakePassForm = null, pendingPublish = null, startSnakeGame = () => {}
if (byId('snakeDialog')) {
  const dialog = byId('snakeDialog'), board = byId('snakeBoard'), scoreLabel = byId('snakeScore'), status = byId('snakeStatus'), restartButton = dialog.querySelector('[data-restart-snake]')
  const boardSize = 20, targetScore = 10, cells = [], directions = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }
  }
  let snake = [], food = null, direction = directions.right, nextDirection = direction, score = 0, timer = null, gameOver = false, turnQueued = false
  for (let y = 0; y < boardSize; y += 1) {
    const row = document.createElement('div')
    row.className = 'snake-board__row'
    row.setAttribute('role', 'row')
    for (let x = 0; x < boardSize; x += 1) {
      const cell = document.createElement('span')
      cell.className = 'snake-board__cell'
      cell.setAttribute('role', 'gridcell')
      row.append(cell)
      cells.push(cell)
    }
    board.append(row)
  }
  const render = () => {
    cells.forEach((cell) => { cell.className = 'snake-board__cell' })
    snake.forEach(({ x, y }, index) => cells[y * boardSize + x].classList.add(index === 0 ? 'snake-board__cell--head' : 'snake-board__cell--snake'))
    if (food) cells[food.y * boardSize + food.x].classList.add('snake-board__cell--food')
  }
  const placeFood = () => {
    const available = []
    for (let y = 0; y < boardSize; y += 1) {
      for (let x = 0; x < boardSize; x += 1) {
        if (!snake.some((part) => part.x === x && part.y === y)) available.push({ x, y })
      }
    }
    return available[Math.floor(Math.random() * available.length)]
  }
  const setDirection = (candidate) => {
    if (turnQueued || (candidate.x === direction.x && candidate.y === direction.y)) return
    if (candidate.x !== -direction.x || candidate.y !== -direction.y) {
      nextDirection = candidate
      turnQueued = true
    }
  }
  const stop = () => { window.clearInterval(timer); timer = null }
  const finish = () => {
    stop()
    gameOver = true
    dialog.dataset.state = 'over'
    status.textContent = 'Vége a játéknak. Próbáld újra, hogy elérd a 10 pontot!'
    restartButton.hidden = false
  }
  const win = () => {
    stop()
    dialog.dataset.state = 'won'
    status.textContent = 'Szép munka! Az értékelés közzététele most már folytatódik.'
    dialog.close()
    const submission = pendingPublish
    pendingPublish = null
    if (submission?.form.isConnected) {
      snakePassForm = submission.form
      submission.form.requestSubmit(submission.button)
    }
  }
  const tick = () => {
    direction = nextDirection
    turnQueued = false
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y }
    if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize) return finish()
    const eating = head.x === food.x && head.y === food.y
    const body = eating ? snake : snake.slice(0, -1)
    if (body.some((part) => part.x === head.x && part.y === head.y)) return finish()
    snake.unshift(head)
    if (eating) {
      score += 1
      scoreLabel.textContent = String(score)
      if (score >= targetScore) {
        render()
        return win()
      }
      food = placeFood()
    } else {
      snake.pop()
    }
    render()
  }
  const start = () => {
    stop()
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }]
    direction = nextDirection = directions.right
    turnQueued = false
    score = 0
    gameOver = false
    food = placeFood()
    scoreLabel.textContent = '0'
    status.textContent = 'A játék indul!'
    restartButton.hidden = true
    dialog.dataset.state = 'playing'
    render()
    timer = window.setInterval(tick, 125)
  }
  startSnakeGame = start
  const directionKeys = { ArrowUp: 'up', w: 'up', W: 'up', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left' }
  document.addEventListener('keydown', (event) => {
    if (!dialog.open || gameOver) return
    const keyDirection = directionKeys[event.key]
    if (!keyDirection) return
    event.preventDefault()
    setDirection(directions[keyDirection])
  })
  dialog.querySelectorAll('[data-snake-direction]').forEach((button) => {
    button.addEventListener('click', () => setDirection(directions[button.dataset.snakeDirection]))
  })
  dialog.querySelectorAll('[data-close-snake]').forEach((button) => button.addEventListener('click', () => dialog.close()))
  dialog.querySelector('[data-restart-snake]').addEventListener('click', start)
  dialog.addEventListener('close', stop)
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close() })
  dialog.addEventListener('cancel', stop)
  dialog.addEventListener('close', () => { if (dialog.dataset.state !== 'won') pendingPublish = null })
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
  const usesAiVersion = form.querySelector('[name="evaluationVersion"]:checked')?.value === 'ai'
  delete data.evaluationVersion
  if (form.id === 'recoverCompleteForm' && data.password !== data.confirmPassword) return message(status, 'A két jelszó nem egyezik.', true)
  delete data.confirmPassword
  if (form.id === 'registerForm') data.username = data.username.trim()
  form.querySelectorAll('[data-number]').forEach((field) => { if (data[field.name]) data[field.name] = Number(data[field.name]) })
  if (data.published !== undefined) data.published = data.published === 'true'
  if (form.hasAttribute('data-evaluation') && data.published && ['grade', 'theme', 'design', 'animations', 'javascript'].some((key) => !data[key])) {
    return message(status, 'Közzététel előtt válassz pontszámot minden kritériumhoz és érdemjegyet.', true)
  }
  const passedSnake = snakePassForm === form
  if (passedSnake) snakePassForm = null
  if (form.hasAttribute('data-evaluation') && data.published && usesAiVersion && !passedSnake) {
    const dialog = byId('snakeDialog')
    if (!dialog) return message(status, 'A közzétételi játék nem tölthető be. Frissítsd az oldalt, és próbáld újra.', true)
    pendingPublish = { form, button }
    message(status, '')
    dialog.showModal()
    startSnakeGame()
    return
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
    if (form.hasAttribute('data-evaluation') && data.published) byId('publishSuccessDialog')?.showModal()
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
