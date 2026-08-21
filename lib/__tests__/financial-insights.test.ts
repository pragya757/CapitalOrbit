import { describe, it, expect } from 'vitest'
import { generateFinancialInsights } from '../services/financial-insights'

describe('Financial Insights Service', () => {
  it('generates structured insights without crashing', async () => {
    const res = await generateFinancialInsights('non_existent_user_id')
    expect(res.insights).toBeDefined()
    expect(Array.isArray(res.insights)).toBe(true)
    expect(res.generatedAt).toBeDefined()
  })
})
