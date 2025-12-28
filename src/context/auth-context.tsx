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

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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
        loading,
        error,
        signOut,
        refreshProfile,
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
