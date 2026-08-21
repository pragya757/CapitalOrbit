'use server'

import { getSession } from '@/lib/auth'
import { seedDemoData } from '@/lib/services/demo-data'
import { prisma } from '@/lib/prisma'

export async function loadDemoDataAction() {
  let targetUserId: string | null = null

  const session = await getSession()
  if (session?.userId) {
    targetUserId = session.userId as string
  } else {
    const firstUser = await prisma.user.findFirst()
    if (firstUser) targetUserId = firstUser.id
  }

  if (!targetUserId) {
    return { success: false, error: 'User session not found.' }
  }

  try {
    const result = await seedDemoData(targetUserId)
    return result
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to seed demo financial data.' }
  }
}
