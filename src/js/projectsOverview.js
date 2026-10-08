import { apiRequest, requireAuthentication } from './api.js'
import { showPageLoader, hidePageLoader } from './loader.js'

const BADGE_CLASS_BY_STATUS = {
  evaluated: 'badge--green',
  pending: 'badge--orange'
}

function renderStats(projects) {
  const evaluated = projects.filter((project) => project.evaluation?.published)
  const scores = evaluated.map((project) => project.evaluation.grade)
  const average = scores.length
    ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1).replace('.', ',')
    : '–'
  const stats = [
    { label: 'Összes projekt', value: String(projects.length) },
    { label: 'Értékelt', value: String(evaluated.length) },
    { label: 'Várakozik', value: String(projects.length - evaluated.length) },
    { label: 'Átlagjegy', value: average }
  ]
  const container = document.getElementById('statsList')
  container.replaceChildren()

  stats.forEach(({ label, value }) => {
    const card = document.createElement('div')
    card.className = 'stat-card'
    const caption = document.createElement('p')
    caption.className = 'stat-card__label'
    caption.textContent = label
    const number = document.createElement('h3')
    number.className = 'stat-card__value'
    number.textContent = value
    card.append(caption, number)
    container.append(card)
  })
}

function renderProjects(projects) {
  const rowsContainer = document.getElementById('submissionsRows')
  rowsContainer.replaceChildren()

  projects.forEach((project) => {
    const evaluation = project.evaluation
    const isEvaluated = Boolean(evaluation?.published)
    const row = document.createElement('div')
    row.className = 'submissions__row'

    const projectDetails = document.createElement('div')
    projectDetails.className = 'submissions__project'
    const title = document.createElement('h4')
    title.textContent = project.title
    const authors = document.createElement('p')
    authors.textContent = project.authors
    projectDetails.append(title, authors)

    const statusCell = document.createElement('div')
    statusCell.className = 'submissions__cell submissions__cell--status'
    const badge = document.createElement('span')
    badge.className = `badge ${BADGE_CLASS_BY_STATUS[isEvaluated ? 'evaluated' : 'pending']}`
    badge.textContent = isEvaluated ? 'Értékelve' : 'Értékelésre vár'
    statusCell.append(badge)

    const gradeCell = document.createElement('div')
    gradeCell.className = 'submissions__cell submissions__cell--grade'
    const grade = document.createElement('span')
    grade.className = `grade ${isEvaluated ? 'grade--filled' : 'grade--empty'}`
    grade.textContent = isEvaluated ? String(evaluation.grade) : '–'
    gradeCell.append(grade)

    const href = `./project.html?id=${encodeURIComponent(project.id)}`
    const actionCell = document.createElement('div')
    actionCell.className = 'submissions__cell submissions__cell--action'
    const openLink = document.createElement('a')
    openLink.href = href
    openLink.className = 'btn btn--outline'
    openLink.textContent = 'Megnyitás →'
    actionCell.append(openLink)

    const mobileLink = document.createElement('a')
    mobileLink.href = href
    mobileLink.className = 'submissions__mobile-link'
    mobileLink.textContent = 'Projekt megnyitása →'

    row.append(projectDetails, statusCell, gradeCell, actionCell, mobileLink)
    rowsContainer.append(row)
  })
  document.getElementById('submissionsCount').textContent = `${projects.length} projekt`
}

const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
document.getElementById('currentUsername').textContent = user.username || 'Felhasználó'
document.querySelector('.sidebar__content__footer .avatar').textContent = (user.username || 'F').slice(0, 1).toLocaleUpperCase('hu')

if (requireAuthentication()) {
  try {
    showPageLoader()
    const { projects } = await apiRequest('/projects')
    renderStats(projects)
    renderProjects(projects)
  } catch (error) {
    console.error('Nem sikerült betölteni a projekteket:', error)
    document.getElementById('submissionsCount').textContent = error.message
  } finally {
    hidePageLoader()
  }
}
