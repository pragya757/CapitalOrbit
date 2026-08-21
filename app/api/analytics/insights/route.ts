import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateFinancialInsights } from '@/lib/services/financial-insights'

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

    const data = await generateFinancialInsights(targetUserId)

    return NextResponse.json({ success: true, ...data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate financial insights.' },
      { status: 500 }
    )
  }
}
