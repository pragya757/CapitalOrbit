import { describe, it, expect, beforeEach, vi } from 'vitest'
import { classifyCopilotIntent, processCopilotQuery } from '@/lib/services/merchant-copilot'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    income: {
      findMany: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
    },
    recurringRule: {
      findMany: vi.fn(),
    },
    savingsGoal: {
      findMany: vi.fn(),
    },
  },
}))

describe('CapitalOrbit AI Merchant Copilot Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Deterministic Intent Classification', () => {
    it('correctly classifies PAYMENT_FAILURES', () => {
      expect(classifyCopilotIntent('Why did payments fail today?')).toBe('PAYMENT_FAILURES')
      expect(classifyCopilotIntent('Why are my payments failing?')).toBe('PAYMENT_FAILURES')
    })

    it('correctly classifies REVENUE_RISK', () => {
      expect(classifyCopilotIntent('How much revenue is at risk?')).toBe('REVENUE_RISK')
      expect(classifyCopilotIntent('How much money am I losing from failed payments?')).toBe('REVENUE_RISK')
    })

    it('correctly classifies FAILURE_SPIKE', () => {
      expect(classifyCopilotIntent('Is there an unusual failure spike?')).toBe('FAILURE_SPIKE')
      expect(classifyCopilotIntent('Is today failure rate abnormal?')).toBe('FAILURE_SPIKE')
    })

    it('correctly classifies PAYMENT_METHOD_ANALYSIS', () => {
      expect(classifyCopilotIntent('Which payment method has the highest failure rate?')).toBe('PAYMENT_METHOD_ANALYSIS')
      expect(classifyCopilotIntent('Which payment method is failing most?')).toBe('PAYMENT_METHOD_ANALYSIS')
    })

    it('correctly classifies FINANCIAL_HEALTH', () => {
      expect(classifyCopilotIntent('How is my financial health?')).toBe('FINANCIAL_HEALTH')
      expect(classifyCopilotIntent('Am I financially healthy?')).toBe('FINANCIAL_HEALTH')
    })

    it('correctly classifies SPENDING_ANALYSIS', () => {
      expect(classifyCopilotIntent('Where am I spending the most?')).toBe('SPENDING_ANALYSIS')
      expect(classifyCopilotIntent('What category costs me the most?')).toBe('SPENDING_ANALYSIS')
    })

    it('correctly classifies CASH_FLOW', () => {
      expect(classifyCopilotIntent("What's my cash flow?")).toBe('CASH_FLOW')
      expect(classifyCopilotIntent('How much am I saving each month?')).toBe('CASH_FLOW')
    })

    it('correctly classifies FORECAST', () => {
      expect(classifyCopilotIntent('What will my balance look like in 90 days?')).toBe('FORECAST')
      expect(classifyCopilotIntent("What's my financial forecast?")).toBe('FORECAST')
    })

    it('correctly classifies FINANCIAL_DECISION', () => {
      expect(classifyCopilotIntent('Can I afford ₹20,000?')).toBe('FINANCIAL_DECISION')
      expect(classifyCopilotIntent('Can I spend ₹15,000 on a phone?')).toBe('FINANCIAL_DECISION')
      expect(classifyCopilotIntent('Can I spend 20000 on a laptop?')).toBe('FINANCIAL_DECISION')
      expect(classifyCopilotIntent('Can I afford a ₹50,000 laptop?')).toBe('FINANCIAL_DECISION')
    })

    it('correctly classifies GOAL_ANALYSIS', () => {
      expect(classifyCopilotIntent('Can I reach my bike goal?')).toBe('GOAL_ANALYSIS')
    })

    it('correctly classifies FINANCIAL_SUMMARY', () => {
      expect(classifyCopilotIntent('Give me a complete financial summary.')).toBe('FINANCIAL_SUMMARY')
    })

    it('returns UNKNOWN for unrecognizable queries', () => {
      expect(classifyCopilotIntent('What is the weather today?')).toBe('UNKNOWN')
    })
  })

  describe('Financial Decision Amount Extraction & Query Processing', () => {
    const mockUser = {
      id: 'user_copilot_1',
      name: 'Pragya',
      email: 'pragya@example.com',
      currency: 'INR',
      monthlyBudget: 15000,
      incomes: [
        { id: 'inc_1', amount: 50000, date: '2026-08-01', description: 'Salary', isRecurring: true },
      ],
      expenses: [
        {
          id: 'exp_1',
          amount: 5000,
          category: 'food',
          description: 'Dining out',
          date: '2026-08-05',
          paymentMethod: 'upi',
          status: 'captured',
          isRecurring: false,
          createdAt: new Date().toISOString(),
        },
      ],
      recurring: [],
      savingsGoals: [
        { id: 'goal_1', name: 'New Bike', targetAmount: 120000, savedAmount: 30000, deadline: '2027-04-01' },
      ],
    }

    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockUser.expenses as any)
    })

    it('extracts ₹20,000 accurately for "Can I afford ₹20,000?" without duplicate text', async () => {
      const res = await processCopilotQuery('user_copilot_1', 'Can I afford ₹20,000?')

      expect(res.success).toBe(true)
      expect(res.intent).toBe('FINANCIAL_DECISION')
      expect(res.answer).not.toContain('undefined')
      expect(res.answer).not.toContain('NaN')

      // Verify no duplicate sentence generation
      const phraseMatches = (res.answer.match(/is safe and fully affordable/g) || []).length
      expect(phraseMatches).toBeLessThanOrEqual(1)

      const amountMetric = res.metrics?.find((m) => m.label === 'Requested Amount')
      expect(amountMetric?.value).toContain('20,000')
    })

    it('extracts ₹15,000 and "Phone" for "Can I spend ₹15,000 on a phone?"', async () => {
      const res = await processCopilotQuery('user_copilot_1', 'Can I spend ₹15,000 on a phone?')

      expect(res.success).toBe(true)
      expect(res.intent).toBe('FINANCIAL_DECISION')
      expect(res.answer).toContain('Phone')
      expect(res.answer).not.toContain('undefined')

      const amountMetric = res.metrics?.find((m) => m.label === 'Requested Amount')
      expect(amountMetric?.value).toContain('15,000')
    })

    it('extracts 20000 and "Laptop" for "Can I spend 20000 on a laptop?"', async () => {
      const res = await processCopilotQuery('user_copilot_1', 'Can I spend 20000 on a laptop?')

      expect(res.success).toBe(true)
      expect(res.intent).toBe('FINANCIAL_DECISION')
      expect(res.answer).toContain('Laptop')

      const amountMetric = res.metrics?.find((m) => m.label === 'Requested Amount')
      expect(amountMetric?.value).toContain('20,000')
    })

    it('extracts ₹50,000 and "Laptop" for "Can I afford a ₹50,000 laptop?"', async () => {
      const res = await processCopilotQuery('user_copilot_1', 'Can I afford a ₹50,000 laptop?')

      expect(res.success).toBe(true)
      expect(res.intent).toBe('FINANCIAL_DECISION')
      expect(res.answer).toContain('Laptop')

      const amountMetric = res.metrics?.find((m) => m.label === 'Requested Amount')
      expect(amountMetric?.value).toContain('50,000')
    })

    it('prompts user for amount when query is missing an amount instead of silently using ₹0', async () => {
      const res = await processCopilotQuery('user_copilot_1', 'Can I afford a laptop?')

      expect(res.success).toBe(true)
      expect(res.intent).toBe('FINANCIAL_DECISION')
      expect(res.answer).toContain('Please specify the monetary amount')
      expect(res.metrics?.length).toBe(0)
    })
  })
})
