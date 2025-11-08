'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { SectionHeader } from '@/components/section-header'

type PricingTier = '7-Day Free Trial' | 'Pro' | 'Pro + Coaching'
type SignupStep = 'email' | 'goals' | 'password' | 'confirmation'

export function SignupSection() {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>('email')
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [email, setEmail] = useState('')
  const [timeline, setTimeline] = useState('')
  const [goalAfterLicensure, setGoalAfterLicensure] = useState('')
  const [examDate, setExamDate] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check for pre-selected tier from pricing section
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tier = sessionStorage.getItem('selectedTier') as PricingTier | null
      if (tier) {
        setSelectedTier(tier)
        sessionStorage.removeItem('selectedTier')
      }
    }
  }, [])

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

    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
    if (existingUsers.some((u: any) => u.email === email)) {
      setError('This email is already registered')
      return
    }

    setStep('goals')
  }

  const handleGoalsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')

      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        tier: selectedTier,
        createdAt: new Date().toISOString(),
        trialExpiresAt: selectedTier === '7-Day Free Trial'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        goals: {
          timeline: timeline || null,
          goalAfterLicensure: goalAfterLicensure || null,
          examDate: examDate || null,
        },
      }

      existingUsers.push(newUser)
      localStorage.setItem('users', JSON.stringify(existingUsers))

      localStorage.setItem('currentUser', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        tier: newUser.tier,
        trialExpiresAt: newUser.trialExpiresAt,
      }))

      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/app')
    } catch (err) {
      setError('Failed to create account. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'email') {
      // On back from email, we should probably stay here or allow going back somehow
      // For now, let's just allow resetting the email
      setEmail('')
      setError('')
    } else if (step === 'goals') {
      setStep('email')
      setTimeline('')
      setGoalAfterLicensure('')
      setExamDate('')
      setError('')
    } else if (step === 'password') {
      setStep('goals')
      setPassword('')
      setConfirmPassword('')
      setError('')
    } else if (step === 'confirmation') {
      setStep('password')
    }
  }

  return (
    <section id="get-started" className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative py-20">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Get Started Today
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Create your account and choose your learning plan
        </p>
      </SectionHeader>

      <div className="w-full max-w-2xl px-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Email */}
          {step === 'email' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Step 1: Enter Your Email</h3>
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-12 bg-secondary text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 'goals' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Step 2: Share Your Goals (Optional)</h3>
                <p className="text-muted-foreground">Help us understand your EPPP journey</p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{email}</p>
              </div>

              <form onSubmit={handleGoalsSubmit} className="space-y-4">
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium mb-2">
                    When do you plan to take the EPPP?
                  </label>
                  <input
                    type="text"
                    id="timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g., In 3 months, Next summer, etc."
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="goalAfterLicensure" className="block text-sm font-medium mb-2">
                    What are your goals after licensure?
                  </label>
                  <input
                    type="text"
                    id="goalAfterLicensure"
                    value={goalAfterLicensure}
                    onChange={(e) => setGoalAfterLicensure(e.target.value)}
                    placeholder="e.g., Private practice, Clinical research, etc."
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="examDate" className="block text-sm font-medium mb-2">
                    Do you have a scheduled exam date?
                  </label>
                  <input
                    type="date"
                    id="examDate"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  These fields are optional and help us personalize your study plan
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-12 bg-secondary text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 'password' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Step 3: Create Password</h3>
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-12 bg-secondary text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Step 4: Review Your Account</h3>
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
    </section>
  )
}
