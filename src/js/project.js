import '../css/project.css'

const projectViewer = document.querySelector('.project-viewer')
const previewFrame = projectViewer?.querySelector('iframe')
const urlInput = document.getElementById('websiteUrl')
const fullscreenButton = document.getElementById('fullscreenButton')
const refreshButton = document.getElementById('refreshButton')

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
