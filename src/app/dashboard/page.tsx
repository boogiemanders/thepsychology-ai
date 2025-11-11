'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome, {userProfile?.full_name || userProfile?.email}!
          </h1>
          <p className="text-slate-600">Your EPPP study dashboard</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="text-lg font-medium text-slate-900">{userProfile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Subscription Tier</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-slate-900 capitalize">
                  {userProfile?.subscription_tier}
                </span>
                {userProfile?.subscription_tier !== 'free' && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quiz Score Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Latest Quiz Score</h3>
            <div className="text-3xl font-bold text-slate-900">—</div>
            <p className="text-sm text-slate-500 mt-2">No quizzes completed yet</p>
          </div>

          {/* Study Time Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Study Time</h3>
            <div className="text-3xl font-bold text-slate-900">0h</div>
            <p className="text-sm text-slate-500 mt-2">Minutes logged</p>
          </div>

          {/* Topics Mastered Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Topics Mastered</h3>
            <div className="text-3xl font-bold text-slate-900">0</div>
            <p className="text-sm text-slate-500 mt-2">Topics completed</p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Coming Soon</h3>
          <p className="text-blue-800">
            More dashboard features are coming soon, including detailed performance analytics,
            study recommendations, and exam result tracking!
          </p>
        </div>

        {/* Sign Out Button */}
        <div className="mt-8 flex justify-end">
          <SignOutButton />
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
      className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition duration-200"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
