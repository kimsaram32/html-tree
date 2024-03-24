import { updateTree } from './canvas.js'

const codeElement = document.querySelector('.code')
if (codeElement.contentEditable !== 'plaintext-only') {
  codeElement.contentEditable = 'true'
}

// ### update tree from code

const loadAlertElement = document.querySelector('.load-alert')

function updateTreeFromCodeElement() {
  const domString = codeElement.textContent

  loadAlertElement.hidden = false

  requestAnimationFrame(() => {
    setTimeout(async () => {
      const rootNode = new DOMParser()
        .parseFromString(
          domString.replace(/(?:\n\s*)/g, '').trim(),
          'text/html'
        )
        .querySelector('body')

      await updateTree(rootNode)

      loadAlertElement.hidden = true
    })
  })
}

function debounce(callback, delay) {
  let timeout

  return () => {
    timeout && clearTimeout(timeout)
    timeout = setTimeout(callback, delay)
  }
}

const debouncedUpdateTree = debounce(updateTreeFromCodeElement, 500)

codeElement.addEventListener('input', debouncedUpdateTree)

matchMedia('(prefers-color-scheme: light)').addEventListener(
  'change',
  updateTreeFromCodeElement
)

document.querySelector('.regenerate').addEventListener(
  'click',
  updateTreeFromCodeElement
)

updateTreeFromCodeElement()

// ### code element

const focusables = [...document.querySelectorAll('button, a, .code')] //? add more tags later if necessary

const getPrevFocusables = () => focusables.slice(0, focusables.indexOf(codeElement))
const getNextFocusables = () => focusables.slice(focusables.indexOf(codeElement) + 1)

codeElement.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'Tab': {
      event.preventDefault()
      document.execCommand('insertHTML', false, '  ') // todo
      break
    }
    case 'Escape': {
      const focusElements = event.shiftKey
        ? getPrevFocusables().toReversed().concat(...getNextFocusables().toReversed())
        : getNextFocusables().concat(...getPrevFocusables())

      console.log(focusElements.map(d => [d.textContent, d.disabled]))

      focusElements.find((el) => !el.disabled)?.focus()
      break
    }
  }
})

if (CSS.highlights) {
  const tagRegexp = /(<\/?)([A-z0-9]+)>?/g

  const tagNameHighlight = new Highlight()
  CSS.highlights.set('tag-name', tagNameHighlight)

  function highlightCodeElement() {
    for (const codeTextNode of codeElement.childNodes) {
      for (const match of codeTextNode.textContent.matchAll(tagRegexp)) {
        const range = new Range()
  
        range.setStart(codeTextNode, match.index + match[1].length)
        range.setEnd(
          codeTextNode,
          match.index + match[1].length + match[2].length
        )
  
        tagNameHighlight.add(range)
      }
    }
  }

  codeElement.addEventListener('input', () => {
    tagNameHighlight.clear()

    if (codeElement.firstChild?.length < 3000) {
      highlightCodeElement()
    }
  })

  highlightCodeElement()
}