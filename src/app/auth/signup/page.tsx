'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { validatePromoCode } from '@/lib/promo-codes'

export default function SignUpPage() {
  const router = useRouter()
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
        throw signUpError
      }

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName || null,
          subscription_tier: formData.promoCode ? 'pro' : 'free',
          promo_code_used: formData.promoCode || null,
          subscription_started_at: new Date().toISOString(),
        },
      ])

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw - account is created, profile might have issues
      }

      // If promo code was provided, apply it
      if (formData.promoCode && promoStatus.type === 'success') {
        await supabase
          .from('promo_codes')
          .update({ usage_count: supabase.rpc('increment', { amount: 1 }) })
          .eq('code', formData.promoCode.toUpperCase())
          .catch((err) => console.error('Promo code update error:', err))
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Create Account
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Join EPPP Skills Platform
        </p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">
              Account created successfully! Redirecting to dashboard...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name (optional)
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Promo Code */}
          <div>
            <label htmlFor="promoCode" className="block text-sm font-medium text-slate-700 mb-2">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {promoStatus.type === 'success' && (
              <p className="text-sm text-green-600 mt-1">{promoStatus.message}</p>
            )}
            {promoStatus.type === 'error' && (
              <p className="text-sm text-red-600 mt-1">{promoStatus.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200 mt-6"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-slate-600 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
