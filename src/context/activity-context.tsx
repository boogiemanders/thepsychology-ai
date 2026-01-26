'use client'

import { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'

interface ActivityContextType {
  trackPageView: (page: string) => void
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const DEBOUNCE_MS = 1000 // Debounce rapid page changes

// Helper to get current access token
async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
  } catch {
    return null
  }
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const currentPageViewId = useRef<string | null>(null)
  const lastHeartbeat = useRef<number>(0)
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const pageEnteredAt = useRef<number>(Date.now())
  const lastTrackedPath = useRef<string | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // Send heartbeat to update last_activity_at
  const sendHeartbeat = useCallback(async (page: string) => {
    if (!user?.id) return

    const now = Date.now()
    // Skip if we recently sent a heartbeat
    if (now - lastHeartbeat.current < HEARTBEAT_INTERVAL / 2) return

    lastHeartbeat.current = now

    try {
      const token = await getAccessToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch('/api/user-activity', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'heartbeat',
          page,
        }),
      })
    } catch (error) {
      // Silently fail - activity tracking is not critical
      console.debug('[activity] heartbeat failed:', error)
    }
  }, [user?.id])

  // Track page view start
  const trackPageEnter = useCallback(async (page: string) => {
    if (!user?.id) return

    pageEnteredAt.current = Date.now()
    lastTrackedPath.current = page

    try {
      const token = await getAccessToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/user-activity', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'enter',
          page,
        }),
      })

      const data = await response.json()
      if (data.pageViewId) {
        currentPageViewId.current = data.pageViewId
      }
    } catch (error) {
      console.debug('[activity] page enter failed:', error)
    }
  }, [user?.id])

  // Track page view exit
  const trackPageExit = useCallback(async () => {
    if (!user?.id || !currentPageViewId.current) return

    const durationMs = Date.now() - pageEnteredAt.current
    const pageViewId = currentPageViewId.current
    currentPageViewId.current = null

    try {
      const token = await getAccessToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch('/api/user-activity', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'exit',
          pageViewId,
          durationMs,
        }),
      })
    } catch (error) {
      console.debug('[activity] page exit failed:', error)
    }
  }, [user?.id])

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched away - record page exit
        trackPageExit()
      } else if (document.visibilityState === 'visible' && pathname) {
        // User came back - re-enter the page
        trackPageEnter(pathname)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pathname, trackPageEnter, trackPageExit])

  // Handle pathname changes with debounce
  useEffect(() => {
    if (!user?.id || !pathname) return

    // Clear any pending debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Debounce to avoid tracking rapid navigation
    debounceTimeout.current = setTimeout(() => {
      // If path changed, exit old page and enter new
      if (lastTrackedPath.current && lastTrackedPath.current !== pathname) {
        trackPageExit()
      }
      trackPageEnter(pathname)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [pathname, user?.id, trackPageEnter, trackPageExit])

  // Setup heartbeat interval
  useEffect(() => {
    if (!user?.id) {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
        heartbeatInterval.current = null
      }
      return
    }

    // Send initial heartbeat
    if (pathname) {
      sendHeartbeat(pathname)
    }

    // Setup interval
    heartbeatInterval.current = setInterval(() => {
      if (pathname && document.visibilityState === 'visible') {
        sendHeartbeat(pathname)
      }
    }, HEARTBEAT_INTERVAL)

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
        heartbeatInterval.current = null
      }
    }
  }, [user?.id, pathname, sendHeartbeat])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackPageExit()
    }
  }, [trackPageExit])

  const trackPageView = useCallback((page: string) => {
    trackPageEnter(page)
  }, [trackPageEnter])

  return (
    <ActivityContext.Provider value={{ trackPageView }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const context = useContext(ActivityContext)
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}
