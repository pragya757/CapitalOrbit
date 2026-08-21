'use client'

import { useEffect } from 'react'
import { useActionState, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { signupAction } from '@/lib/actions/auth'
import Link from 'next/link'
import { Check, X, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedInput } from '@/components/auth/animated-input'
import { AnimatedButton } from '@/components/auth/animated-button'
import { toast } from 'sonner'
import { getAuthSuccessMessage } from '@/lib/microcopy'

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

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, {})
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (state.success) {
      if (typeof window !== 'undefined' && !window.location.href.includes('/dashboard')) {
        toast.success(getAuthSuccessMessage('signup'), { duration: 3000 })
        setTimeout(() => { window.location.href = '/dashboard' }, 500)
      }
    }
  }, [state])

  // Password validation rules
  const hasMinLength = password.length >= 8
  const charsNeeded = 8 - password.length
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  
  const rules = [
    { fulfilled: hasMinLength, text: hasMinLength ? 'At least 8 characters' : `${charsNeeded > 0 ? charsNeeded : 0} more character(s) needed` },
    { fulfilled: hasUppercase, text: 'One uppercase letter' },
    { fulfilled: hasLowercase, text: 'One lowercase letter' },
    { fulfilled: hasNumber, text: 'One number' },
    { fulfilled: hasSpecialChar, text: 'One special character' },
  ]
  
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
  const doPasswordsMatch = password !== '' && password === confirmPassword

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md my-8"
      >
        <Card className="w-full border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
          <CardHeader className="space-y-2 pt-8 px-8">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500 dark:from-emerald-400 dark:to-blue-400 text-center">
                Create Account
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-base">
                Join us to start tracking smart.
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form action={formAction} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-1">
                <AnimatedInput 
                  id="name" 
                  name="name" 
                  placeholder="Full Name" 
                  icon={<User className="h-5 w-5" />}
                  required 
                  error={!!state.fieldErrors?.name}
                />
                {state.fieldErrors?.name && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-sm font-medium text-red-500 px-4 pt-1"
                  >
                    {state.fieldErrors.name[0]}
                  </motion.p>
                )}
              </motion.div>
              
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                
                {/* Live Password Rules */}
                <AnimatePresence>
                  {password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-2 space-y-1 text-sm bg-black/5 dark:bg-white/5 rounded-2xl mt-2 overflow-hidden"
                    >
                      {rules.map((rule, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center gap-2 ${rule.fulfilled ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}
                        >
                          {rule.fulfilled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4 opacity-50" />}
                          <span>{rule.text}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
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
              
              <motion.div variants={itemVariants} className="space-y-1">
                <div className="relative">
                  <AnimatedInput 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    icon={<Lock className="h-5 w-5" />}
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!state.fieldErrors?.confirmPassword || (confirmPassword.length > 0 && !doPasswordsMatch)}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-0 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">Toggle password visibility</span>
                  </button>
                </div>
                
                {/* Match rule check */}
                <AnimatePresence>
                  {confirmPassword.length > 0 && (
                    <motion.div 
                       initial={{ opacity: 0, height: 0 }} 
                       animate={{ opacity: 1, height: 'auto' }} 
                       exit={{ opacity: 0, height: 0 }}
                       className={`mt-2 flex items-center gap-2 text-sm font-medium px-4 ${doPasswordsMatch ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                     {doPasswordsMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                     <span>{doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                   </motion.div>
                  )}
                </AnimatePresence>
                
                {state.fieldErrors?.confirmPassword && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-sm font-medium text-red-500 px-4 pt-1"
                  >
                    {state.fieldErrors.confirmPassword[0]}
                  </motion.p>
                )}
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

              <motion.div variants={itemVariants} className="pt-4">
                <AnimatedButton 
                  type="submit" 
                  disabled={isPending || (password.length > 0 && (!isPasswordValid || !doPasswordsMatch))}
                  isLoading={isPending}
                >
                  {isPending ? 'Creating account' : 'Create account'}
                </AnimatedButton>
              </motion.div>
            </form>
          </CardContent>
          <motion.div variants={itemVariants}>
            <CardFooter className="flex justify-center pb-8 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-sm font-medium text-muted-foreground mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-blue-500 transition-colors font-bold">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
