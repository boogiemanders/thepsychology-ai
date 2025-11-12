import React from "react"
import { motion } from "motion/react"

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  children?: React.ReactNode
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Get Started", children, className, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      className={`group relative inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      <span className="relative flex items-center justify-center">
        <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 group-hover:opacity-0">
          {children || text}
        </span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          ✨ {children || text}
        </span>
      </span>
    </motion.button>
  )
})

InteractiveHoverButton.displayName = "InteractiveHoverButton"
