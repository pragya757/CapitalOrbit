import { NextResponse } from 'next/server'
import { getFinancialHealthForUser } from '@/lib/actions/financial-health'

export async function GET() {
  try {
    const result = await getFinancialHealthForUser()

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred retrieving financial health.',
      },
      { status: 500 }
    )
  }
}
