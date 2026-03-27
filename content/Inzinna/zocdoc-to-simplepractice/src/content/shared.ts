/**
 * Inject a floating action button on the page.
 */
export function injectButton(
  label: string,
  onClick: () => void,
  options?: { id?: string; position?: 'bottom-right' | 'bottom-right-high' | 'bottom-left' | 'bottom-left-high' | 'bottom-left-higher' }
): HTMLButtonElement {
  const id = options?.id ?? 'zsp-action-btn'

  // Remove existing button if present
  const existing = document.getElementById(id)
  if (existing) existing.remove()

  const btn = document.createElement('button')
  btn.id = id
  btn.textContent = label
  btn.className = 'zsp-floating-btn'
  if (options?.position === 'bottom-right-high') {
    btn.style.bottom = '90px'
  } else if (options?.position === 'bottom-left') {
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
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
  }, true)
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    onClick()
  }, true)
  document.body.appendChild(btn)
  return btn
}

export function isExtensionContextInvalidatedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return /Extension context invalidated|Cannot read properties of undefined \(reading 'local'\)|Cannot read properties of undefined \(reading 'session'\)/i
    .test(err.message)
}

export function assertExtensionContext(): void {
  if (
    typeof chrome === 'undefined' ||
    !chrome.runtime?.id ||
    !chrome.storage ||
    (!chrome.storage.session && !chrome.storage.local)
  ) {
    throw new Error('Extension context invalidated.')
  }
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
 * Set a value on an input/textarea element and dispatch the events SPA forms listen for.
 */
export function fillTextLikeField(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  value: string
): boolean {
  if (!el || !value) return false

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
 * Set a value on a form field selected from the DOM.
 */
export function fillField(selector: string, value: string, root: Element | Document = document): boolean {
  const el = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null
  return fillTextLikeField(el, value)
}

/**
 * Set text content on a contenteditable element and dispatch input events.
 */
export function fillContentEditableField(
  el: HTMLElement | null,
  value: string
): boolean {
  if (!el || !value) return false

  el.focus()
  el.innerHTML = ''

  const lines = value.replace(/\r\n/g, '\n').split('\n')
  for (const line of lines) {
    const block = document.createElement('div')
    if (line.length === 0) {
      block.appendChild(document.createElement('br'))
    } else {
      block.textContent = line
    }
    el.appendChild(block)
  }

  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur', { bubbles: true }))
  return true
}

/**
 * Convert a blob into a base64 data URL.
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
        return
      }
      reject(new Error('Blob did not produce a string result'))
    }
    reader.readAsDataURL(blob)
  })
}

/**
 * Fetch a resource URL and convert it into a base64 data URL.
 */
export async function urlToBase64(resourceUrl: string): Promise<string> {
  const response = await fetch(resourceUrl, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`Failed to fetch resource: ${response.status}`)
  }
  return blobToDataUrl(await response.blob())
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
