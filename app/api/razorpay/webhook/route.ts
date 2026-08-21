import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { normalizeRazorpayPayment } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    const bodyText = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing x-razorpay-signature header' },
          { status: 400 }
        )
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText)
        .digest('hex')

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 400 }
        )
      }
    }

    let payload: any
    try {
      payload = JSON.parse(bodyText)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const event = payload.event
    const paymentEntity = payload.payload?.payment?.entity

    if (event === 'payment.captured' && paymentEntity) {
      const paymentId = paymentEntity.id
      const orderId = paymentEntity.order_id

      let targetUserId = 'demo-user-id'
      const firstUser = await prisma.user.findFirst()
      if (firstUser) targetUserId = firstUser.id

      const normalized = normalizeRazorpayPayment({
        id: paymentEntity.id,
        entity: 'payment',
        orderId: paymentEntity.order_id,
        amount: Number(paymentEntity.amount),
        currency: paymentEntity.currency || 'INR',
        status: paymentEntity.status || 'captured',
        method: paymentEntity.method || 'card',
        description: paymentEntity.description || `Razorpay Webhook (${paymentId})`,
        createdAt: paymentEntity.created_at || Math.floor(Date.now() / 1000),
        email: paymentEntity.email,
        contact: paymentEntity.contact,
        notes: paymentEntity.notes,
      })

      await prisma.expense.upsert({
        where: { razorpayPaymentId: paymentId },
        update: {
          status: 'captured',
          merchantName: normalized.merchantName,
          categorySource: normalized.categorySource,
          categoryConfidence: normalized.categoryConfidence,
          categoryReason: normalized.categoryReason,
        },
        create: {
          id: crypto.randomUUID(),
          userId: targetUserId,
          amount: normalized.amount,
          category: normalized.category,
          description: normalized.description,
          date: normalized.date,
          paymentMethod: normalized.paymentMethod,
          isRecurring: false,
          source: 'razorpay',
          status: 'captured',
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          merchantName: normalized.merchantName,
          categorySource: normalized.categorySource,
          categoryConfidence: normalized.categoryConfidence,
          categoryReason: normalized.categoryReason,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook received and processed cleanly',
        event,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error processing webhook event',
      },
      { status: 500 }
    )
  }
}
