'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  isRazorpayConfigured,
  fetchRazorpayPayments,
  normalizeRazorpayPayment,
} from '@/lib/razorpay'

export interface SyncSummary {
  success: boolean
  fetched: number
  imported: number
  skipped: number
  error?: string
}

/**
 * Synchronizes Razorpay Test Mode payments into the SpendWise Expense database table.
 * Deduplicates automatically based on razorpayPaymentId (@unique).
 */
export async function syncRazorpayTransactions(userId?: string): Promise<SyncSummary> {
  let targetUserId = userId

  if (!targetUserId) {
    const session = await getSession()
    if (!session?.userId) {
      return {
        success: false,
        fetched: 0,
        imported: 0,
        skipped: 0,
        error: 'Unauthorized: User session not found.',
      }
    }
    targetUserId = session.userId as string
  }

  if (!isRazorpayConfigured()) {
    return {
      success: false,
      fetched: 0,
      imported: 0,
      skipped: 0,
      error: 'Razorpay Test Mode credentials are missing or unconfigured in .env.',
    }
  }

  try {
    const rawPayments = await fetchRazorpayPayments({ count: 100 })
    const fetchedCount = rawPayments.length

    if (fetchedCount === 0) {
      return {
        success: true,
        fetched: 0,
        imported: 0,
        skipped: 0,
      }
    }

    let importedCount = 0
    let skippedCount = 0

    for (const rawPayment of rawPayments) {
      // Deduplication check via razorpayPaymentId
      const existing = await prisma.expense.findFirst({
        where: { razorpayPaymentId: rawPayment.id },
      })

      if (existing) {
        skippedCount++
        continue
      }

      // Normalize into Expense record
      const normalized = normalizeRazorpayPayment(rawPayment)

      await prisma.expense.create({
        data: {
          id: crypto.randomUUID(),
          userId: targetUserId,
          amount: normalized.amount,
          category: normalized.category,
          description: normalized.description,
          date: normalized.date,
          paymentMethod: normalized.paymentMethod,
          isRecurring: normalized.isRecurring,
          source: 'razorpay',
          status: normalized.status || 'captured',
          razorpayPaymentId: normalized.razorpayPaymentId,
          razorpayOrderId: normalized.razorpayOrderId,
          email: normalized.email,
          contact: normalized.contact,
          merchantName: normalized.merchantName,
          categorySource: normalized.categorySource,
          categoryConfidence: normalized.categoryConfidence,
          categoryReason: normalized.categoryReason,
        },
      })

      importedCount++
    }

    return {
      success: true,
      fetched: fetchedCount,
      imported: importedCount,
      skipped: skippedCount,
    }
  } catch (err: any) {
    return {
      success: false,
      fetched: 0,
      imported: 0,
      skipped: 0,
      error: err?.message || 'Failed to sync Razorpay transactions.',
    }
  }
}
