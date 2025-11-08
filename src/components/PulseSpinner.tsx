'use client'

import { motion } from 'motion/react'

interface PulseSpinnerProps {
  message?: string
  fullScreen?: boolean
}

export function PulseSpinner({
  message = 'Loading...',
  fullScreen = true,
}: PulseSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${
        fullScreen
          ? 'fixed inset-0 z-50 bg-background'
          : 'flex-1 bg-transparent'
      } flex flex-col items-center justify-center`}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
      >
        <style>{`
          .spinner_VpEe {
            animation: spinner_vXu6 1.2s cubic-bezier(0.52,.6,.25,.99) infinite
          }
          .spinner_eahp {
            animation-delay: .4s
          }
          .spinner_f7Y2 {
            animation-delay: .8s
          }
          @keyframes spinner_vXu6 {
            0% {
              r: 0;
              opacity: 1
            }
            100% {
              r: 11px;
              opacity: 0
            }
          }
        `}</style>
        <circle
          className="spinner_VpEe"
          cx="12"
          cy="12"
          r="0"
          fill="currentColor"
        />
        <circle
          className="spinner_VpEe spinner_eahp"
          cx="12"
          cy="12"
          r="0"
          fill="currentColor"
        />
        <circle
          className="spinner_VpEe spinner_f7Y2"
          cx="12"
          cy="12"
          r="0"
          fill="currentColor"
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-foreground text-base font-medium">{message}</p>
      </motion.div>
    </motion.div>
  )
}
