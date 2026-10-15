const dialog = document.querySelector('#snakeDialog')
const canvas = document.querySelector('#snakeBoard')
const ctx = canvas.getContext('2d')
const scoreLabel = document.querySelector('#snakeScore')
const status = document.querySelector('#snakeStatus')
const restart = dialog.querySelector('[data-restart-snake]')
const size = 20
const directions = { ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0], w: [0, -1], d: [1, 0], s: [0, 1], a: [-1, 0] }
let snake, food, direction, next, score, timer, over, turnQueued

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  snake.forEach(([x, y], i) => {
    ctx.fillStyle = i ? '#657cff' : '#dce2ff'
    ctx.fillRect(x * 20 + 3, y * 20 + 3, 14, 14)
  })
  ctx.fillStyle = '#bca2ff'
  ctx.beginPath()
  ctx.arc(food[0] * 20 + 10, food[1] * 20 + 10, 7, 0, 2 * Math.PI)
  ctx.fill()
}

const start = () => {
  clearInterval(timer)
  snake = [[9, 10], [8, 10], [7, 10]]
  direction = next = [1, 0]
  score = 0
  over = turnQueued = false
  scoreLabel.textContent = '0'
  status.textContent = 'A játék indul!'
  restart.hidden = true
  dialog.dataset.state = 'playing'
  do { food = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)] }
  while (snake.some(([x, y]) => x === food[0] && y === food[1]))
  draw()
  timer = setInterval(() => {
    direction = next
    turnQueued = false
    const head = [snake[0][0] + direction[0], snake[0][1] + direction[1]]
    const eating = head[0] === food[0] && head[1] === food[1]
    if (head.some(n => n < 0 || n >= size) || snake.slice(0, eating ? snake.length : -1).some(([x, y]) => x === head[0] && y === head[1])) {
      clearInterval(timer)
      over = true
      dialog.dataset.state = 'over'
      status.textContent = 'Vége a játéknak. Próbáld újra!'
      restart.hidden = false
      return
    }
    snake.unshift(head)
    if (eating) {
      scoreLabel.textContent = ++score
      if (score === 10) {
        clearInterval(timer)
        dialog.dataset.state = 'won'
        dialog.close()
        document.dispatchEvent(new Event('snake-win'))
        return
      }
      do { food = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)] }
      while (snake.some(([x, y]) => x === food[0] && y === food[1]))
    } else snake.pop()
    draw()
  }, 125)
}

dialog.addEventListener('snake-start', start)
dialog.addEventListener('close', () => clearInterval(timer))
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
restart.addEventListener('click', start)
document.addEventListener('keydown', event => {
  const candidate = directions[event.key] || directions[event.key.toLowerCase()]
  if (!dialog.open || over || !candidate) return
  event.preventDefault()
  if (turnQueued || candidate[0] === -direction[0] && candidate[1] === -direction[1]) return
  next = candidate
  turnQueued = true
})
dialog.addEventListener('click', event => {
  const name = event.target.closest('[data-snake-direction]')?.dataset.snakeDirection
  const candidate = directions[{ up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' }[name]]
  if (!dialog.open || over || !candidate || turnQueued || candidate[0] === -direction[0] && candidate[1] === -direction[1]) return
  next = candidate
  turnQueued = true
})
