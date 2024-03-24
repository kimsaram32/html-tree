import { specialElementMap } from './special-element.js'

function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

const branchNodeTypes = [
  Node.ELEMENT_NODE,
  Node.DOCUMENT_NODE,
]

const leafNodeTypes = [
  Node.COMMENT_NODE,
  Node.TEXT_NODE,
]

const drawableNodeTypes = [...branchNodeTypes, ...leafNodeTypes]

function isEmptyElement(node) {
  return (
    node instanceof Element &&
    !node.childNodes.length &&
    !specialElementMap[node.tagName.toLowerCase()]
  )
}

/**
 * @param {Node} node 
 * @returns {boolean}
 */
function canDraw(node) {
  return drawableNodeTypes.includes(node.nodeType) && !isEmptyElement(node)
}

const leafSpritesheetPromise = new Promise((resolve) => {
  const image = new Image()
  image.addEventListener('load', () => resolve(image))
  image.src = '/leaves.webp'
})

/**
 * @typedef {object} DrawTreeOptions
 * @property {Node} node
 * @property {number} x
 * @property {number} y
 * @property {number} angle
 * @property {number} length
 * @property {number} lineWidth
 */

export class TreeRenderer {
  /**
   * @type {CanvasRenderingContext2D}
   */
  context

  /**
   * @private
   */
  options

  /**
   * @private
   * @type {CSSStyleDeclaration | null}
   */
  globalStyle = null

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {any} options
   */
  constructor(context, options) {
    this.context = context
    this.options = options
  }

  /**
   * @param {string} name color name - between --tree- and -color
   */
  getColor(name) {
    return this.globalStyle?.getPropertyValue(`--tree-${name}-color`) ?? null
  }

  /**
   * @private
   */
  drawLine(start, end) {
    this.context.beginPath()
    this.context.moveTo(start.x, start.y)
    this.context.lineTo(end.x, end.y)
    this.context.stroke()
  }
  /**
   * @private
   */
  drawLeaf({ x, y, size, moveRandom }) {
    this.context.save()
    this.context.fillStyle =
      `color-mix(in oklab, ${this.context.fillStyle}, black ${randomRange(0, 20)}%)`

    this.context.beginPath()
    this.context.arc(
      x + randomRange(-moveRandom, moveRandom),
      y + randomRange(-moveRandom, moveRandom),
      size,
      0,
      Math.PI * 2
    )
    this.context.fill()

    this.context.restore()
  }

  /**
   * @private
   */
  drawLeaves({ node, x, y, lineWidth }) {
    const repeats = Math.min(Math.max(1, Math.floor(node.textContent.length / 8)), 15)
    
    const size = Math.min(Math.max(8 - lineWidth * 0.2, randomRange(lineWidth * 2, lineWidth * 2.5)), 12)
    const moveRandom = size + repeats * 0.6

    if (node instanceof Comment) {
      this.context.fillStyle = this.getColor('leaf-comment')
    }

    for (let i = 0; i < repeats; i++) {
      this.drawLeaf({ x, y, size, moveRandom })
    }
  }

  /**
   * @private
   */
  async drawLeafImage({ leafImage, x, y, angle, lineWidth }) {
    const leafSpritesheet = await leafSpritesheetPromise
    this.context.translate(x, y)
    this.context.rotate(-angle + Math.PI / 2)

    const size = 20 + Math.min(20, lineWidth * randomRange(2.2, 2.6))

    this.context.drawImage(
      leafSpritesheet,
      ...leafImage,
      - size / 2,
      - size / 2,
      size,
      size,
    )
  }
  
  /**
   * @private
   */
  async drawTreePart({ node, x, y, angle, length, lineWidth }) {
    if (!canDraw(node)) {
      return
    }
    
    if (leafNodeTypes.includes(node.nodeType)) {
      this.context.save()
      this.drawLeaves({ node, x, y, lineWidth })
      this.context.restore()
      return
    }
  
    // node is Element / Document
    
    const specialOptions = specialElementMap[node.tagName?.toLowerCase()]

    // apply styles
  
    this.context.save()    
    this.context.lineWidth = lineWidth
    
    specialOptions?.style?.(this)
    lineWidth = this.context.lineWidth
    
    // draw branch

    const isShort =
      (node.childNodes.length === 1 && node.firstChild instanceof Element) ||
      specialOptions?.alternativeBranch

    const finalLength =
      (isShort ? length * 0.5 : length) * randomRange(0.7, 1.3)

    if (specialOptions?.alternativeBranch) {
      angle = randomRange(-this.options.branchAngle, this.options.branchAngle) + Math.PI / 2
    }
    
    const nextPoint = {
      x: x + finalLength * Math.cos(angle),
      y: y - finalLength * Math.sin(angle),
    }
    
    this.context.strokeStyle =
      `color-mix(in oklab, ${this.context.strokeStyle}, black ${randomRange(0, 5)}%)`
    this.drawLine({ x, y }, nextPoint)
  
    // draw leaf image
  
    if (specialOptions?.leafImage) {
      await this.drawLeafImage({
        ...nextPoint,
        angle,
        leafImage: typeof specialOptions.leafImage === 'function'
          ? specialOptions.leafImage(node)
          : specialOptions.leafImage,
        lineWidth
      })
  
      this.context.restore()
      return
    }
  
    // draw children
  
    /** @type {Element[]} */
    const drawableChildren = [...node.children].filter(canDraw)
  
    const rotateChildren = drawableChildren.filter(
      (node) => !specialElementMap[node.nodeName.toLowerCase()]?.alternativeBranch
    )

    let childAngleRotation = this.options.branchAngle / Math.max(1, rotateChildren.length - 1)
    let childAngle =
      rotateChildren.length === 1
        ? Math.PI / 2
        : Math.PI / 2 - this.options.branchAngle / 2
    
    for (const childNode of [...node.childNodes].filter(canDraw)) {
      await this.drawTreePart({
        ...nextPoint,
        node: childNode,
        angle: childAngle + (angle - Math.PI / 2) + /* extraRotation */ + randomRange(-0.1, 0.1),
        length: Math.max(length * this.options.shrinkRatio /* * Math.max(0.6, weight) */, this.options.minLength),
        lineWidth: Math.max(lineWidth * this.options.shrinkRatio, this.options.minLineWidth),
      })

      if (rotateChildren.includes(childNode)) {
        childAngle += childAngleRotation
      }
    }
  
    this.context.restore()
  }

  /**
   * @param {Node} rootNode
   */
  async drawTree(rootNode) {
    this.globalStyle = getComputedStyle(document.documentElement)
    const rectArgs = [0, 0, this.context.canvas.width, this.context.canvas.height]

    this.context.clearRect(...rectArgs)
    this.context.fillStyle = this.getColor('bg')
    this.context.fillRect(...rectArgs)
    
    this.context.strokeStyle = this.getColor('branch')
    this.context.fillStyle = this.getColor('leaf')

    return this.drawTreePart({
      node: rootNode,
      x: this.context.canvas.width / 2,
      y: this.context.canvas.height,
      angle: Math.PI / 2,
      length: 120,
      lineWidth: 10
    })
  }
}