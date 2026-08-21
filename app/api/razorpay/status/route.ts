import { NextResponse } from 'next/server'
import { getRazorpayStatus } from '@/lib/razorpay'

export async function GET() {
  try {
    const status = getRazorpayStatus()
    return NextResponse.json(status, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        mode: 'test',
        provider: 'razorpay',
        error: 'Failed to evaluate Razorpay configuration status.',
      },
      { status: 500 }
    )
  }
}
