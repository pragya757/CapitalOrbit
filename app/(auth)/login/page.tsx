'use client'

import { useEffect } from 'react'
import { useActionState, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { loginAction } from '@/lib/actions/auth'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedInput } from '@/components/auth/animated-input'
import { AnimatedButton } from '@/components/auth/animated-button'
import { toast } from 'sonner'
import { getAuthSuccessMessage } from '@/lib/microcopy'
import { Checkbox } from '@/components/ui/checkbox'

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      bounce: 0.3,
      duration: 0.8,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.4 } },
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state.success) {
      if (typeof window !== 'undefined' && !window.location.href.includes('/dashboard')) {
        toast.success(getAuthSuccessMessage('login'), { duration: 3000 })
        setTimeout(() => { window.location.href = '/dashboard' }, 500)
      }
    }
  }, [state])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md"
      >
        <Card className="w-full border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
          <CardHeader className="space-y-2 pt-8 px-8">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 dark:from-violet-400 dark:to-pink-400 text-center">
                Welcome Back!
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-base">
                Let&apos;s get you signed in.
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form action={formAction} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-1">
                <AnimatedInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  icon={<Mail className="h-5 w-5" />}
                  required
                  error={!!state.fieldErrors?.email}
                />
                {state.fieldErrors?.email && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-sm font-medium text-red-500 px-4 pt-1"
                  >
                    {state.fieldErrors.email[0]}
                  </motion.p>
                )}
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-1">
                <div className="relative">
                  <AnimatedInput 
                    id="password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    icon={<Lock className="h-5 w-5" />}
                    required 
                    error={!!state.fieldErrors?.password}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-0 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">Toggle password visibility</span>
                  </button>
                </div>
                {state.fieldErrors?.password && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-sm font-medium text-red-500 px-4 pt-1"
                  >
                    {state.fieldErrors.password[0]}
                  </motion.p>
                )}
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex items-center space-x-2 px-2 pb-2">
                <Checkbox id="keepSignedIn" name="keepSignedIn" className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600" />
                <label
                  htmlFor="keepSignedIn"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  Keep me signed in
                </label>
              </motion.div>
              
              {state.error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="rounded-2xl bg-red-100 dark:bg-red-500/20 p-4 text-sm text-red-600 dark:text-red-400 font-medium text-center border border-red-200 dark:border-red-500/30"
                >
                  {state.error}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="pt-2">
                <AnimatedButton type="submit" isLoading={isPending}>
                  {isPending ? 'Signing in' : 'Sign In'}
                </AnimatedButton>
              </motion.div>
            </form>
          </CardContent>
          
          <motion.div variants={itemVariants}>
            <CardFooter className="flex justify-center pb-8 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-sm font-medium text-muted-foreground mt-4">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-violet-600 dark:text-violet-400 hover:text-pink-500 transition-colors font-bold">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
