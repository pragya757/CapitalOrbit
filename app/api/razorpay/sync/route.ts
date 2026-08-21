import { NextResponse } from 'next/server'
import { syncRazorpayTransactions } from '@/lib/actions/razorpay-sync'

export async function POST() {
  try {
    const result = await syncRazorpayTransactions()

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        fetched: 0,
        imported: 0,
        skipped: 0,
        error: error?.message || 'An unexpected error occurred during Razorpay sync.',
      },
      { status: 500 }
    )
  }
}
