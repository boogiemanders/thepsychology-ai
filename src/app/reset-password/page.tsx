'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isActive = true

    const initializeRecoverySession = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            throw exchangeError
          }
          window.history.replaceState({}, document.title, window.location.pathname)
        } else if (tokenHash && type === 'recovery') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          })
          if (verifyError) {
            throw verifyError
          }
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (setSessionError) {
            throw setSessionError
          }

          window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        }

        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!isActive) return

        const hasSession = Boolean(data.session)
        setHasRecoverySession(hasSession)
        if (!hasSession) {
          setError('This reset link is invalid or has expired. Request a new one.')
        }
      } catch (err) {
        if (!isActive) return
        const message = err instanceof Error ? err.message : 'Unable to verify reset link'
        setError(message)
      } finally {
        if (isActive) setInitializing(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        const hasSession = Boolean(session)
        setHasRecoverySession(hasSession)
        if (hasSession) {
          setError(null)
        }
      }
    })

    initializeRecoverySession()

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => {
        router.push('/login')
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update password'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Set a new password</CardTitle>
              <CardDescription>
                Choose a new password to regain access to your account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert>
                      <AlertDescription>
                        Password updated successfully. Redirecting to login...
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>
                {initializing ? (
                  <motion.p
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground"
                  >
                    Verifying reset link...
                  </motion.p>
                ) : hasRecoverySession ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        New Password
                      </label>
                      <Input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a new password"
                        required
                        disabled={loading || success}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        required
                        disabled={loading || success}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || success}
                      className="w-full mt-4 transition-transform duration-200 hover:-translate-y-0.5"
                      size="lg"
                    >
                      {loading ? 'Updating password...' : 'Update password'}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="expired"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-muted-foreground">
                      Your reset link is no longer valid.
                    </p>
                    <Button asChild className="w-full transition-transform duration-200 hover:-translate-y-0.5" size="lg">
                      <Link href="/forgot-password">Request a new reset link</Link>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
