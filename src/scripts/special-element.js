const imageElements = [
  'audio',
  'canvas',
  'iframe',
  'img',
  'math',
  'picture',
  'portal',
  'script',
  'svg',
  'time',
  'video',
]

const alternativeBranchImages = ['script']

const images = Object.fromEntries(
  imageElements.map((tag, index) => [
    tag,
    {
      leafImage: [index * 100, 0, 100, 100],
      alternativeBranch: alternativeBranchImages.includes(tag)
    },
  ])
)

const headings = [1, 2, 3, 4, 5, 6].reduce((acc, level) => {
  acc[`h${level}`] = {
    style: (renderer) => {
      renderer.context.lineWidth *= 2 - (level - 1) * 0.2
    },
  }
  return acc
}, {})

const a = {
  style: (renderer) => {
    renderer.context.fillStyle = renderer.getColor('leaf-link')
  },
}

const em = {
  style: (renderer) => {
    renderer.context.fillStyle = renderer.getColor('leaf-em')
    renderer.context.lineWidth *= 1.3
  }
}

export const specialElementMap = {
  a,
  em,
  strong: em,
  ...headings,
  ...images
}