import { describe, it, expect } from 'vitest'
import { calculateFinancialForecast } from '../services/financial-forecast'

describe('Financial Forecasting Service', () => {
  it('generates 30, 60, and 90 day deterministic forecast structures', async () => {
    const res = await calculateFinancialForecast('non_existent_user_id')
    expect(res.forecasts.day30.horizonDays).toBe(30)
    expect(res.forecasts.day60.horizonDays).toBe(60)
    expect(res.forecasts.day90.horizonDays).toBe(90)
    expect(res.generatedAt).toBeDefined()
  })
})
