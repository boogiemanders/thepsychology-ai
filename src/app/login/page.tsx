'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TypographyH1, TypographyMuted } from '@/components/ui/typography'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)

    try {
      // Start the sign-in process (don't await it since it hangs)
      supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      }).catch(err => {
        setError(err.message || 'Login failed')
        setLoading(false)
      })

      // Redirect to dashboard after a delay (auth context will handle setting the user)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-2">
            <TypographyH1>Welcome Back</TypographyH1>
            <CardDescription>
              Log in to your EPPP Skills account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Your password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6"
                size="lg"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>

            <div className="text-center">
              <TypographyMuted>
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </TypographyMuted>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
