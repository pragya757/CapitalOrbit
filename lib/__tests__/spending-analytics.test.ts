import { describe, it, expect } from 'vitest'
import { calculateSpendingAnalytics } from '../services/spending-analytics'

describe('Spending Analytics Service', () => {
  it('handles zero spending records gracefully', async () => {
    const res = await calculateSpendingAnalytics('non_existent_user_id')
    expect(res.totalSpending).toBe(0)
    expect(res.essentialSpending).toBe(0)
    expect(res.discretionarySpending).toBe(0)
    expect(res.essentialPercentage).toBe(0)
    expect(res.discretionaryPercentage).toBe(0)
    expect(res.categories).toEqual([])
    expect(res.topMerchants).toEqual([])
    expect(res.largestTransactions).toEqual([])
  })
})
