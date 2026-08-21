'use server'

import { getSession } from '@/lib/auth'
import { calculateFinancialHealth } from '@/lib/services/financial-health'
import type { FinancialHealthSummary } from '@/lib/types'

export async function getFinancialHealthForUser(userId?: string): Promise<{
  success: boolean
  financialHealth?: FinancialHealthSummary
  error?: string
}> {
  let targetUserId = userId

  if (!targetUserId) {
    const session = await getSession()
    if (!session?.userId) {
      return {
        success: false,
        error: 'Unauthorized: Session not found.',
      }
    }
    targetUserId = session.userId as string
  }

  try {
    const summary = await calculateFinancialHealth(targetUserId)
    return {
      success: true,
      financialHealth: summary,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to calculate financial health.',
    }
  }
}
