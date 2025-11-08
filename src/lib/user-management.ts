export interface User {
  id: string
  email: string
  tier: '7-Day Free Trial' | 'Pro' | 'Pro + Coaching'
  createdAt: string
  trialExpiresAt: string | null
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null

  const userStr = localStorage.getItem('currentUser')
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function isTrialExpired(user: User): boolean {
  if (!user.trialExpiresAt) return false

  const expiryDate = new Date(user.trialExpiresAt)
  const now = new Date()

  return now > expiryDate
}

export function getTrialDaysRemaining(user: User): number {
  if (!user.trialExpiresAt) return 0

  const expiryDate = new Date(user.trialExpiresAt)
  const now = new Date()

  if (now > expiryDate) return 0

  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, daysRemaining)
}

export function logout(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem('currentUser')
  window.location.href = '/'
}

export function login(email: string, password: string): User | null {
  if (typeof window === 'undefined') return null

  const usersStr = localStorage.getItem('users')
  if (!usersStr) return null

  try {
    const users = JSON.parse(usersStr)
    const user = users.find((u: any) => u.email === email && u.password === password)

    if (!user) return null

    // Check if free trial has expired
    if (user.tier === '7-Day Free Trial' && isTrialExpired(user)) {
      return null
    }

    // Set current user
    const currentUser: User = {
      id: user.id,
      email: user.email,
      tier: user.tier,
      createdAt: user.createdAt,
      trialExpiresAt: user.trialExpiresAt,
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser))
    return currentUser
  } catch {
    return null
  }
}

export function canAccessFeature(user: User | null, feature: 'all-topics' | 'recovery'): boolean {
  if (!user) return false

  // Free trial users cannot access all topics or recovery
  if (user.tier === '7-Day Free Trial') {
    return false
  }

  // Pro and Pro + Coaching can access all features
  return true
}

export function getTopicLimit(user: User | null): number {
  if (!user) return 0

  // Free trial limited to 1 topic
  if (user.tier === '7-Day Free Trial') {
    return 1
  }

  // Pro and Pro + Coaching have unlimited topics
  return Infinity
}
