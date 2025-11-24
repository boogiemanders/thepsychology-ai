'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { validatePromoCode } from '@/lib/promo-codes'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confettiRef = useRef<ConfettiRef>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    promoCode: '',
  })
  const [tierFromPricing, setTierFromPricing] = useState<string | null>(null)

  // Get email and tier from URL parameters
  useEffect(() => {
    const email = searchParams.get('email')
    const tier = searchParams.get('tier')
    if (email) {
      setFormData((prev) => ({ ...prev, email }))
    }
    if (tier) {
      setTierFromPricing(tier)
    }
  }, [searchParams])

  // Fire confetti on successful signup
  useEffect(() => {
    if (success) {
      confettiRef.current?.fire({})
    }
  }, [success])

  const [promoStatus, setPromoStatus] = useState<{
    message: string
    type: 'success' | 'error' | null
  }>({ message: '', type: null })

  const tiers = [
    { name: 'Week Trial', value: 'free', price: '$0', description: 'Limited Access' },
    { name: 'Pro', value: 'pro', price: '$20/mo', description: 'Full Access' },
    { name: 'Pro + Coaching', value: 'pro_coaching', price: '$200/mo', description: 'Full + Calls' },
  ]

  // Set initial tier from URL, default to first tier if not specified
  const selectedTier = tierFromPricing || tiers[0].value

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validatePromoCodeField = async () => {
    if (!formData.promoCode) {
      setPromoStatus({ message: '', type: null })
      return true
    }

    const result = await validatePromoCode(formData.promoCode)
    if (result.isValid) {
      setPromoStatus({
        message: result.message || 'Promo code valid!',
        type: 'success',
      })
      return true
    } else {
      setPromoStatus({
        message: result.error || 'Invalid promo code',
        type: 'error',
      })
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate promo code if provided
    if (formData.promoCode && !promoStatus.type) {
      await validatePromoCodeField()
      return
    }

    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      console.log('Supabase signup response:', { authData, signUpError })

      if (signUpError) {
        console.error('Sign up error:', signUpError)

        // Handle rate limit error with helpful message
        if (signUpError.message?.includes('rate limit') || signUpError.message?.includes('Email rate limit exceeded')) {
          throw new Error('Too many signup attempts. Please wait an hour and try again, or contact support if you need immediate assistance.')
        }

        throw signUpError
      }

      // Check if user was actually created (Supabase sometimes returns success but no user when rate limited)
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        console.warn('User created but no identities - likely already exists or rate limited')
        throw new Error('This email may already be registered, or signup limit reached. Please try logging in instead.')
      }

      if (!authData.user) {
        console.error('No user returned from signup')
        throw new Error('User creation failed - no user returned from Supabase')
      }

      console.log('User created successfully:', authData.user.id)

      console.log('Starting profile creation for user:', authData.user.id)
      try {
        const profileBody = {
          userId: authData.user.id,
          email: formData.email,
          fullName: formData.fullName || null,
          // All new accounts start on the free tier.
          // Paid tiers are unlocked only via Stripe checkout or validated promo flows.
          subscriptionTier: 'free',
          promoCodeUsed: formData.promoCode || null,
        }
        console.log('Profile creation request body:', profileBody)

        const profileResponse = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileBody),
        })

        console.log('Profile creation response status:', profileResponse.status)

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json()
          console.error('Profile creation API error:', {
            status: profileResponse.status,
            error: errorData,
          })
          // Don't throw - account is created, profile creation can be retried
        } else {
          const profileData = await profileResponse.json()
          console.log('Profile created successfully:', profileData)
        }
      } catch (err) {
        console.error('Profile creation request error:', err)
        // Don't throw - account is created even if profile creation fails
      }

      // If promo code was provided, apply it in background
      if (formData.promoCode && promoStatus.type === 'success') {
        supabase
          .from('promo_codes')
          .update({ usage_count: supabase.rpc('increment', { amount: 1 }) })
          .eq('code', formData.promoCode.toUpperCase())
          .catch((err) => console.error('Promo code update error:', err))
      }

      // Show success message after auth and profile creation
      setSuccess(true)
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        promoCode: '',
      })

      // Don't redirect - user needs to verify email first
    } catch (err) {
      console.error('Signup error details:', err)

      let message = 'Sign up failed'

      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'string') {
        message = err
      } else if (err && typeof err === 'object') {
        // Handle object errors (like from Supabase)
        message = JSON.stringify(err)
        console.error('Object error:', err)
      }

      setError(message)
      setLoading(false)
      return
    }

    // Reset loading state after success
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Canvas */}
      <Confetti
        ref={confettiRef}
        className="absolute top-0 left-0 z-50 size-full pointer-events-none"
      />

      {/* Gradient background effects - 4 breaths per minute (15s cycle) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-80"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-breath"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-breath" style={{animationDelay: '7.5s'}}></div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Join EPPP Skills Platform</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-medium mb-2">
                Account created successfully!
              </p>
              <p className="text-green-400 text-sm">
                Please check your email to verify your account. You should receive a confirmation email shortly.
              </p>
            </div>
          )}

          {/* Tier Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Choose Your Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiers.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setTierFromPricing(tier.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-center text-xs ${
                    selectedTier === tier.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{tier.name}</div>
                  <div className="text-blue-400 font-bold text-sm mt-1">{tier.price}</div>
                  <div className="text-slate-400 text-xs mt-1">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name (optional)
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Promo Code */}
            <div>
              <label htmlFor="promoCode" className="block text-sm font-medium text-slate-300 mb-2">
                Promo Code (optional)
              </label>
              <input
                type="text"
                id="promoCode"
                name="promoCode"
                value={formData.promoCode}
                onChange={handleInputChange}
                onBlur={validatePromoCodeField}
                placeholder="Enter promo code for discount"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {promoStatus.type === 'success' && (
                <p className="text-sm text-green-400 mt-2 font-medium">{promoStatus.message}</p>
              )}
              {promoStatus.type === 'error' && (
                <p className="text-sm text-red-400 mt-2 font-medium">{promoStatus.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-blue-400 disabled:to-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>}

          {/* Login Link */}
          {!success &&
          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Log in
            </Link>
          </p>}

          {success && (
            <div className="text-center mt-8">
              <p className="text-slate-400 mb-4">
                Once you verify your email, you'll be able to log in and access your account.
              </p>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition inline-block">
                Go to Login →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  )
}
