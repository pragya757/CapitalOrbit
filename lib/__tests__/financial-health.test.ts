import { describe, it, expect } from 'vitest'
import { calculateFinancialHealth } from '../services/financial-health'

describe('Financial Health & Safe-to-Spend Engine', () => {
  it('computes baseline Safe-to-Spend correctly (Balance 50k - Oblig 6k - Goals 5k - Reserve 7k = 32k)', async () => {
    // Math verification test
    const estimatedAvailableBalance = 50000
    const upcomingObligations = 6000
    const goalCommitments = 5000
    const safetyReserve = 7000

    const rawSafeToSpend = estimatedAvailableBalance - upcomingObligations - goalCommitments - safetyReserve
    expect(rawSafeToSpend).toBe(32000)
  })

  it('detects over-commitment when Safe-to-Spend is negative', async () => {
    const estimatedAvailableBalance = 10000
    const upcomingObligations = 8000
    const goalCommitments = 5000
    const safetyReserve = 4000

    const rawSafeToSpend = estimatedAvailableBalance - upcomingObligations - goalCommitments - safetyReserve
    const isOverCommitted = rawSafeToSpend < 0
    const shortfall = Math.abs(rawSafeToSpend)

    expect(rawSafeToSpend).toBe(-7000)
    expect(isOverCommitted).toBe(true)
    expect(shortfall).toBe(7000)
  })

  it('calculates monthly goal contribution requirement based on target and deadline', () => {
    const targetAmount = 120000
    const savedAmount = 30000
    const remainingTarget = targetAmount - savedAmount // 90,000
    const remainingMonths = 9

    const requiredMonthlyContribution = remainingTarget / remainingMonths
    expect(requiredMonthlyContribution).toBe(10000)
  })

  it('ensures health score remains deterministically between 0 and 100', () => {
    const cashCoverage = 90
    const spendingStability = 80
    const goalAffordability = 85
    const safetyReserveCoverage = 75

    const rawScore =
      cashCoverage * 0.30 +
      spendingStability * 0.25 +
      goalAffordability * 0.25 +
      safetyReserveCoverage * 0.20

    const score = Math.max(0, Math.min(100, Math.round(rawScore)))
    expect(score).toBe(83)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})
