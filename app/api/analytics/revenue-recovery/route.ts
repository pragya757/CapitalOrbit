import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  analyzeRevenueRecovery,
  simulateSingleRecovery,
  simulateBatchRecovery,
  simulateRecoveryCampaign,
} from '@/lib/services/revenue-recovery'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  try {
    let targetUserId: string | null = null
    const session = await getSession()

    if (session?.userId) {
      targetUserId = session.userId as string
    } else {
      const firstUser = await prisma.user.findFirst()
      if (firstUser) targetUserId = firstUser.id
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'User session not found.' }, { status: 401 })
    }

    const result = await analyzeRevenueRecovery(targetUserId)

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate revenue recovery intelligence.' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    let targetUserId: string | null = null
    const session = await getSession()

    if (session?.userId) {
      targetUserId = session.userId as string
    } else {
      const firstUser = await prisma.user.findFirst()
      if (firstUser) targetUserId = firstUser.id
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'User session not found.' }, { status: 401 })
    }

    const rateLimit = checkRateLimit(`recovery_${targetUserId}`, 30, 60000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait before simulating another recovery.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const action = body.action || 'simulate_single'
    const paymentId = body.paymentId

    if (action === 'simulate_campaign') {
      const campaignResult = await simulateRecoveryCampaign(targetUserId, {
        priority: body.priority,
        failureCategory: body.failureCategory,
        paymentMethod: body.paymentMethod,
        maxTransactions: typeof body.maxTransactions === 'number' ? body.maxTransactions : undefined,
        recoveryAction: body.recoveryAction,
      })
      return NextResponse.json({ success: true, type: 'campaign', result: campaignResult }, { status: 200 })
    }

    if (action === 'simulate_batch') {
      const batchResult = await simulateBatchRecovery(targetUserId)
      return NextResponse.json({ success: true, type: 'batch', result: batchResult }, { status: 200 })
    }

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'paymentId is required for single recovery simulation.' },
        { status: 400 }
      )
    }

    const singleResult = await simulateSingleRecovery(targetUserId, paymentId)
    return NextResponse.json({ success: true, type: 'single', result: singleResult }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to simulate revenue recovery.' },
      { status: 500 }
    )
  }
}
