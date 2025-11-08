'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { motion } from 'motion/react'

type PricingTier = '7-Day Free Trial' | 'Pro' | 'Pro + Coaching'
type SignupStep = 'tier-selection' | 'email' | 'password' | 'confirmation'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>('tier-selection')
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tierInfo = {
    '7-Day Free Trial': {
      price: '$0',
      description: 'Try the program free for 7 days. Limited to one topic.',
      features: ['Diagnostic Exam', 'Prioritizing Focus', 'Custom Study (1 Topic)'],
    },
    'Pro': {
      price: '$20/month',
      description: 'Unlimited access to all topics and recovery tools.',
      features: ['Diagnostic Exam', 'Prioritizing Focus', 'Custom Study (All Topics)', 'Recovery Tools'],
    },
    'Pro + Coaching': {
      price: '$200/month',
      description: 'Everything in Pro + 2 calls per month with Dr. Anders Chan.',
      features: ['Everything in Pro', '2× 45-min calls/month', 'Personal study plan', 'Priority support'],
    },
  }

  const handleTierSelection = (tier: PricingTier) => {
    setSelectedTier(tier)
    setError('')
    setStep('email')
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email is required')
      return
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address')
      return
    }

    // Check if email already exists in localStorage (simple check)
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
    if (existingUsers.some((u: any) => u.email === email)) {
      setError('This email is already registered')
      return
    }

    setStep('password')
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setStep('confirmation')
  }

  const handleCreateAccount = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Store user data
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')

      const newUser = {
        id: Date.now().toString(),
        email,
        password: password, // In production, this should be hashed
        tier: selectedTier,
        createdAt: new Date().toISOString(),
        trialExpiresAt: selectedTier === '7-Day Free Trial'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      }

      existingUsers.push(newUser)
      localStorage.setItem('users', JSON.stringify(existingUsers))

      // Set current user
      localStorage.setItem('currentUser', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        tier: newUser.tier,
        trialExpiresAt: newUser.trialExpiresAt,
      }))

      // Wait a moment for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to app
      router.push('/app')
    } catch (err) {
      setError('Failed to create account. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'tier-selection') {
      router.back()
    } else if (step === 'email') {
      setStep('tier-selection')
      setSelectedTier(null)
      setEmail('')
      setError('')
    } else if (step === 'password') {
      setStep('email')
      setPassword('')
      setConfirmPassword('')
      setError('')
    } else if (step === 'confirmation') {
      setStep('password')
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-12">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-primary hover:underline mb-8"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <h1 className="text-4xl md:text-5xl font-bold mb-2">Get Started</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Create your account and choose your learning plan
            </p>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Tier Selection */}
            {step === 'tier-selection' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Step 1: Choose Your Plan</h2>
                  <p className="text-muted-foreground">Select the plan that works best for you</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {(Object.keys(tierInfo) as PricingTier[]).map((tier) => (
                    <motion.button
                      key={tier}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleTierSelection(tier)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        tier === '7-Day Free Trial'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <h3 className="font-semibold text-lg mb-2">{tier}</h3>
                      <p className="text-primary text-2xl font-bold mb-4">
                        {tierInfo[tier].price}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {tierInfo[tier].description}
                      </p>
                      <ul className="space-y-2">
                        {tierInfo[tier].features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Email */}
            {step === 'email' && (
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Step 2: Enter Your Email</h2>
                  <p className="text-muted-foreground">We'll use this to sign in to your account</p>
                </div>

                {selectedTier && (
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm font-medium text-muted-foreground">Selected Plan</p>
                    <p className="text-lg font-semibold mt-1">{selectedTier}</p>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-destructive/10 border border-destructive/30 rounded-lg p-3"
                    >
                      <p className="text-sm text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Password */}
            {step === 'password' && (
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Step 3: Create Password</h2>
                  <p className="text-muted-foreground">This will secure your account</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-foreground">{selectedTier}</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      At least 8 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-destructive/10 border border-destructive/30 rounded-lg p-3"
                    >
                      <p className="text-sm text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 'confirmation' && (
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Review Your Account</h2>
                  <p className="text-muted-foreground">
                    {selectedTier === '7-Day Free Trial'
                      ? 'Your trial starts now and expires in 7 days'
                      : 'Welcome to your new plan'}
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground mt-1">{email}</p>
                  </div>
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                    <p className="text-foreground font-semibold mt-1">{selectedTier}</p>
                  </div>
                  {selectedTier === '7-Day Free Trial' && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Trial Expires</p>
                      <p className="text-foreground mt-1">
                        {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account & Get Started'}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  )
}
