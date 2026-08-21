import { NextResponse } from 'next/server'
import { processFinancialDecision } from '@/lib/actions/financial-decision'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const queryInput = body.query || body

    if (!queryInput) {
      return NextResponse.json(
        { success: false, error: 'Query string or request object is required.' },
        { status: 400 }
      )
    }

    const result = await processFinancialDecision(queryInput)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        ...result.result,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred processing financial decision.',
      },
      { status: 500 }
    )
  }
}
