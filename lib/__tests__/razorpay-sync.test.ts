import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { normalizeRazorpayPayment, isRazorpayConfigured } from '../razorpay'
import type { RazorpayPayment } from '../types'
import { syncRazorpayTransactions } from '../actions/razorpay-sync'

describe('Razorpay Payment Normalization', () => {
  it('converts amounts from paise to rupees cleanly', () => {
    const rawPayment: RazorpayPayment = {
      id: 'pay_test_100',
      amount: 150000, // 1500.00 rupees in paise
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      createdAt: 1700000000,
    }

    const normalized = normalizeRazorpayPayment(rawPayment)

    expect(normalized.amount).toBe(1500.0)
    expect(normalized.source).toBe('razorpay')
    expect(normalized.category).toBe('Uncategorized')
    expect(normalized.razorpayPaymentId).toBe('pay_test_100')
  })

  it('maps payment methods accurately', () => {
    const paymentUpi: RazorpayPayment = {
      id: 'pay_upi_1',
      amount: 50000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      createdAt: 1700000000,
    }
    const paymentWallet: RazorpayPayment = {
      id: 'pay_wallet_1',
      amount: 25000,
      currency: 'INR',
      status: 'captured',
      method: 'wallet',
      createdAt: 1700000000,
    }

    expect(normalizeRazorpayPayment(paymentUpi).paymentMethod).toBe('upi')
    expect(normalizeRazorpayPayment(paymentWallet).paymentMethod).toBe('wallet')
  })

  it('respects payment status (captured, authorized, failed, refunded)', () => {
    const paymentFailed: RazorpayPayment = {
      id: 'pay_failed_1',
      amount: 10000,
      currency: 'INR',
      status: 'failed',
      method: 'card',
      createdAt: 1700000000,
    }
    const paymentRefunded: RazorpayPayment = {
      id: 'pay_refund_1',
      amount: 10000,
      currency: 'INR',
      status: 'refunded',
      method: 'card',
      createdAt: 1700000000,
    }

    expect(normalizeRazorpayPayment(paymentFailed).status).toBe('failed')
    expect(normalizeRazorpayPayment(paymentRefunded).status).toBe('refunded')
  })
})

describe('Sync Error Handling when Unconfigured', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('fails gracefully when credentials are not configured', async () => {
    delete process.env.RAZORPAY_KEY_ID
    delete process.env.RAZORPAY_KEY_SECRET

    const result = await syncRazorpayTransactions('user_dummy_id')

    expect(result.success).toBe(false)
    expect(result.imported).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.error).toContain('missing or unconfigured')
  })
})
