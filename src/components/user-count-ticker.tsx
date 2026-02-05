"use client"

import { useEffect, useState, useRef } from "react"
import { NumberTicker } from "@/components/ui/number-ticker"
import { createClient } from "@supabase/supabase-js"

export function UserCountTicker({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [displayCount, setDisplayCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Initial fetch
    fetch('/api/user-count')
      .then(res => res.json())
      .then(data => setCount(data.count))
      .catch(() => {})

    // Set up real-time subscription (listens for INSERT on users table)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const channel = supabase
      .channel('user-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        () => {
          // Just increment - don't refetch to avoid unnecessary API calls
          setCount(prev => (prev ?? 0) + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Trigger animation after count is fetched
  useEffect(() => {
    if (count !== null && !hasAnimated.current) {
      hasAnimated.current = true
      // Small delay to ensure the component with 0 is mounted first
      const timer = setTimeout(() => {
        setDisplayCount(count)
      }, 50)
      return () => clearTimeout(timer)
    } else if (count !== null && hasAnimated.current) {
      // For real-time updates, update immediately
      setDisplayCount(count)
    }
  }, [count])

  if (count === null) return null

  return (
    <p className={className}>
      <NumberTicker value={displayCount} startValue={0} className="font-bold text-primary" />+ postdocs studying
    </p>
  )
}
