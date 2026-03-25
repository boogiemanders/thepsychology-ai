import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

interface CustomAudioCheckoutOptions {
  lessonId: string
  interest?: string | null
  language?: string | null
  contentHash: string
  lessonSlug?: string | null
}

export function useCustomAudioCheckout() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(
    async (options: CustomAudioCheckoutOptions) => {
      if (!user) {
        router.push('/login')
        return
      }

      if (!user.email) {
        setError('Missing email on account. Please contact support.')
        return
      }

      setError(null)
      setLoading(true)

      try {
        const response = await fetch('/api/topic-teacher/custom-audio/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            lessonId: options.lessonId,
            interest: options.interest || null,
            language: options.language || null,
            contentHash: options.contentHash,
            lessonSlug: options.lessonSlug || null,
          }),
        })

        const data = (await response.json().catch(() => null)) as {
          url?: string
          alreadyGenerated?: boolean
          alreadyGenerating?: boolean
          generationId?: string
          error?: string
        } | null

        if (data?.alreadyGenerated) {
          // Audio already exists — no charge needed
          setLoading(false)
          return { alreadyGenerated: true, generationId: data.generationId }
        }

        if (data?.alreadyGenerating) {
          setLoading(false)
          return { alreadyGenerating: true, generationId: data.generationId }
        }

        if (!response.ok || !data?.url) {
          throw new Error(data?.error || 'Checkout failed. Please try again.')
        }

        window.location.href = data.url
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.'
        setError(message)
        setLoading(false)
        return null
      }
    },
    [router, user]
  )

  const resetError = useCallback(() => setError(null), [])

  return {
    startCheckout,
    checkoutLoading: loading,
    checkoutError: error,
    resetError,
  }
}
