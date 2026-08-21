import { NextResponse } from 'next/server'
import { categorizeUserTransactions } from '@/lib/actions/categorize'

export async function POST() {
  try {
    const result = await categorizeUserTransactions()

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        categorized: 0,
        needsReview: 0,
        error: error?.message || 'An unexpected error occurred during transaction categorization.',
      },
      { status: 500 }
    )
  }
}
