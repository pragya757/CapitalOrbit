'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean
}

export function AnimatedButton({ children, isLoading, className, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="w-full"
    >
      <Button
        className={`w-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white font-bold text-lg shadow-lg shadow-pink-500/25 border-none h-12 transition-all ${className || ''}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-1.5 h-full">
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
              className="h-2.5 w-2.5 rounded-full bg-white block"
            />
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
              className="h-2.5 w-2.5 rounded-full bg-white block"
            />
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
              className="h-2.5 w-2.5 rounded-full bg-white block"
            />
          </span>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  )
}
