'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, mounted, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-lg text-slate-400 animate-breath">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-80"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-breath"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-breath" style={{animationDelay: '7.5s'}}></div>

      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with greeting */}
          <div className="mb-12">
            <div className="inline-block mb-4">
              <span className="text-sm font-medium text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                Welcome back
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {userProfile?.full_name || 'Study Buddy'}
            </h1>
            <p className="text-slate-400 text-lg">
              {userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium'
                ? 'Pro tier • Full access to all features'
                : '7-day free trial • Limited to one topic per domain'}
            </p>
          </div>

          {/* Account Card */}
          <div className="mb-8 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Email</p>
                <p className="text-white font-medium">{userProfile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Subscription Tier</p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium capitalize">{userProfile?.subscription_tier}</span>
                  {(userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium') && (
                    <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                      ✨ PREMIUM
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Member Since</p>
                <p className="text-white font-medium">
                  {userProfile?.subscription_started_at
                    ? new Date(userProfile.subscription_started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recently'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Quiz Score Card */}
            <div className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400">Latest Quiz Score</h3>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <span className="text-lg">📊</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">—</div>
              <p className="text-sm text-slate-500">Take a quiz to see your score</p>
            </div>

            {/* Study Time Card */}
            <div className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400">Total Study Time</h3>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <span className="text-lg">⏱️</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">0h 0m</div>
              <p className="text-sm text-slate-500">Keep up the momentum</p>
            </div>

            {/* Topics Mastered Card */}
            <div className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400">Topics Mastered</h3>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <span className="text-lg">🎯</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">0</div>
              <p className="text-sm text-slate-500">Topics completed</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Start Studying Card */}
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 shadow-2xl hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Start Studying</h3>
                  <p className="text-slate-400 text-sm">Choose a topic and begin your learning journey</p>
                </div>
                <span className="text-3xl">📚</span>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-lg hover:shadow-blue-500/50">
                Go to Study Tools
              </button>
            </div>

            {/* Performance Analytics Card (Pro only) */}
            <div className={`${userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? 'bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/20 hover:border-cyan-500/50' : 'bg-slate-900/40 border-slate-800/50 opacity-60'} backdrop-blur-xl border rounded-2xl p-8 shadow-2xl transition-all duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Performance Analytics</h3>
                  <p className="text-slate-400 text-sm">
                    {userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium'
                      ? 'View your exam results and progress analytics'
                      : 'Available for Pro tier members'}
                  </p>
                </div>
                <span className="text-3xl">{userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? '📊' : '🔒'}</span>
              </div>
              <button
                onClick={() => userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? router.push('/dashboard/performance') : null}
                disabled={userProfile?.subscription_tier !== 'pro' && userProfile?.subscription_tier !== 'premium'}
                className={`w-full mt-4 ${userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-lg hover:shadow-cyan-500/50' : 'bg-slate-700 cursor-not-allowed'} text-white font-semibold py-2 px-4 rounded-lg transition duration-200`}>
                {userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? 'View Analytics' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* Upload Results Card (Pro only) */}
            <div className={`${userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/20 hover:border-purple-500/50' : 'bg-slate-900/40 border-slate-800/50 opacity-60'} backdrop-blur-xl border rounded-2xl p-8 shadow-2xl transition-all duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Exam Results</h3>
                  <p className="text-slate-400 text-sm">
                    {userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium'
                      ? 'Upload screenshots of your exam results for tracking'
                      : 'Available for Pro tier members'}
                  </p>
                </div>
                <span className="text-3xl">{userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? '📸' : '🔒'}</span>
              </div>
              <button disabled={userProfile?.subscription_tier !== 'pro' && userProfile?.subscription_tier !== 'premium'} className={`w-full mt-4 ${userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-purple-500/50' : 'bg-slate-700 cursor-not-allowed'} text-white font-semibold py-2 px-4 rounded-lg transition duration-200`}>
                {userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'premium' ? 'Upload Results' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Coming Soon</h3>
                <p className="text-slate-400 leading-relaxed">
                  We're building powerful new features including detailed performance analytics with section-by-section breakdowns,
                  personalized study recommendations based on your weak areas, comprehensive exam result tracking and history,
                  and adaptive learning paths to help you master the EPPP. Stay tuned!
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="mt-12 flex justify-end">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

function SignOutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="px-6 py-3 bg-slate-900/40 hover:bg-slate-800/40 disabled:bg-slate-800 border border-slate-800/50 hover:border-red-500/50 text-white font-medium rounded-lg transition duration-200"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
