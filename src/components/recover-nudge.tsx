"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RecoverNudgeProps = {
  title?: string
  message: string
  onDismiss?: () => void
  className?: string
  href?: string
}

export function RecoverNudge({ title, message, onDismiss, className, href }: RecoverNudgeProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const returnTo = `${pathname}${search ? `?${search}` : ""}`
  const defaultHref = `/recover?entry=quick-reset&returnTo=${encodeURIComponent(returnTo)}`
  const content = title ? `${title}: ${message}` : message

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-900/70 dark:text-amber-200/80",
        className
      )}
    >
      <Link
        href={href ?? defaultHref}
        className="flex-1 text-left leading-snug transition-colors hover:text-amber-900 dark:hover:text-amber-100"
      >
        {content}
      </Link>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDismiss}
          aria-label="Dismiss"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
