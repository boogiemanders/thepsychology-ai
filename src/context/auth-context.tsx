'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { handleUserSwitch } from '@/lib/local-study-storage'

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
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshConsent: () => Promise<void>
  updateConsent: (updates: Partial<ConsentPreferences>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        // Fetch user profile on auth change (don't await since it can hang)
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error: fetchError }) => {
            if (fetchError && fetchError.code !== 'PGRST116') {
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
                consent_research_contribution: false,
                consent_marketing_communications: false,
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
          consent_research_contribution: false,
          consent_marketing_communications: false,
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
        signOut,
        refreshProfile,
        refreshConsent,
        updateConsent,
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
