import { describe, it, expect } from 'vitest'
import { calculateCashFlowAnalytics } from '../services/cash-flow-analytics'

describe('Cash Flow Analytics Service', () => {
  it('handles empty database records gracefully without division by zero', async () => {
    // Pass a non-existent user ID
    const res = await calculateCashFlowAnalytics('non_existent_user_id')
    expect(res.totalIncome).toBe(0)
    expect(res.totalExpenses).toBe(0)
    expect(res.netCashFlow).toBe(0)
    expect(res.savingsRate).toBe(0)
    expect(res.averageMonthlyIncome).toBe(0)
    expect(res.averageMonthlyExpenses).toBe(0)
    expect(res.monthlyTrend).toEqual([])
  })
})
