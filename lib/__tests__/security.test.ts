import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { verifyRazorpayPaymentSignature, getRazorpayStatus } from '../razorpay'
import { checkRateLimit } from '../rate-limit'

describe('CapitalOrbit Security Audit & Protection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('rejects invalid Razorpay payment signature', () => {
    process.env.RAZORPAY_KEY_SECRET = 'sample_secret_key_123'
    const orderId = 'order_M123'
    const paymentId = 'pay_M456'
    const invalidSignature = 'invalid_hash_signature'

    const isValid = verifyRazorpayPaymentSignature({
      order_id: orderId,
      payment_id: paymentId,
      signature: invalidSignature,
    })

    expect(isValid).toBe(false)
  })

  it('never exposes RAZORPAY_KEY_SECRET in public status calls', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_123456789'
    process.env.RAZORPAY_KEY_SECRET = 'secret_key_should_never_be_public'

    const status = getRazorpayStatus()
    expect(status.keyId).toBeDefined()
    expect(status.keyId).not.toContain('secret_key_should_never_be_public')
    expect((status as any).keySecret).toBeUndefined()
  })

  it('enforces rate limiting after exceeding threshold', () => {
    const key = 'test_rate_limit_user_' + Date.now()
    const limit = 3
    const windowMs = 60 * 1000

    expect(checkRateLimit(key, limit, windowMs).success).toBe(true)
    expect(checkRateLimit(key, limit, windowMs).success).toBe(true)
    expect(checkRateLimit(key, limit, windowMs).success).toBe(true)

    // 4th request exceeds limit of 3
    expect(checkRateLimit(key, limit, windowMs).success).toBe(false)
  })
})
