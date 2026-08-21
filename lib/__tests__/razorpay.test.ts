import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isRazorpayConfigured, getMaskedKeyId, getRazorpayStatus, getRazorpayClient, verifyRazorpayPaymentSignature, createRazorpayOrder } from '../razorpay'
import crypto from 'crypto'

describe('Razorpay Server Service Foundation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('detects unconfigured status when env vars are absent', () => {
    delete process.env.RAZORPAY_KEY_ID
    delete process.env.RAZORPAY_KEY_SECRET

    expect(isRazorpayConfigured()).toBe(false)
    expect(getRazorpayClient()).toBeNull()
    const status = getRazorpayStatus()
    expect(status).toEqual({
      configured: false,
      mode: 'test',
      provider: 'razorpay',
      keyId: undefined,
    })
  })

  it('detects unconfigured status when raw placeholder values are used', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_your_key_id'
    process.env.RAZORPAY_KEY_SECRET = 'your_razorpay_secret_key'

    expect(isRazorpayConfigured()).toBe(false)
    expect(getRazorpayClient()).toBeNull()
  })

  it('detects configured status and masks key ID when valid keys are provided', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_1234567890abcdef'
    process.env.RAZORPAY_KEY_SECRET = 'secret_test_key_sample_1234'

    expect(isRazorpayConfigured()).toBe(true)
    expect(getMaskedKeyId()).toBe('rzp_test****cdef')
    expect(getRazorpayClient()).not.toBeNull()

    const status = getRazorpayStatus()
    expect(status).toEqual({
      configured: true,
      mode: 'test',
      provider: 'razorpay',
      keyId: 'rzp_test****cdef',
    })
  })

  it('verifies HMAC-SHA256 payment signature correctly', () => {
    const keySecret = 'test_secret_key_12345'
    process.env.RAZORPAY_KEY_SECRET = keySecret

    const orderId = 'order_M123456789'
    const paymentId = 'pay_M987654321'
    const text = `${orderId}|${paymentId}`
    const validSignature = crypto.createHmac('sha256', keySecret).update(text).digest('hex')

    expect(
      verifyRazorpayPaymentSignature({
        order_id: orderId,
        payment_id: paymentId,
        signature: validSignature,
      })
    ).toBe(true)

    expect(
      verifyRazorpayPaymentSignature({
        order_id: orderId,
        payment_id: paymentId,
        signature: 'invalid_signature_hash',
      })
    ).toBe(false)
  })

  it('rejects order creation with amount below 100 paise', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_sample'
    process.env.RAZORPAY_KEY_SECRET = 'secret_sample'

    await expect(createRazorpayOrder({ amountInPaise: 50 })).rejects.toThrow('Minimum amount for order creation is 100 paise')
  })
})
