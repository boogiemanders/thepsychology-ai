'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { validatePromoCode } from '@/lib/promo-codes'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [promoStatus, setPromoStatus] = useState<{
    message: string
    type: 'success' | 'error' | null
  }>({ message: '', type: null })

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

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        throw signUpError
      }

      if (!authData.user) {
        console.error('No user returned from signup')
        throw new Error('User creation failed - no user returned from Supabase')
      }

      console.log('User created successfully:', authData.user.id)

      // Create user profile via API endpoint
      // Use tier from pricing form if available, otherwise use promo code or free tier
      const subscriptionTier = tierFromPricing || (formData.promoCode ? 'pro' : 'free')

      try {
        const profileResponse = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: authData.user.id,
            email: formData.email,
            fullName: formData.fullName || undefined,
            subscriptionTier: subscriptionTier,
            promoCode: formData.promoCode || undefined,
          }),
        })

        const profileData = await profileResponse.json()

        if (!profileResponse.ok) {
          console.error('Profile creation error:', profileData)
          setError(`Profile creation failed: ${profileData.error || 'Unknown error'}`)
          // Don't throw - account is created, profile might have issues
        } else {
          console.log('User profile created successfully')
        }
      } catch (profileCatchError) {
        console.error('Profile catch error:', profileCatchError)
        setError(`Failed to create profile: ${profileCatchError instanceof Error ? profileCatchError.message : 'Unknown error'}`)
      }

      // If promo code was provided, apply it
      if (formData.promoCode && promoStatus.type === 'success') {
        try {
          const { data: promoData } = await supabase
            .from('promo_codes')
            .select('usage_count')
            .eq('code', formData.promoCode.toUpperCase())
            .single()

          if (promoData) {
            await supabase
              .from('promo_codes')
              .update({ usage_count: (promoData.usage_count || 0) + 1 })
              .eq('code', formData.promoCode.toUpperCase())
          }
        } catch (err) {
          console.error('Promo code update error:', err)
        }
      }

      setSuccess(true)
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        promoCode: '',
      })

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
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
              <p className="text-green-400 font-medium">
                Account created successfully! Redirecting to dashboard...
              </p>
            </div>
          )}

          {/* Tier Info Message */}
          {tierFromPricing && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 font-medium">
                ✨ You're signing up for the <span className="font-bold capitalize">{tierFromPricing}</span> plan from the pricing form
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
          </form>

          {/* Login Link */}
          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
