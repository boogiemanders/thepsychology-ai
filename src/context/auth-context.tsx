'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { handleUserSwitch } from '@/lib/local-study-storage'

// Session timeout configuration (in milliseconds)
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 hours idle timeout
const MAX_SESSION_MS = 24 * 60 * 60 * 1000 // 24 hours max session
const WARNING_BEFORE_MS = 5 * 60 * 1000 // Show warning 5 minutes before expiry

interface UserProfile {
  id: string
  email: string
  full_name?: string
  subscription_tier: 'free' | 'basic' | 'pro' | 'pro_coaching'
  exam_date?: string
  created_at: string
  subscription_started_at?: string
  stripe_customer_id?: string
}

interface ConsentPreferences {
  consent_personal_tracking: boolean
  consent_ai_insights: boolean
  consent_research_contribution: boolean
  consent_marketing_communications: boolean
  consent_version: string
  is_default?: boolean
}

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: UserProfile | null
  consentPreferences: ConsentPreferences | null
  loading: boolean
  error: string | null
  showSessionWarning: boolean
  sessionExpiresIn: number // seconds until session expires
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshConsent: () => Promise<void>
  updateConsent: (updates: Partial<ConsentPreferences>) => Promise<void>
  extendSession: () => void // Reset idle timer when user clicks "Stay logged in"
  dismissSessionWarning: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Session timeout state
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const [sessionExpiresIn, setSessionExpiresIn] = useState(0)
  const sessionStartTimeRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const maxSessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update last activity on user interaction
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    // If warning is shown and user interacts, they might want to extend
    // But don't auto-dismiss - let them explicitly click "Stay logged in"
  }, [])

  // Clear all session timers
  const clearSessionTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (maxSessionTimerRef.current) clearTimeout(maxSessionTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setShowSessionWarning(false)
    setSessionExpiresIn(0)
  }, [])

  // Start session timers when user logs in
  const startSessionTimers = useCallback(() => {
    clearSessionTimers()
    sessionStartTimeRef.current = Date.now()
    lastActivityRef.current = Date.now()

    // Set up idle timeout warning
    const scheduleIdleWarning = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

      const timeSinceActivity = Date.now() - lastActivityRef.current
      const timeUntilIdleWarning = Math.max(0, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS - timeSinceActivity)

      idleTimerRef.current = setTimeout(() => {
        // Check if we should show warning
        const currentIdleTime = Date.now() - lastActivityRef.current
        if (currentIdleTime >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
          const expiresAt = lastActivityRef.current + IDLE_TIMEOUT_MS
          showWarning(expiresAt)
        } else {
          // Activity happened, reschedule
          scheduleIdleWarning()
        }
      }, timeUntilIdleWarning)
    }

    // Set up max session timeout (absolute, can't be extended)
    const maxSessionExpiresAt = sessionStartTimeRef.current + MAX_SESSION_MS
    const timeUntilMaxWarning = MAX_SESSION_MS - WARNING_BEFORE_MS

    warningTimerRef.current = setTimeout(() => {
      showWarning(maxSessionExpiresAt, true)
    }, timeUntilMaxWarning)

    maxSessionTimerRef.current = setTimeout(() => {
      handleSessionExpired('Your session has expired for security. Please sign in again.')
    }, MAX_SESSION_MS)

    scheduleIdleWarning()
  }, [clearSessionTimers])

  const showWarning = useCallback((expiresAt: number, isMaxSession: boolean = false) => {
    setShowSessionWarning(true)

    // Start countdown
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setSessionExpiresIn(remaining)

      if (remaining <= 0) {
        handleSessionExpired('Your session has expired for security. Please sign in again.')
      }
    }

    updateCountdown()
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    countdownIntervalRef.current = setInterval(updateCountdown, 1000)
  }, [])

  const handleSessionExpired = useCallback(async (message: string) => {
    clearSessionTimers()
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setConsentPreferences(null)
    // Store message for login page to display
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sessionExpiredMessage', message)
      window.location.href = '/login'
    }
  }, [clearSessionTimers])

  const extendSession = useCallback(() => {
    // Reset idle timer (max session cannot be extended)
    lastActivityRef.current = Date.now()
    setShowSessionWarning(false)
    setSessionExpiresIn(0)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    // Reschedule idle warning
    if (user && idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      const scheduleIdleWarning = () => {
        idleTimerRef.current = setTimeout(() => {
          const expiresAt = lastActivityRef.current + IDLE_TIMEOUT_MS
          showWarning(expiresAt)
        }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)
      }
      scheduleIdleWarning()
    }
  }, [user, showWarning])

  const dismissSessionWarning = useCallback(() => {
    setShowSessionWarning(false)
  }, [])

  // Track user activity for idle timeout
  useEffect(() => {
    if (!user) return

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }))

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity))
    }
  }, [user, updateActivity])

  // Initialize auth state
  useEffect(() => {
    let initialCheckDone = false

    // Listen for auth changes - this handles login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initialCheckDone) {
        // First call is the initial state
        initialCheckDone = true
        setLoading(false)
      }

      setUser(session?.user ?? null)
      handleUserSwitch(session?.user?.id ?? null)

      if (session?.user) {
        // Start session timeout timers
        startSessionTimers()

        // Notify backend of login (for alerts, hidden from changelog)
        if (event === 'SIGNED_IN' && session.access_token) {
          fetch('/api/login-notify', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).catch(() => {
            // Silently fail - not critical
          })
        }

        // Fetch user profile on auth change (don't await since it can hang)
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(async ({ data, error: fetchError }) => {
            if (fetchError?.code === 'PGRST116' && session?.user) {
              // User exists in auth but not in users table - create profile
              // This handles orphaned users (auth signup succeeded but profile creation failed)
              console.log('Profile not found, creating for orphaned user:', session.user.email)
              try {
                const res = await fetch('/api/auth/create-profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: session.user.id,
                    email: session.user.email,
                    subscriptionTier: 'pro', // Default to pro until end of Jan
                  }),
                })
                if (res.ok) {
                  const { data: newProfile } = await res.json()
                  setUserProfile(newProfile?.[0] || {
                    id: session.user.id,
                    email: session.user.email || '',
                    subscription_tier: 'pro',
                    created_at: new Date().toISOString(),
                    subscription_started_at: new Date().toISOString(),
                  })
                } else {
                  console.error('Failed to create profile for orphaned user')
                  // Fall back to local state
                  setUserProfile({
                    id: session.user.id,
                    email: session.user.email || '',
                    subscription_tier: 'pro',
                    created_at: new Date().toISOString(),
                    subscription_started_at: new Date().toISOString(),
                  })
                }
              } catch (createErr) {
                console.error('Error creating profile for orphaned user:', createErr)
                // Fall back to local state
                setUserProfile({
                  id: session.user.id,
                  email: session.user.email || '',
                  subscription_tier: 'pro',
                  created_at: new Date().toISOString(),
                  subscription_started_at: new Date().toISOString(),
                })
              }
            } else if (fetchError) {
              console.error('Error fetching user profile:', fetchError)
            } else {
              setUserProfile(data)
            }
          })
          .catch(err => {
            console.error('Profile fetch failed:', err)
          })

        // Fetch consent preferences
        supabase
          .from('user_consent_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data, error: fetchError }) => {
            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error('Error fetching consent preferences:', fetchError)
            }
            // Set defaults if no preferences exist
            setConsentPreferences(
              data || {
                consent_personal_tracking: true,
                consent_ai_insights: true,
                consent_research_contribution: true,
                consent_marketing_communications: true,
                consent_version: '1.0',
                is_default: true,
              }
            )
          })
          .catch(err => {
            console.error('Consent fetch failed:', err)
          })

        // Set a timeout to create a basic profile if fetch doesn't complete
        setTimeout(() => {
          setUserProfile(prev => {
            if (!prev && session?.user) {
              return {
                id: session.user.id,
                email: session.user.email || '',
                subscription_tier: 'pro',
                created_at: new Date().toISOString(),
                subscription_started_at: new Date().toISOString(),
              }
            }
            return prev
          })
        }, 3000)
      } else {
        // Clear session timers on logout
        clearSessionTimers()
        setUserProfile(null)
        setConsentPreferences(null)
      }
    })

    // Set a fallback timeout in case onAuthStateChange never fires
    const fallbackTimeout = setTimeout(() => {
      if (!initialCheckDone) {
        setLoading(false)
        initialCheckDone = true
      }
    }, 1000)

    return () => {
      clearTimeout(fallbackTimeout)
      subscription?.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error refreshing user profile:', fetchError)
      } else {
        setUserProfile(data)
      }
    } catch (err) {
      console.error('Profile refresh failed:', err)
    }
  }

  const refreshConsent = async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await supabase
        .from('user_consent_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error refreshing consent preferences:', fetchError)
      }

      setConsentPreferences(
        data || {
          consent_personal_tracking: true,
          consent_ai_insights: true,
          consent_research_contribution: true,
          consent_marketing_communications: true,
          consent_version: '1.0',
          is_default: true,
        }
      )
    } catch (err) {
      console.error('Consent refresh failed:', err)
    }
  }

  const updateConsent = async (updates: Partial<ConsentPreferences>) => {
    if (!user) return

    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.access_token) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/consent/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update consent preferences')
      }

      const result = await response.json()
      if (result.preferences) {
        setConsentPreferences(result.preferences)
      } else {
        await refreshConsent()
      }
    } catch (err) {
      console.error('Consent update failed:', err)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      clearSessionTimers()
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      setError(message)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        consentPreferences,
        loading,
        error,
        showSessionWarning,
        sessionExpiresIn,
        signOut,
        refreshProfile,
        refreshConsent,
        updateConsent,
        extendSession,
        dismissSessionWarning,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
