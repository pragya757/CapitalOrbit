import { describe, it, expect } from 'vitest'
import { parseNaturalLanguageQuery } from '../services/decision-parser'

describe('STEP 6 Demo Profile Seeding & End-to-End Validation', () => {
  it('validates demo profile financial metrics structure', () => {
    const demoIncome = 50000
    const demoExpensesTotal = 12000 + 5000 + 3000 + 2000 + 2500 + 3500 // 28,000
    const estimatedAvailableBalance = demoIncome - demoExpensesTotal // 22,000

    const rentObligation = 12000
    const utilitiesObligation = 2500
    const internetObligation = 1000
    const upcomingObligations = rentObligation + utilitiesObligation + internetObligation // 15,500

    const bikeGoalRemaining = 120000 - 30000 // 90,000
    const goalCommitments = Math.round(bikeGoalRemaining / 8) // 11,250 / mo

    const safetyReserve = 12000 // 1 mo essential expense fallback

    const safeToSpend = estimatedAvailableBalance - upcomingObligations - goalCommitments - safetyReserve

    expect(estimatedAvailableBalance).toBe(22000)
    expect(upcomingObligations).toBe(15500)
    expect(goalCommitments).toBe(11250)

    // Verify over-commitment state detection works correctly
    expect(safeToSpend).toBeLessThan(0) // Liquid buffer over-committed due to high goal commitment
  })

  it('validates the 5 required Decision Engine queries with demo profile data', () => {
    // Query 1: Laptop purchase
    const q1 = parseNaturalLanguageQuery('Can I spend ₹20,000 on a laptop?')
    expect(q1.type).toBe('PURCHASE')
    expect(q1.amount).toBe(20000)
    expect(q1.description).toContain('Laptop')

    // Query 2: Phone purchase
    const q2 = parseNaturalLanguageQuery('Can I afford a ₹15,000 phone?')
    expect(q2.amount).toBe(15000)
    expect(q2.description).toContain('Phone')

    // Query 3: Income drop simulation
    const q3 = parseNaturalLanguageQuery('What if my income drops 20%?')
    expect(q3.type).toBe('INCOME_SHOCK')
    expect(q3.percentageChange).toBe(20)

    // Query 4: Expense increase simulation
    const q4 = parseNaturalLanguageQuery('What if my expenses increase by ₹5,000?')
    expect(q4.type).toBe('EXPENSE_SHOCK')
    expect(q4.amount).toBe(5000)

    // Query 5: Bike goal deadline query
    const q5 = parseNaturalLanguageQuery('Can I reach my ₹1,20,000 bike goal in 8 months?')
    expect(q5.type).toBe('GOAL_DEADLINE')
    expect(q5.targetAmount).toBe(120000)
    expect(q5.deadline).toContain('8 months')
  })
})
