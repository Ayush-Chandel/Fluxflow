
const MIRROR_PROPS = [
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'letter-spacing',
  'line-height',
  'text-indent',
  'text-transform',
  'word-spacing',
  'word-break',
  'overflow-wrap',
  'tab-size',
] as const

/** The caret's line box in viewport coordinates. */
export type CaretRect = { top: number; height: number }

export function caretLineRect(textarea: HTMLTextAreaElement): CaretRect {
  const doc = textarea.ownerDocument
  const style = getComputedStyle(textarea)

  const mirror = doc.createElement('div')
  for (const prop of MIRROR_PROPS) mirror.style.setProperty(prop, style.getPropertyValue(prop))

  const paddingX =
    parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0')
  mirror.style.boxSizing = 'content-box'
  mirror.style.width = `${Math.max(0, textarea.clientWidth - paddingX)}px`
  mirror.style.padding = '0'
  mirror.style.border = '0'
  mirror.style.height = 'auto'
  mirror.style.position = 'absolute'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.overflowWrap = 'break-word'

  const caretIndex = textarea.selectionEnd ?? textarea.value.length
  mirror.textContent = textarea.value.slice(0, caretIndex)

  // U+200B zero-width space, so the marker still occupies the caret's line when
  // the caret sits at the very start of one.
  const marker = doc.createElement('span')
  marker.textContent = String.fromCharCode(0x200b)
  mirror.appendChild(marker)

  doc.body.appendChild(mirror)
  const offsetTop = marker.offsetTop

  const lineHeight = parseFloat(style.lineHeight)
  const height = Number.isFinite(lineHeight)
    ? lineHeight
    : marker.offsetHeight || parseFloat(style.fontSize || '16') * 1.2
  mirror.remove()

  const rect = textarea.getBoundingClientRect()
  const inset =
    parseFloat(style.borderTopWidth || '0') + parseFloat(style.paddingTop || '0')

  return { top: rect.top + inset + offsetTop, height }
}

export function scrollableAncestor(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return null
}

/** Breathing room kept between the caret and the edge it's approaching. */
const CARET_MARGIN = 12

/**
 * Scroll the caret back into view, if it has drifted out. No-op when it's
 * already visible, which keeps this safe to call on every keystroke.
 */
export function scrollCaretIntoView(textarea: HTMLTextAreaElement) {
  const scroller = scrollableAncestor(textarea)
  if (!scroller) return

  const caret = caretLineRect(textarea)
  const view = scroller.getBoundingClientRect()

  const below = caret.top + caret.height - (view.bottom - CARET_MARGIN)
  if (below > 0) {
    scroller.scrollTop += below
    return
  }

  const above = view.top + CARET_MARGIN - caret.top
  if (above > 0) scroller.scrollTop -= above
}
