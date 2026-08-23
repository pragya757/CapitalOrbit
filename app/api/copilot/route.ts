import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processCopilotQuery } from '@/lib/services/merchant-copilot'
import { checkRateLimit } from '@/lib/rate-limit'

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

    // Rate Limiting Check (e.g., 30 requests / minute)
    const rateLimit = checkRateLimit(`copilot_${targetUserId}`, 30, 60000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait before asking another question.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const query = typeof body.query === 'string' ? body.query.trim() : ''

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required.' },
        { status: 400 }
      )
    }

    const response = await processCopilotQuery(targetUserId, query)

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to process Copilot query.' },
      { status: 500 }
    )
  }
}
