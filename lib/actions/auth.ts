'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { setSession, deleteSession } from '@/lib/auth'

const prisma = new PrismaClient()

// Validation Schemas
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  keepSignedIn: z.string().optional()
})

export type FormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function signupAction(prevState: any, formData: FormData): Promise<FormState> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = signupSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        fieldErrors: validatedData.error.flatten().fieldErrors
      }
    }

    const { name, email, password } = validatedData.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: 'An account with this email already exists' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Default values for missing app preferences
        currency: 'INR',
        monthlyBudget: 15000
      }
    })

    // Set JWT Session
    await setSession(user.id)

    return { success: true }
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'An unexpected error occurred during signup' }
  }
}

export async function loginAction(prevState: any, formData: FormData): Promise<FormState> {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = loginSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        fieldErrors: validatedData.error.flatten().fieldErrors
      }
    }

    const { email, password, keepSignedIn } = validatedData.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { error: 'User not found or invalid credentials' }
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return { error: 'Incorrect password or invalid credentials' }
    }

    // Set session
    await setSession(user.id, keepSignedIn === 'on')

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'An unexpected error occurred during login' }
  }
}

export async function logoutAction() {
  await deleteSession()
}
