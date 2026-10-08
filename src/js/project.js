import { apiRequest, requireAuthentication } from './api.js'
import '../css/project.css'

const projectViewer = document.querySelector('.project-viewer')
const previewFrame = projectViewer?.querySelector('iframe')
const urlInput = document.getElementById('websiteUrl')
const fullscreenButton = document.getElementById('fullscreenButton')
const refreshButton = document.getElementById('refreshButton')
const switchItems = document.querySelectorAll('.swich [data-view]')
const previewSection = document.getElementById('previewSection')
const evaluationSection = document.getElementById('evaluationSection')
const ratingRows = document.querySelectorAll('.rating-row')
const miniRatingButtons = document.querySelectorAll('.mini-rating-btn')
const averageScore = document.getElementById('averageScore')
const criteriaScore = document.getElementById('criteriaScore')
const message = document.getElementById('evaluationMessage')
const projectId = new URLSearchParams(window.location.search).get('id')

const showMessage = (text, isError = false) => {
  if (!message) return
  message.textContent = text
  message.classList.toggle('evaluation-message--error', isError)
}

const setActiveView = (viewName) => {
  const nextView = viewName === 'evaluation' ? 'evaluation' : 'preview'
  switchItems.forEach((item) => {
    const isActive = item.dataset.view === nextView
    item.classList.toggle('swich--active', isActive)
    item.setAttribute('aria-selected', String(isActive))
  })
  previewSection?.classList.toggle('hidden', nextView !== 'preview')
  evaluationSection?.classList.toggle('hidden', nextView !== 'evaluation')
}

const selectedValues = () => [...ratingRows].map((row) => {
  const selected = row.querySelector('.rating-btn.active')
  return selected ? Number(selected.textContent.trim()) : null
})

const updateAverageScore = () => {
  const scores = selectedValues().filter((score) => score !== null)
  if (!scores.length) {
    if (criteriaScore) criteriaScore.textContent = '0.0'
    if (averageScore) averageScore.textContent = '–'
    return
  }
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length
  if (averageScore) averageScore.textContent = String(Math.round(average))
  if (criteriaScore) criteriaScore.textContent = average.toFixed(1)
}

const normalizeUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Csak http vagy https webcím használható.')
  }
  return url.href
}

const loadPreviewUrl = () => {
  if (!urlInput || !previewFrame) return
  try {
    const url = normalizeUrl(urlInput.value)
    if (url) {
      previewFrame.src = url
      urlInput.value = url
    }
  } catch (error) {
    const loadMessage = document.getElementById('projectLoadMessage')
    loadMessage.textContent = error.message
    loadMessage.classList.add('evaluation-message--error')
  }
}

function selectRating(row, value) {
  row.querySelectorAll('.rating-btn').forEach((button) => {
    const isSelected = Number(button.textContent.trim()) === value
    button.classList.toggle('active', isSelected)
    button.setAttribute('aria-pressed', String(isSelected))
  })
}

function selectGrade(value) {
  miniRatingButtons.forEach((button) => {
    const isSelected = Number(button.textContent.trim()) === value
    button.classList.toggle('active', isSelected)
    button.setAttribute('aria-pressed', String(isSelected))
  })
}

async function loadProject() {
  if (!projectId) {
    throw new Error('A projekt azonosítója hiányzik. Térj vissza a projektekhez.')
  }
  const project = await apiRequest(`/projects/${encodeURIComponent(projectId)}`)
  document.getElementById('project_name').textContent = project.title
  document.getElementById('projectAuthors').textContent = project.authors
  document.title = `${project.title} – Értékelő`
  if (project.website_url) {
    urlInput.value = project.website_url
    loadPreviewUrl()
  }

  const evaluation = project.evaluation
  if (evaluation) {
    ratingRows.forEach((row) => selectRating(row, evaluation[row.dataset.question]))
    selectGrade(evaluation.grade)
    document.querySelector('.question-card--full textarea').value = evaluation.feedback || ''
    if (evaluation.published) {
      const status = document.getElementById('projectStatus')
      status.textContent = 'Értékelve'
      status.classList.remove('badge--orange')
      status.classList.add('badge--green')
    }
  }
  updateAverageScore()
}

if (urlInput && previewFrame) {
  urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      loadPreviewUrl()
    }
  })
  urlInput.addEventListener('change', loadPreviewUrl)
}

if (fullscreenButton && projectViewer) {
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await projectViewer.requestFullscreen()
      else await document.exitFullscreen()
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
      showMessage('A teljes képernyős nézet nem érhető el ebben a böngészőben.', true)
    }
  })
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.classList.toggle('is-active', Boolean(document.fullscreenElement))
  })
}

if (refreshButton && previewFrame) {
  refreshButton.addEventListener('click', () => {
    if (previewFrame.src && previewFrame.src !== 'about:blank') previewFrame.src = previewFrame.src
  })
}

switchItems.forEach((item) => {
  item.addEventListener('click', () => setActiveView(item.dataset.view))
})

ratingRows.forEach((row) => {
  row.querySelectorAll('.rating-btn').forEach((button) => {
    button.setAttribute('aria-pressed', 'false')
    button.addEventListener('click', () => {
      selectRating(row, Number(button.textContent.trim()))
      updateAverageScore()
    })
  })
})

miniRatingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectGrade(Number(button.textContent.trim()))
    updateAverageScore()
  })
})

async function saveEvaluation(published) {
  if (!projectId) {
    showMessage('A projekt azonosítója hiányzik.', true)
    return
  }
  const criteria = selectedValues()
  const grade = document.querySelector('.mini-rating-btn.active')
  if (published && (criteria.some((value) => value === null) || !grade)) {
    showMessage('Értékeléshez válassz pontszámot mind a négy kritériumnál és egy érdemjegyet.', true)
    return
  }

  const buttons = [document.getElementById('publishEvaluation'), document.getElementById('saveEvaluationDraft')]
  buttons.forEach((button) => { button.disabled = true })
  showMessage('')
  try {
    await apiRequest(`/projects/${encodeURIComponent(projectId)}/evaluations`, {
      method: 'POST',
      body: JSON.stringify({
        grade: grade ? Number(grade.textContent.trim()) : null,
        theme: criteria[0],
        design: criteria[1],
        animations: criteria[2],
        javascript: criteria[3],
        feedback: document.querySelector('.question-card--full textarea').value,
        published
      })
    })
    showMessage(published ? 'Az értékelés közzétéve.' : 'A vázlat mentése sikerült.')
    const status = document.getElementById('projectStatus')
    if (published) {
      status.textContent = 'Értékelve'
      status.classList.remove('badge--orange')
      status.classList.add('badge--green')
    }
  } catch (error) {
    showMessage(error.message, true)
  } finally {
    buttons.forEach((button) => { button.disabled = false })
  }
}

document.getElementById('publishEvaluation').addEventListener('click', () => saveEvaluation(true))
document.getElementById('saveEvaluationDraft').addEventListener('click', () => saveEvaluation(false))

setActiveView('preview')
updateAverageScore()

if (requireAuthentication()) {
  try {
    await loadProject()
  } catch (error) {
    console.error('A projekt betöltése nem sikerült:', error)
    const loadMessage = document.getElementById('projectLoadMessage')
    loadMessage.textContent = error.message
    loadMessage.classList.add('evaluation-message--error')
  }
}
