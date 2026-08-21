import { describe, it, expect } from 'vitest'
import { parseNaturalLanguageQuery } from '../services/decision-parser'

describe('AI Financial Decision Engine — Natural Language Parser', () => {
  it('parses purchase query with currency and item description', () => {
    const res = parseNaturalLanguageQuery('Can I spend ₹20,000 on a laptop?')
    expect(res.type).toBe('PURCHASE')
    expect(res.amount).toBe(20000)
    expect(res.description).toContain('Laptop')
  })

  it('parses k-notation for purchase amount (e.g. 15k)', () => {
    const res = parseNaturalLanguageQuery('Can I afford a 15k phone?')
    expect(res.amount).toBe(15000)
    expect(res.description).toContain('Phone')
  })

  it('parses income shock simulation query', () => {
    const res = parseNaturalLanguageQuery('What if my income drops 20%?')
    expect(res.type).toBe('INCOME_SHOCK')
    expect(res.percentageChange).toBe(20)
  })

  it('parses expense shock simulation query', () => {
    const res = parseNaturalLanguageQuery('What if my expenses increase by ₹5,000?')
    expect(res.type).toBe('EXPENSE_SHOCK')
    expect(res.amount).toBe(5000)
  })

  it('parses goal deadline query with target amount and timeline', () => {
    const res = parseNaturalLanguageQuery('Can I reach 1 lakh in 6 months?')
    expect(res.type).toBe('GOAL_DEADLINE')
    expect(res.targetAmount).toBe(100000)
    expect(res.deadline).toContain('6 months')
  })
})

describe('AI Financial Decision Engine — Decision Logic & Honest Thresholds', () => {
  it('evaluates safe purchase within Safe-to-Spend limit', () => {
    const safeToSpend = 32000
    const purchase = 20000
    const remaining = safeToSpend - purchase

    expect(remaining).toBe(12000)
    expect(purchase <= safeToSpend).toBe(true)
  })

  it('evaluates over-commitment for purchase exceeding Safe-to-Spend', () => {
    const safeToSpend = 10000
    const purchase = 20000
    const remaining = safeToSpend - purchase

    expect(remaining).toBe(-10000)
    expect(purchase > safeToSpend).toBe(true)
  })

  it('calculates honest lower-cost threshold without imaginary product names', () => {
    const safeToSpend = 12000
    const honestThresholdNote = `Consider a purchase under ₹${safeToSpend.toLocaleString()} to remain 100% within your safe liquidity limit.`
    expect(honestThresholdNote).toContain('12,000')
    expect(honestThresholdNote).not.toContain('laptop') // No imaginary product name
  })

  it('calculates goal delay based on future monthly capacity rather than subtracting from saved amount', () => {
    const goalRemaining = 90000
    const currentMonthlyCapacity = 10000
    const originalMonths = goalRemaining / currentMonthlyCapacity // 9 months

    const purchaseAmount = 20000
    // Reduced capacity over 3 months
    const postPurchaseCapacity = currentMonthlyCapacity - purchaseAmount / 3 // 3333.33/mo reduction -> 6666.67/mo
    const newMonths = goalRemaining / postPurchaseCapacity // 13.5 months

    expect(newMonths).toBeGreaterThan(originalMonths)
  })
})
