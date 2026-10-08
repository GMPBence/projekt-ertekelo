import '../css/project.css'

const projectViewer = document.querySelector('.project-viewer')
const previewFrame = projectViewer?.querySelector('iframe')
const urlInput = document.getElementById('websiteUrl')
const fullscreenButton = document.getElementById('fullscreenButton')
const refreshButton = document.getElementById('refreshButton')
const switchItems = document.querySelectorAll('.swich p')
const previewSection = document.getElementById('previewSection')
const evaluationSection = document.getElementById('evaluationSection')
const ratingRows = document.querySelectorAll('.rating-row')
const miniRatingButtons = document.querySelectorAll('.mini-rating-btn')
const averageScore = document.getElementById('averageScore')
const criteriaScore = document.getElementById('criteriaScore')

const setActiveView = (viewName) => {
  const nextView = viewName === 'evaluation' ? 'evaluation' : 'preview'

  switchItems.forEach((item) => {
    const isActive = item.dataset.view === nextView
    item.classList.toggle('swich--active', isActive)
    item.setAttribute('aria-selected', String(isActive))
  })

  if (previewSection) {
    previewSection.classList.toggle('hidden', nextView !== 'preview')
  }

  if (evaluationSection) {
    evaluationSection.classList.toggle('hidden', nextView !== 'evaluation')
  }
}

const updateAverageScore = () => {
  const selectedValues = [...document.querySelectorAll('.rating-btn.active')].map((button) => Number(button.textContent.trim()))

  if (!selectedValues.length) {
    if (criteriaScore) criteriaScore.textContent = '0.0'
    return
  }

  const total = selectedValues.reduce((sum, value) => sum + value, 0)
  const average = total / selectedValues.length

  if (averageScore) averageScore.textContent = String(Math.round(average))
  if (criteriaScore) criteriaScore.textContent = average.toFixed(1)
}

const normalizeUrl = (value) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  return `https://${trimmedValue}`
}

const loadPreviewUrl = () => {
  if (!urlInput || !previewFrame) {
    return
  }

  const url = normalizeUrl(urlInput.value)

  if (!url) {
    return
  }

  previewFrame.src = url
  urlInput.value = url
}

if (urlInput && previewFrame) {
  urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      loadPreviewUrl()
    }
  })

  urlInput.addEventListener('change', loadPreviewUrl)
  urlInput.addEventListener('blur', loadPreviewUrl)
}

if (fullscreenButton && projectViewer) {
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await projectViewer.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
    }
  })

  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.classList.toggle('is-active', Boolean(document.fullscreenElement))
  })
}

if (refreshButton && previewFrame) {
  refreshButton.addEventListener('click', () => {
    const currentSrc = previewFrame.src

    if (!currentSrc) {
      return
    }

    previewFrame.src = currentSrc
  })
}

switchItems.forEach((item) => {
  item.addEventListener('click', () => {
    setActiveView(item.dataset.view)
  })
})

ratingRows.forEach((row) => {
  row.querySelectorAll('.rating-btn').forEach((button) => {
    button.addEventListener('click', () => {
      row.querySelectorAll('.rating-btn').forEach((item) => item.classList.remove('active'))
      button.classList.add('active')
      updateAverageScore()
    })
  })
})

miniRatingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    miniRatingButtons.forEach((item) => {
      item.classList.remove('active')
      item.setAttribute('aria-pressed', 'false')
    })
    button.classList.add('active')
    button.setAttribute('aria-pressed', 'true')
    updateAverageScore()
  })
})

setActiveView('preview')
updateAverageScore()
