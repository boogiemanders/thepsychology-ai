'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ExamResult {
  id: string
  score: number
  percentage: number
  date: string
  section_scores?: {
    [key: string]: number
  }
}

export default function PerformanceDashboard() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [results, setResults] = useState<ExamResult[]>([])
  const [loadingResults, setLoadingResults] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, mounted, router])

  useEffect(() => {
    if (mounted && user && userProfile?.subscription_tier === 'pro') {
      fetchExamResults()
    } else if (mounted && user && userProfile?.subscription_tier !== 'pro') {
      setLoadingResults(false)
    }
  }, [mounted, user, userProfile])

  const fetchExamResults = async () => {
    try {
      const { data, error } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoadingResults(false)
    }
  }

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

  if (userProfile?.subscription_tier !== 'pro' && userProfile?.subscription_tier !== 'premium') {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-80"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-breath"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-breath" style={{animationDelay: '7.5s'}}></div>

        <div className="relative z-10 min-h-screen p-8 flex items-center justify-center">
          <div className="max-w-2xl">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-12 shadow-2xl text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold text-white mb-4">Pro Feature</h1>
              <p className="text-slate-400 mb-8 text-lg">
                Performance analytics are available for Pro tier members who upload exam results.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-blue-500/50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0
  const highestScore = results.length > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0
  const lowestScore = results.length > 0
    ? Math.min(...results.map(r => r.percentage))
    : 0

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 opacity-80"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-breath"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-breath" style={{animationDelay: '7.5s'}}></div>

      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between">
            <div>
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  Performance Analytics
                </span>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Your Results
              </h1>
              <p className="text-slate-400 mt-2">Track your exam performance over time</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/50 rounded-lg transition duration-200"
            >
              ← Back
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
              <p className="text-sm text-slate-400 mb-2">Total Exams</p>
              <p className="text-4xl font-bold text-white">{results.length}</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
              <p className="text-sm text-slate-400 mb-2">Average Score</p>
              <p className="text-4xl font-bold text-cyan-400">{averageScore}%</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
              <p className="text-sm text-slate-400 mb-2">Highest Score</p>
              <p className="text-4xl font-bold text-green-400">{highestScore}%</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
              <p className="text-sm text-slate-400 mb-2">Lowest Score</p>
              <p className="text-4xl font-bold text-red-400">{lowestScore}%</p>
            </div>
          </div>

          {/* Results List */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/50">
              <h2 className="text-2xl font-bold text-white">Exam History</h2>
            </div>

            {loadingResults ? (
              <div className="p-12 text-center">
                <div className="text-slate-400 animate-breath">Loading results...</div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-slate-400 text-lg">No exam results yet</p>
                <p className="text-slate-500 text-sm mt-2">Upload exam screenshots to track your performance</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {results.map((result, index) => (
                  <div key={result.id} className="p-6 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          #{results.length - index}
                        </div>
                        <div>
                          <p className="text-white font-semibold">Exam Attempt</p>
                          <p className="text-sm text-slate-400">
                            {new Date(result.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">{result.percentage}%</p>
                        <p className="text-sm text-slate-400">{result.score} points</p>
                      </div>
                    </div>

                    {result.section_scores && Object.keys(result.section_scores).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/30">
                        <p className="text-sm text-slate-400 mb-3">Section Breakdown</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(result.section_scores).map(([section, score]) => (
                            <div key={section} className="bg-slate-800/30 rounded-lg p-3 text-center">
                              <p className="text-xs text-slate-400 capitalize mb-1">{section}</p>
                              <p className="text-lg font-bold text-cyan-400">{score}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Tips */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="text-3xl">📈</div>
                <div>
                  <h3 className="text-white font-bold mb-2">Keep Improving</h3>
                  <p className="text-slate-400 text-sm">Track your progress across multiple attempts to identify improvement areas</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🎯</div>
                <div>
                  <h3 className="text-white font-bold mb-2">Focus on Weak Areas</h3>
                  <p className="text-slate-400 text-sm">Review section scores to prioritize studying topics where you need the most improvement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
