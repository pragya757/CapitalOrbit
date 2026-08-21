import { NextResponse } from 'next/server'
import { createRazorpayOrder, isRazorpayConfigured } from '@/lib/razorpay'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    const rateLimitKey = session?.userId ? (session.userId as string) : 'anonymous_order'
    const rl = checkRateLimit(rateLimitKey, 15, 60 * 1000)

    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a minute before creating new orders.' },
        { status: 429 }
      )
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Razorpay credentials not configured' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    let amountInPaise = body.amount

    // Convert rupees to paise if needed
    if (amountInPaise && amountInPaise < 100) {
      amountInPaise = Math.round(amountInPaise * 100)
    }

    if (!amountInPaise || typeof amountInPaise !== 'number' || isNaN(amountInPaise) || !isFinite(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount. Minimum amount is 100 paise (₹1).' },
        { status: 400 }
      )
    }

    // Cap maximum test order amount for safety (e.g. 10 Lakhs)
    if (amountInPaise > 100000000) {
      return NextResponse.json(
        { success: false, error: 'Order amount exceeds maximum allowed threshold.' },
        { status: 400 }
      )
    }

    const currency = (body.currency || 'INR').toUpperCase()
    const receipt = body.receipt || `rcpt_${Date.now()}`

    const order = await createRazorpayOrder({
      amountInPaise,
      currency,
      receipt,
      notes: body.notes || { description: body.description || 'CapitalOrbit Standard Checkout' },
    })

    return NextResponse.json(
      {
        success: true,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create Razorpay order. Please check credentials and input values.',
      },
      { status: 500 }
    )
  }
}
