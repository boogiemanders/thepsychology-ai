'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { logout } from '@/lib/user-management'

export default function TrialExpiredPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-4">Trial Expired</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your 7-day free trial has ended. Upgrade to a paid plan to continue accessing EPPP study materials.
        </p>

        <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-4">Upgrade to continue learning</h2>
          <ul className="text-left space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">✓</span>
              <span>Unlimited access to all topics</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">✓</span>
              <span>Recovery and wellness tools</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">✓</span>
              <span>Custom study plans</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">✓</span>
              <span>Full access to diagnostic exam</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/#pricing">
            <button className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              View Pricing Plans
            </button>
          </Link>

          <button
            onClick={logout}
            className="w-full h-12 bg-secondary text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Log Out
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Questions? Contact us at{' '}
          <a href="mailto:support@thepsychology.ai" className="text-primary hover:underline">
            support@thepsychology.ai
          </a>
        </p>
      </motion.div>
    </main>
  )
}
