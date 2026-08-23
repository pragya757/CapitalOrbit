'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  categorizeTransaction,
  getUserMerchantPreferencesMap,
  saveUserMerchantPreference,
} from '@/lib/services/transaction-intelligence'

export interface CategorizeSummary {
  success: boolean
  processed: number
  categorized: number
  needsReview: number
  error?: string
}

/**
 * Runs transaction intelligence over uncategorized or non-manual expenses for a user.
 */
export async function categorizeUserTransactions(userId?: string): Promise<CategorizeSummary> {
  let targetUserId = userId

  if (!targetUserId) {
    const session = await getSession()
    if (!session?.userId) {
      return {
        success: false,
        processed: 0,
        categorized: 0,
        needsReview: 0,
        error: 'Unauthorized: User session not found.',
      }
    }
    targetUserId = session.userId as string
  }

  try {
    // Fetch user's expenses that are uncategorized or imported
    const expenses = await prisma.expense.findMany({
      where: {
        userId: targetUserId,
        OR: [
          { category: 'Uncategorized' },
          { category: 'other' },
          { categorySource: null },
          { categorySource: 'ai' },
          { categorySource: 'rule' },
        ],
      },
    })

    if (expenses.length === 0) {
      return {
        success: true,
        processed: 0,
        categorized: 0,
        needsReview: 0,
      }
    }

    // Load user's learned merchant preferences memory map
    const preferencesMap = await getUserMerchantPreferencesMap(targetUserId)

    let categorizedCount = 0
    let needsReviewCount = 0

    for (const exp of expenses) {
      const result = categorizeTransaction(exp as any, preferencesMap)

      await prisma.expense.update({
        where: { id: exp.id },
        data: {
          category: result.category,
          merchantName: result.merchantName,
          categorySource: result.source,
          categoryConfidence: result.confidence,
          categoryReason: result.reason,
        },
      })

      if (result.confidenceTier === 'low') {
        needsReviewCount++
      } else {
        categorizedCount++
      }
    }

    return {
      success: true,
      processed: expenses.length,
      categorized: categorizedCount,
      needsReview: needsReviewCount,
    }
  } catch (err: any) {
    return {
      success: false,
      processed: 0,
      categorized: 0,
      needsReview: 0,
      error: err?.message || 'Failed to categorize transactions.',
    }
  }
}

/**
 * Server action to record user manual category correction & learn merchant preference.
 */
export async function recordUserCategoryCorrection(
  expenseId: string,
  newCategory: string
): Promise<{ success: boolean }> {
  const session = await getSession()
  if (!session?.userId) return { success: false }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
  })

  if (!expense || expense.userId !== session.userId) {
    return { success: false }
  }

  // Update expense with manual source and 1.0 confidence
  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      category: newCategory,
      categorySource: 'manual',
      categoryConfidence: 1.0,
      categoryReason: 'User manual category selection',
    },
  })

  // Save learned preference for this merchant if merchantName exists
  if (expense.merchantName) {
    await saveUserMerchantPreference(session.userId, expense.merchantName, newCategory)
  }

  return { success: true }
}
