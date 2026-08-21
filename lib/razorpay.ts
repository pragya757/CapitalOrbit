import crypto from 'crypto'
import Razorpay from 'razorpay'
import type { RazorpayPayment, RazorpayOrder, RazorpayStatusResponse, Expense } from './types'
import { extractMerchantName, categorizeTransaction } from './services/transaction-intelligence'

/**
 * Checks if Razorpay Test Mode credentials are provided and validly formatted.
 */
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return false
  }

  // Ensure keys are not remaining as default raw placeholders
  if (keyId === 'rzp_test_your_key_id' || keySecret === 'your_razorpay_secret_key') {
    return false
  }

  return keyId.trim().length > 0 && keySecret.trim().length > 0
}

/**
 * Safely masks the Razorpay Key ID for public status responses.
 * Never exposes the key secret.
 */
export function getMaskedKeyId(): string | undefined {
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keyId || !isRazorpayConfigured()) return undefined

  if (keyId.length <= 8) return 'rzp_test_****'
  return `${keyId.substring(0, 8)}****${keyId.substring(keyId.length - 4)}`
}

/**
 * Returns a server-side Razorpay client instance.
 * Returns null if credentials are missing or invalid.
 */
export function getRazorpayClient(): Razorpay | null {
  if (!isRazorpayConfigured()) {
    return null
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  })
}

/**
 * Gets the current status response for Razorpay Test Mode configuration.
 */
export function getRazorpayStatus(): RazorpayStatusResponse {
  const configured = isRazorpayConfigured()
  return {
    configured,
    mode: 'test',
    provider: 'razorpay',
    keyId: getMaskedKeyId(),
  }
}

/**
 * Fetch a list of payments from Razorpay Test Mode.
 */
export async function fetchRazorpayPayments(options?: {
  from?: number
  to?: number
  count?: number
  skip?: number
}): Promise<RazorpayPayment[]> {
  const client = getRazorpayClient()
  if (!client) {
    throw new Error('Razorpay client is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }

  const response = await client.payments.all(options as any)
  const items = Array.isArray((response as any)?.items) ? (response as any).items : []

  return items.map((item: any) => ({
    id: item.id,
    entity: item.entity || 'payment',
    orderId: item.order_id,
    amount: Number(item.amount),
    currency: item.currency,
    status: item.status,
    method: item.method,
    description: item.description,
    createdAt: item.created_at,
    email: item.email ? String(item.email) : undefined,
    contact: item.contact ? String(item.contact) : undefined,
    notes: item.notes as any,
    fee: item.fee !== undefined ? Number(item.fee) : undefined,
    tax: item.tax !== undefined ? Number(item.tax) : undefined,
    errorCode: item.error_code,
    errorDescription: item.error_description,
    refundStatus: item.refund_status,
    amountRefunded: item.amount_refunded !== undefined ? Number(item.amount_refunded) : undefined,
  }))
}

/**
 * Retrieve a specific payment by its Razorpay Payment ID.
 */
export async function getRazorpayPaymentById(paymentId: string): Promise<RazorpayPayment | null> {
  const client = getRazorpayClient()
  if (!client) {
    throw new Error('Razorpay client is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }

  const item = await client.payments.fetch(paymentId)
  if (!item) return null

  return {
    id: item.id,
    entity: (item as any).entity || 'payment',
    orderId: item.order_id,
    amount: Number(item.amount),
    currency: item.currency,
    status: item.status as any,
    method: item.method,
    description: item.description,
    createdAt: item.created_at,
    email: item.email ? String(item.email) : undefined,
    contact: item.contact ? String(item.contact) : undefined,
    notes: item.notes as any,
    fee: item.fee !== undefined ? Number(item.fee) : undefined,
    tax: item.tax !== undefined ? Number(item.tax) : undefined,
    errorCode: (item as any).error_code,
    errorDescription: (item as any).error_description,
    refundStatus: item.refund_status as any,
    amountRefunded: item.amount_refunded !== undefined ? Number(item.amount_refunded) : undefined,
  }
}

/**
 * Fetch a list of orders from Razorpay Test Mode.
 */
export async function fetchRazorpayOrders(options?: {
  from?: number
  to?: number
  count?: number
  skip?: number
  authorized?: number
}): Promise<RazorpayOrder[]> {
  const client = getRazorpayClient()
  if (!client) {
    throw new Error('Razorpay client is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }

  const response = await client.orders.all(options as any)
  const items = Array.isArray((response as any)?.items) ? (response as any).items : []

  return items.map((item: any) => ({
    id: item.id,
    entity: item.entity || 'order',
    amount: Number(item.amount),
    amountPaid: Number(item.amount_paid),
    amountDue: Number(item.amount_due),
    currency: item.currency,
    receipt: item.receipt,
    status: item.status,
    attempts: item.attempts,
    notes: item.notes as any,
    createdAt: item.created_at,
  }))
}

/**
 * Retrieve a specific order by its Razorpay Order ID.
 */
export async function getRazorpayOrderById(orderId: string): Promise<RazorpayOrder | null> {
  const client = getRazorpayClient()
  if (!client) {
    throw new Error('Razorpay client is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }

  const item = await client.orders.fetch(orderId)
  if (!item) return null

  return {
    id: item.id,
    entity: (item as any).entity || 'order',
    amount: Number(item.amount),
    amountPaid: Number(item.amount_paid),
    amountDue: Number(item.amount_due),
    currency: item.currency,
    receipt: item.receipt,
    status: item.status as any,
    attempts: item.attempts,
    notes: item.notes as any,
    createdAt: item.created_at,
  }
}

/**
 * Normalizes a raw Razorpay Payment object into a SpendWise Expense transaction model.
 * - Converts amount from paise (smallest currency unit) to main currency (Rupees).
 * - Maps Razorpay payment method (upi, card, wallet, cash) to SpendWise paymentMethod.
 * - Maps payment status (captured, authorized, failed, refunded).
 * - Defaults category to "Uncategorized".
 * - Sets source to "razorpay".
 */
export function normalizeRazorpayPayment(payment: RazorpayPayment): Omit<Expense, 'id'> {
  // Convert amount from paise to rupees cleanly
  const amountInRupees = payment.amount ? Number((payment.amount / 100).toFixed(2)) : 0

  // Format UNIX timestamp (seconds) into YYYY-MM-DD
  const tsMs = payment.createdAt > 1e11 ? payment.createdAt : payment.createdAt * 1000
  const dateObj = new Date(tsMs)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const formattedDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`

  // Map Razorpay payment method string to SpendWise PaymentMethod
  let mappedMethod = 'card'
  const rawMethod = (payment.method || '').toLowerCase()
  if (rawMethod === 'upi') mappedMethod = 'upi'
  else if (rawMethod === 'wallet') mappedMethod = 'wallet'
  else if (rawMethod === 'cash') mappedMethod = 'cash'

  // Respect payment status
  const status = payment.status || 'captured'

  // Generate clear description
  const description =
    payment.description ||
    (payment.notes && typeof payment.notes === 'object' ? payment.notes.description || payment.notes.reason : undefined) ||
    `Razorpay Payment (${payment.id})`

  const merchantName = extractMerchantName(description, payment)
  const intelligence = categorizeTransaction({ description, merchantName, amount: amountInRupees })

  return {
    amount: amountInRupees,
    category: intelligence.category,
    description,
    date: formattedDate,
    paymentMethod: mappedMethod,
    isRecurring: false,
    source: 'razorpay',
    status,
    razorpayPaymentId: payment.id,
    razorpayOrderId: payment.orderId || undefined,
    email: payment.email || undefined,
    contact: payment.contact || undefined,
    merchantName,
    categorySource: intelligence.source,
    categoryConfidence: intelligence.confidence,
    categoryReason: intelligence.reason,
  }
}

/**
 * Creates a Razorpay order on the backend for Standard Checkout.
 * Validates minimum amount of 100 paise (₹1).
 */
export async function createRazorpayOrder(options: {
  amountInPaise: number
  currency?: string
  receipt?: string
  notes?: Record<string, any>
}) {
  const client = getRazorpayClient()
  if (!client) {
    throw new Error('Razorpay client is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }

  if (options.amountInPaise < 100) {
    throw new Error('Minimum amount for order creation is 100 paise (₹1).')
  }

  const order = await client.orders.create({
    amount: Math.round(options.amountInPaise),
    currency: options.currency || 'INR',
    receipt: options.receipt || `rcpt_${Date.now()}`,
    notes: options.notes,
  })

  return {
    order_id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    receipt: order.receipt,
    keyId: process.env.RAZORPAY_KEY_ID,
  }
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET).
 */
export function verifyRazorpayPaymentSignature(options: {
  order_id: string
  payment_id: string
  signature: string
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return false

  const text = `${options.order_id}|${options.payment_id}`
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(text)
    .digest('hex')

  return generatedSignature === options.signature
}

