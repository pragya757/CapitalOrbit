'use client'

import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { ReactNode, useState } from 'react'

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  error?: boolean
}

export function AnimatedInput({ icon, error, className, ...props }: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="relative w-full"
    >
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused
            ? error 
              ? '0 0 0 2px rgba(239, 68, 68, 0.4)' 
              : '0 0 0 2px rgba(168, 85, 247, 0.4)'
            : '0 0 0 0px rgba(0,0,0,0)',
        }}
        className={`relative flex items-center rounded-full bg-background border ${error ? 'border-red-400' : 'border-input'} overflow-hidden transition-colors`}
      >
        {icon && (
          <div className={`pl-4 flex items-center justify-center ${isFocused ? 'text-violet-500' : 'text-muted-foreground'}`}>
            {icon}
          </div>
        )}
        <Input
          {...props}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-4 py-6 text-base shadow-none ${icon ? 'pl-3' : ''} ${className || ''}`}
        />
      </motion.div>
    </motion.div>
  )
}
