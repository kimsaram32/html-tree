import { TreeRenderer } from './tree-renderer.js'

const ZOOM_MIN = 0.5

/** @type {HTMLCanvasElement} */
export const canvas = document.getElementById('tree')

const context = canvas.getContext('2d')
const treeCanvas = new OffscreenCanvas(
  canvas.width / ZOOM_MIN,
  canvas.height / ZOOM_MIN
)

const renderer = new TreeRenderer(treeCanvas.getContext('2d'), {
  minLength: 20,
  minLineWidth: 2,
  branchAngle: (70 * Math.PI) / 180,
  shrinkRatio: 0.85,
  leafHue: 121,
})

export const canvasManipulation = {
  pan: { x: 0, y: 0 },
  zoom: 1,
  zoomOrigin: { x: 0, y: 0 },
}

export function setCanvasZoom(zoom, currentPoint) {
  const newZoom = Math.max(zoom, ZOOM_MIN)
  const scaleBy = newZoom / canvasManipulation.zoom
  canvasManipulation.zoomOrigin = {
    x:
      currentPoint.x -
      (currentPoint.x - canvasManipulation.zoomOrigin.x) * scaleBy,
    y:
      currentPoint.y -
      (currentPoint.y - canvasManipulation.zoomOrigin.y) * scaleBy,
  }
  canvasManipulation.zoom = newZoom
}

export async function updateTree(node) {
  await renderer.drawTree(node)
  redrawTree()
}

export function redrawTree() {
  context.resetTransform()
  context.clearRect(0, 0, canvas.width, canvas.height)

  context.setTransform(
    canvasManipulation.zoom,
    0,
    0,
    canvasManipulation.zoom,
    canvasManipulation.zoomOrigin.x,
    canvasManipulation.zoomOrigin.y
  )
  context.translate(canvasManipulation.pan.x, canvasManipulation.pan.y)

  context.drawImage(
    treeCanvas,
    (-treeCanvas.width + canvas.width) / 2,
    -treeCanvas.height + canvas.height,
    treeCanvas.width,
    treeCanvas.height
  )
}