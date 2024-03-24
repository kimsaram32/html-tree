import { canvas, canvasManipulation, redrawTree, setCanvasZoom } from './canvas.js'

const canvasPoints = new Map()

/** @type {number | null} */
let initialZoomDistance = null
let lastZoom = canvasManipulation.zoom

const canvasResetButton = document.querySelector('.reset-canvas')

/**
 * @param {PointerEvent} event
 */
function getPointFromEvent(event) {
  const sizeRatio = canvas.width / getComputedStyle(canvas).width.slice(0, -2)

  return {
    x: event.offsetX * sizeRatio,
    y: event.offsetY * sizeRatio,
  }
}

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId)
  canvasPoints.set(event.pointerId, getPointFromEvent(event))
})

canvas.addEventListener('pointermove', (event) => {
  if (!canvasPoints.size) return

  canvasResetButton.disabled = false

  if (canvasPoints.size === 1) {
    const currentPoint = getPointFromEvent(event)
    const lastPoint = canvasPoints.get(event.pointerId)
    canvasManipulation.pan.x +=
      (currentPoint.x - lastPoint.x) / canvasManipulation.zoom
    canvasManipulation.pan.y +=
      (currentPoint.y - lastPoint.y) / canvasManipulation.zoom
    redrawTree()
  }

  if (canvasPoints.size === 2) {
    const [first, second] = canvasPoints.values()
    const diffX = second.x - first.x
    const diffY = second.y - first.y

    const distance = diffX ** 2 + diffY ** 2
    initialZoomDistance ??= distance
    lastZoom ??= canvasManipulation.zoom

    const newZoom = lastZoom * (distance / initialZoomDistance)

    setCanvasZoom(newZoom, {
      x: first.x + diffX / 2,
      y: first.y + diffY / 2,
    })

    redrawTree()
  }

  canvasPoints.set(event.pointerId, getPointFromEvent(event))
})

canvas.addEventListener('wheel', (event) => {
  event.preventDefault()
  canvasResetButton.disabled = false

  setCanvasZoom(
    canvasManipulation.zoom + -event.deltaY * 0.01,
    getPointFromEvent(event)
  )

  redrawTree()
})

/**
 * @param {PointerEvent} event
 */
function pointerEndHandler(event) {
  canvasPoints.delete(event.pointerId)
  initialZoomDistance = null
}

canvas.addEventListener('pointerup', pointerEndHandler)
canvas.addEventListener('pointercancel', pointerEndHandler)
canvas.addEventListener('pointerout', pointerEndHandler)

canvasResetButton.addEventListener('click', () => {
  canvasManipulation.pan = {
    x: 0,
    y: 0,
  }
  canvasManipulation.zoom = 1
  canvasManipulation.zoomOrigin = { x: 0, y: 0 }
  redrawTree()

  canvasResetButton.disabled = true
})
