'use server'

import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { parseNaturalLanguageQuery } from '@/lib/services/decision-parser'
import { evaluateFinancialDecision } from '@/lib/services/decision-engine'
import type { FinancialDecisionRequest, FinancialDecisionResult } from '@/lib/types'

const prisma = new PrismaClient()

/**
 * Processes a financial query or request, evaluates decision, and logs to database.
 */
export async function processFinancialDecision(
  input: string | FinancialDecisionRequest,
  userId?: string
): Promise<{
  success: boolean
  result?: FinancialDecisionResult
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
    const request: FinancialDecisionRequest =
      typeof input === 'string' ? parseNaturalLanguageQuery(input) : input

    const result = await evaluateFinancialDecision(targetUserId, request)

    // Save decision history to database
    const queryText = typeof input === 'string' ? input : input.rawQuery || `${request.type} ${request.description || ''}`
    
    await prisma.financialDecision.create({
      data: {
        id: crypto.randomUUID(),
        userId: targetUserId,
        query: queryText,
        decisionType: request.type,
        decision: result.decision,
        riskLevel: result.riskLevel,
        requestedAmount: result.requestedAmount || null,
        safeToSpend: result.safeToSpend,
        remainingSafeToSpend: result.remainingSafeToSpend,
        reason: result.reason,
        resultJson: JSON.stringify(result),
      },
    })

    return {
      success: true,
      result,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to evaluate financial decision.',
    }
  }
}

/**
 * Retrieves past financial decision history logs for the user.
 */
export async function getFinancialDecisionHistory(userId?: string): Promise<{
  success: boolean
  history: FinancialDecisionResult[]
}> {
  let targetUserId = userId

  if (!targetUserId) {
    const session = await getSession()
    if (!session?.userId) {
      return { success: false, history: [] }
    }
    targetUserId = session.userId as string
  }

  try {
    const records = await prisma.financialDecision.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const history: FinancialDecisionResult[] = records.map((rec) => {
      try {
        const parsed = JSON.parse(rec.resultJson)
        return {
          ...parsed,
          id: rec.id,
          createdAt: rec.createdAt.toISOString(),
        }
      } catch {
        return {
          id: rec.id,
          decision: rec.decision as any,
          riskLevel: rec.riskLevel as any,
          requestedAmount: rec.requestedAmount || undefined,
          safeToSpend: rec.safeToSpend,
          remainingSafeToSpend: rec.remainingSafeToSpend,
          reason: rec.reason,
          explanation: rec.reason,
          keyFactors: [],
          alternatives: [],
          confidence: 0.85,
          dataConfidence: 'medium',
          confidenceNote: 'Retrieved from history log',
          createdAt: rec.createdAt.toISOString(),
        }
      }
    })

    return {
      success: true,
      history,
    }
  } catch {
    return {
      success: false,
      history: [],
    }
  }
}
