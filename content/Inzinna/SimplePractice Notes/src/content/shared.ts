/**
 * Shared DOM utilities for SimplePractice Notes content scripts.
 * Mirrors the patterns from the ZocDoc-to-SP extension.
 */

export function injectButton(
  label: string,
  onClick: () => void,
  options?: { id?: string; position?: 'bottom-right' | 'bottom-right-high' | 'bottom-left' | 'bottom-left-high' }
): HTMLButtonElement {
  const id = options?.id ?? 'spn-action-btn'
  const existing = document.getElementById(id)
  if (existing) existing.remove()

  const btn = document.createElement('button')
  btn.id = id
  btn.textContent = label
  btn.className = 'spn-floating-btn'
  if (options?.position === 'bottom-right-high') {
    btn.style.bottom = '90px'
  } else if (options?.position === 'bottom-left') {
    btn.style.right = 'auto'
    btn.style.left = '20px'
  } else if (options?.position === 'bottom-left-high') {
    btn.style.right = 'auto'
    btn.style.left = '20px'
    btn.style.bottom = '70px'
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

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const existing = document.getElementById('spn-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'spn-toast'
  toast.className = `spn-toast spn-toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('spn-toast-hide')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
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

export function isExtensionContextInvalidatedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return /Extension context invalidated|Cannot read properties of undefined/i.test(err.message)
}

export function textFrom(selector: string, root: Element | Document = document): string {
  const el = root.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}

export function valueFrom(selector: string, root: Element | Document = document): string {
  const el = root.querySelector(selector) as HTMLInputElement | null
  return el?.value?.trim() ?? ''
}

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

  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur', { bubbles: true }))
  return true
}

export function fillField(selector: string, value: string, root: Element | Document = document): boolean {
  const el = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null
  return fillTextLikeField(el, value)
}

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

export function normalizedText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function isVisible(el: Element): boolean {
  return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0
}

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

export function findFieldContainer(labelText: string): HTMLElement | null {
  const target = normalizedText(labelText)
  const labels = document.querySelectorAll('label, .form-label, .field-label, .spds-label, [class*="label"]')

  for (const label of Array.from(labels)) {
    if (!normalizedText(label.textContent).includes(target)) continue

    const container =
      label.closest('.form-group, .field-wrapper, [class*="field"], [class*="row"], [class*="group"]') ??
      label.parentElement ??
      label.nextElementSibling?.parentElement

    if (container instanceof HTMLElement) {
      return container
    }
  }
  return null
}

export function findFieldElement<T extends Element>(labelText: string, selector: string): T | null {
  const container = findFieldContainer(labelText)
  if (!container) return null
  return container.querySelector(selector) as T | null
}
