import { describe, it, expect } from 'vitest'
import { categorizeTransaction, extractMerchantName } from '../services/transaction-intelligence'

describe('Transaction Intelligence — Merchant Extraction', () => {
  it('extracts clean merchant names from noisy descriptions', () => {
    expect(extractMerchantName('order_10293 SWIGGY PAYMENT PVT LTD')).toBe('Swiggy')
    expect(extractMerchantName('pay_84920 UBER TRIP RIDE')).toBe('Uber Trip Ride')
    expect(extractMerchantName('UPI/192039/NETFLIX SUBSCRIPTION/ONLINE')).toBe('Netflix Subscription')
  })
})

describe('Transaction Intelligence — 3-Layer Hybrid Categorization', () => {
  it('categorizes Swiggy as Food & Dining with high confidence', () => {
    const res = categorizeTransaction({ description: 'Swiggy Food Delivery', merchantName: 'Swiggy' })
    expect(res.category).toBe('food')
    expect(res.confidenceTier).toBe('high')
    expect(res.confidence).toBeGreaterThanOrEqual(0.85)
    expect(res.source).toBe('rule')
  })

  it('categorizes Uber as Transport with high confidence', () => {
    const res = categorizeTransaction({ description: 'Uber Ride to Airport', merchantName: 'Uber' })
    expect(res.category).toBe('transport')
    expect(res.confidenceTier).toBe('high')
    expect(res.source).toBe('rule')
  })

  it('categorizes Netflix as Subscriptions with high confidence', () => {
    const res = categorizeTransaction({ description: 'Netflix Monthly Plan', merchantName: 'Netflix' })
    expect(res.category).toBe('subscriptions')
    expect(res.confidenceTier).toBe('high')
    expect(res.source).toBe('rule')
  })

  it('categorizes Coursera as Education with high confidence', () => {
    const res = categorizeTransaction({ description: 'Coursera ML Course', merchantName: 'Coursera' })
    expect(res.category).toBe('education')
    expect(res.confidenceTier).toBe('high')
    expect(res.source).toBe('rule')
  })

  it('assigns low confidence / Needs Review tier for unknown ambiguous descriptions', () => {
    const res = categorizeTransaction({ description: 'random_trans_xyz_99', merchantName: 'Unknown Store' })
    expect(res.confidenceTier).toBe('low')
    expect(res.confidence).toBeLessThan(0.60)
    expect(res.reason).toContain('Needs Review')
  })

  it('prioritizes Layer 1 User Learned Preferences over default rules', () => {
    const learnedPreferencesMap = {
      Amazon: 'education', // User previously corrected Amazon from Shopping to Education
    }

    const res = categorizeTransaction(
      { description: 'Amazon India Web Store', merchantName: 'Amazon' },
      learnedPreferencesMap
    )

    expect(res.category).toBe('education')
    expect(res.source).toBe('learned')
    expect(res.confidence).toBe(0.98)
    expect(res.reason).toContain("Matched learned preference for 'Amazon'")
  })
})
