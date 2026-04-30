// Pre-recorded digit audio played through Web Audio API.
// Sidesteps speechSynthesis and per-element autoplay unlocking issues.
// One AudioContext is unlocked on user gesture (primeSpeech), then all
// subsequent buffer plays work without re-gating.

type DigitBuffers = Partial<Record<number, AudioBuffer>>

let ctx: AudioContext | null = null
let buffers: DigitBuffers = {}
let loadPromise: Promise<void> | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

async function loadAll(): Promise<void> {
  const c = getCtx()
  if (!c) return
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  await Promise.all(
    digits.map(async (d) => {
      if (buffers[d]) return
      const res = await fetch(`/audio/digits/${d}.wav`)
      const arr = await res.arrayBuffer()
      const buf = await c.decodeAudioData(arr.slice(0))
      buffers[d] = buf
    }),
  )
}

export function canSpeak(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext)
}

// Must be called inside a user-gesture handler.
export function primeSpeech(): void {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    c.resume().catch(() => {})
  }
  if (!loadPromise) loadPromise = loadAll()
}

function playBuffer(buf: AudioBuffer): Promise<void> {
  return new Promise((resolve) => {
    const c = getCtx()
    if (!c) return resolve()
    const src = c.createBufferSource()
    src.buffer = buf
    src.connect(c.destination)
    src.onended = () => resolve()
    src.start()
    // Safety
    window.setTimeout(() => resolve(), Math.ceil(buf.duration * 1000) + 500)
  })
}

interface SpeakOptions {
  digits: number[]
  digitDurationMs?: number
  onDone?: () => void
  onError?: (err: string) => void
}

export function speakSequence(opts: SpeakOptions): () => void {
  const { digits, digitDurationMs = 1000, onDone, onError } = opts

  if (!canSpeak()) {
    onDone?.()
    return () => {}
  }

  let cancelled = false

  const run = async () => {
    try {
      console.log('[speech] starting sequence', digits, 'loadPromise?', !!loadPromise)
      await (loadPromise ?? loadAll())
      console.log('[speech] buffers loaded keys=', Object.keys(buffers))
      const c = getCtx()
      if (!c) {
        console.warn('[speech] no audio context')
        onError?.('no-audio-context')
        return
      }
      console.log('[speech] ctx state=', c.state)
      if (c.state === 'suspended') {
        try {
          await c.resume()
          console.log('[speech] ctx resumed, state=', c.state)
        } catch (e) {
          console.warn('[speech] resume failed', e)
        }
      }
      for (let i = 0; i < digits.length; i++) {
        if (cancelled) return
        const buf = buffers[digits[i]]
        if (!buf) {
          console.warn('[speech] missing buffer for', digits[i])
          onError?.(`missing-buffer-${digits[i]}`)
          return
        }
        console.log('[speech] playing digit', digits[i], 'duration=', buf.duration)
        const start = performance.now()
        await playBuffer(buf)
        console.log('[speech] finished digit', digits[i])
        if (cancelled) return
        const elapsed = performance.now() - start
        const remaining = Math.max(0, digitDurationMs - elapsed)
        if (remaining > 0) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, remaining))
        }
      }
      if (!cancelled) onDone?.()
    } catch (err) {
      console.warn('[speech] error caught', err)
      if (!cancelled) onError?.(err instanceof Error ? err.message : 'audio-error')
    }
  }

  run()

  return () => {
    cancelled = true
  }
}
