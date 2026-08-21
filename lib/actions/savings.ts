'use server'

import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export type SavingsGoal = {
  id: string
  userId: string
  name: string
  targetAmount: number
  savedAmount: number
  deadline: string | null
  createdAt: string | Date
}

// Fetch user's savings goals
export async function fetchSavingsGoals() {
  const session = await getSession()
  if (!session?.userId) return []

  const userId = session.userId as string

  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // We map the dates to simple string representations to safely transport to Client Components
  return goals.map((g: any) => ({
    ...g,
    createdAt: g.createdAt.toISOString()
  })) as SavingsGoal[]
}

// Create a new savings goal
export async function createSavingsGoal(goal: {
  name: string
  targetAmount: number
  deadline?: string | null
}) {
  const session = await getSession()
  if (!session?.userId) throw new Error('Unauthorized')

  const newGoal = await prisma.savingsGoal.create({
    data: {
      userId: session.userId,
      name: goal.name,
      targetAmount: goal.targetAmount,
      savedAmount: 0,
      deadline: goal.deadline || null,
    },
  })

  return { ...newGoal, createdAt: newGoal.createdAt.toISOString() } as SavingsGoal
}

// Update saved amount for a goal
export async function updateSavingsProgress(id: string, amountToAdd: number) {
  const session = await getSession()
  if (!session?.userId) throw new Error('Unauthorized')

  // Use atomic increment to ensure correctness
  const updatedGoal = await prisma.savingsGoal.update({
    where: {
      id,
      userId: session.userId, // Safety constraint
    },
    data: {
      savedAmount: {
        increment: amountToAdd
      }
    },
  })

  return { ...updatedGoal, createdAt: updatedGoal.createdAt.toISOString() } as SavingsGoal
}

// Delete a goal entirely
export async function deleteSavingsGoal(id: string) {
  const session = await getSession()
  if (!session?.userId) throw new Error('Unauthorized')

  await prisma.savingsGoal.delete({
    where: {
      id,
      userId: session.userId,
    },
  })

  return { success: true }
}
