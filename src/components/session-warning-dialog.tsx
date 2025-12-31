'use client'

import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Clock } from 'lucide-react'

export function SessionWarningDialog() {
  const { showSessionWarning, sessionExpiresIn, extendSession, signOut } = useAuth()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={showSessionWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="pt-2">
            Your session will expire in{' '}
            <span className="font-semibold text-foreground">{formatTime(sessionExpiresIn)}</span>{' '}
            for security reasons.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Click &quot;Stay logged in&quot; to continue your session, or you will be automatically signed out.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => signOut()}>
            Sign out now
          </Button>
          <Button onClick={extendSession}>
            Stay logged in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
