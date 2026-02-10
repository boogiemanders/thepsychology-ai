export function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const candidate = error as {
    name?: string
    code?: number
    message?: string
  }

  return (
    candidate.name === 'QuotaExceededError' ||
    candidate.code === 22 ||
    candidate.code === 1014 ||
    (typeof candidate.message === 'string' &&
      candidate.message.toLowerCase().includes('quota'))
  )
}

export function clearLocalStorageByPrefix(prefix: string): number {
  if (typeof window === 'undefined') return 0

  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (key.startsWith(prefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore remove failures
    }
  })

  return keysToRemove.length
}

export function safeLocalStorageGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    console.debug(`[storage] localStorage.getItem failed for key "${key}"`, error)
    return null
  }
}

export function safeLocalStorageSetItem(
  key: string,
  value: string,
  options: {
    clearPrefixesOnQuota?: string[]
  } = {}
): boolean {
  if (typeof window === 'undefined') return false

  const attemptWrite = (): boolean => {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        console.debug(`[storage] localStorage.setItem failed for key "${key}"`, error)
        return false
      }

      const prefixes = options.clearPrefixesOnQuota || []
      if (prefixes.length === 0) {
        console.debug(`[storage] localStorage quota exceeded for key "${key}"`, error)
        return false
      }

      prefixes.forEach((prefix) => {
        clearLocalStorageByPrefix(prefix)
      })

      try {
        window.localStorage.setItem(key, value)
        return true
      } catch (retryError) {
        console.debug(
          `[storage] localStorage.setItem retry failed for key "${key}" after cleanup`,
          retryError
        )
        return false
      }
    }
  }

  return attemptWrite()
}

export function safeLocalStorageRemoveItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.debug(`[storage] localStorage.removeItem failed for key "${key}"`, error)
  }
}

export function safeSessionStorageSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch (error) {
    console.debug(`[storage] sessionStorage.setItem failed for key "${key}"`, error)
    return false
  }
}
