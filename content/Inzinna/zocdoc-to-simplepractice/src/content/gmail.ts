import { clearPendingVobDraft, getPendingVobDraft } from '../lib/storage'
import { fillContentEditableField, fillTextLikeField } from './shared'

function isVisible(el: Element): boolean {
  return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0
}

function getVisibleElement<T extends Element>(selector: string): T | null {
  const visible = Array.from(document.querySelectorAll(selector)).find(isVisible)
  return (visible as T | undefined) ?? document.querySelector(selector)
}

let applyingDraft = false
let appliedDraftAt = ''

async function applyPendingDraft(): Promise<void> {
  if (applyingDraft) return

  applyingDraft = true
  try {
    const draft = await getPendingVobDraft()
    if (!draft || draft.createdAt === appliedDraftAt) return

    const subjectInput = getVisibleElement<HTMLInputElement>('input[name="subjectbox"]')
    const bodyField = getVisibleElement<HTMLElement>(
      'div[aria-label="Message Body"][contenteditable="true"], div[role="textbox"][aria-label="Message Body"][contenteditable="true"]'
    )

    if (!subjectInput || !bodyField) return

    const subjectFilled = fillTextLikeField(subjectInput, draft.subject)
    const bodyFilled = fillContentEditableField(bodyField, draft.body)
    if (!subjectFilled || !bodyFilled) return

    appliedDraftAt = draft.createdAt
    await clearPendingVobDraft()
    console.log('[ZSP] Filled Gmail compose from pending VOB draft')
  } finally {
    applyingDraft = false
  }
}

function watchForCompose(): void {
  const observer = new MutationObserver(() => {
    void applyPendingDraft()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function init(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void applyPendingDraft()
      watchForCompose()
    })
  } else {
    void applyPendingDraft()
    watchForCompose()
  }
}

init()
