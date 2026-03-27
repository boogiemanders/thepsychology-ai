/**
 * Inject a floating action button on the page.
 */
export function injectButton(
  label: string,
  onClick: () => void,
  options?: { id?: string; position?: 'bottom-right' | 'bottom-left' | 'bottom-left-high' | 'bottom-left-higher' }
): HTMLButtonElement {
  const id = options?.id ?? 'zsp-action-btn'

  // Remove existing button if present
  const existing = document.getElementById(id)
  if (existing) existing.remove()

  const btn = document.createElement('button')
  btn.id = id
  btn.textContent = label
  btn.className = 'zsp-floating-btn'
  if (options?.position === 'bottom-left') {
    btn.style.right = 'auto'
    btn.style.left = '20px'
  } else if (options?.position === 'bottom-left-high') {
    btn.style.right = 'auto'
    btn.style.left = '20px'
    btn.style.bottom = '70px'
  } else if (options?.position === 'bottom-left-higher') {
    btn.style.right = 'auto'
    btn.style.left = '20px'
    btn.style.bottom = '120px'
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    onClick()
  }, true)
  document.body.appendChild(btn)
  return btn
}

/**
 * Show a toast notification.
 */
export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const existing = document.getElementById('zsp-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'zsp-toast'
  toast.className = `zsp-toast zsp-toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('zsp-toast-hide')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

/**
 * Safely query text content from a selector, returning empty string if not found.
 */
export function textFrom(selector: string, root: Element | Document = document): string {
  const el = root.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}

/**
 * Safely get input value from a selector.
 */
export function valueFrom(selector: string, root: Element | Document = document): string {
  const el = root.querySelector(selector) as HTMLInputElement | null
  return el?.value?.trim() ?? ''
}

/**
 * Set a value on a form field and dispatch events so React picks it up.
 */
export function fillField(selector: string, value: string, root: Element | Document = document): boolean {
  const el = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null
  if (!el || !value) return false

  // Use React's internal value setter to bypass React's controlled component guard
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  )?.set

  const setter = el instanceof HTMLTextAreaElement ? nativeTextAreaValueSetter : nativeInputValueSetter
  if (setter) {
    setter.call(el, value)
  } else {
    el.value = value
  }

  // Dispatch events to trigger React state updates
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur', { bubbles: true }))

  return true
}

/**
 * Convert an image URL to base64 data URL via canvas.
 */
export async function imageToBase64(imgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${imgUrl}`))
    img.src = imgUrl
  })
}

/**
 * Select an option in a <select> element by matching visible text.
 */
export function selectOptionByText(selector: string, text: string, root: Element | Document = document): boolean {
  const select = root.querySelector(selector) as HTMLSelectElement | null
  if (!select || !text) return false

  const lowerText = text.toLowerCase()
  for (const option of Array.from(select.options)) {
    if (option.text.toLowerCase().includes(lowerText)) {
      select.value = option.value
      select.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
  }
  return false
}
