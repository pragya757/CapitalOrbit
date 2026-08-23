import { describe, it, expect } from 'vitest'
import {
  generateMonthlyCalendarDays,
  calculateSpendingIntensity,
} from '@/lib/services/expense-calendar'

describe('Expense Calendar Engine (Step 14)', () => {
  describe('Spending Intensity Calculation', () => {
    it('returns NONE for 0 daily spending', () => {
      expect(calculateSpendingIntensity(0, 1000)).toBe('NONE')
    })

    it('returns LOW intensity when spending is < 50% of daily average', () => {
      expect(calculateSpendingIntensity(400, 1000)).toBe('LOW')
    })

    it('returns NORMAL intensity when spending is 50-120% of daily average', () => {
      expect(calculateSpendingIntensity(800, 1000)).toBe('NORMAL')
      expect(calculateSpendingIntensity(1000, 1000)).toBe('NORMAL')
    })

    it('returns HIGH intensity when spending is 120-200% of daily average', () => {
      expect(calculateSpendingIntensity(1500, 1000)).toBe('HIGH')
    })

    it('returns VERY_HIGH intensity when spending is >= 200% of daily average', () => {
      expect(calculateSpendingIntensity(2500, 1000)).toBe('VERY_HIGH')
    })
  })

  describe('Monthly Date Grid Generation & Navigation', () => {
    it('generates correct date grid for August 2026', () => {
      const augDate = new Date(2026, 7, 15) // August 2026
      const result = generateMonthlyCalendarDays({ currentDate: augDate, expenses: [] })

      expect(result.days.length).toBeGreaterThanOrEqual(28)
      expect(result.days.length % 7).toBe(0) // Full weeks grid
      expect(result.monthTotalSpent).toBe(0)
    })

    it('correctly handles leap year February 2028 (29 days)', () => {
      const febLeapDate = new Date(2028, 1, 15) // Feb 2028
      const result = generateMonthlyCalendarDays({ currentDate: febLeapDate, expenses: [] })

      const febDaysInMonth = result.days.filter((d) => d.isCurrentMonth)
      expect(febDaysInMonth.length).toBe(29)
    })

    it('correctly handles non-leap year February 2027 (28 days)', () => {
      const febNonLeapDate = new Date(2027, 1, 15) // Feb 2027
      const result = generateMonthlyCalendarDays({ currentDate: febNonLeapDate, expenses: [] })

      const febDaysInMonth = result.days.filter((d) => d.isCurrentMonth)
      expect(febDaysInMonth.length).toBe(28)
    })
  })

  describe('Daily Aggregation & Multiple Transactions', () => {
    it('aggregates multiple transactions on the same day', () => {
      const mockDate = new Date(2026, 7, 23)
      const mockExpenses = [
        {
          id: 'exp1',
          description: 'Swiggy',
          amount: 850,
          category: 'Food & Dining',
          paymentMethod: 'upi',
          date: new Date(2026, 7, 23, 12, 30).toISOString(),
          status: 'completed',
        },
        {
          id: 'exp2',
          description: 'Netflix',
          amount: 649,
          category: 'Subscriptions',
          paymentMethod: 'card',
          date: new Date(2026, 7, 23, 15, 0).toISOString(),
          status: 'completed',
        },
        {
          id: 'exp3',
          description: 'Uber',
          amount: 420,
          category: 'Transportation',
          paymentMethod: 'wallet',
          date: new Date(2026, 7, 23, 18, 45).toISOString(),
          status: 'completed',
        },
      ]

      const result = generateMonthlyCalendarDays({ currentDate: mockDate, expenses: mockExpenses })
      const day23 = result.days.find((d) => d.isCurrentMonth && d.dayOfMonth === 23)

      expect(day23).toBeDefined()
      expect(day23?.transactionCount).toBe(3)
      expect(day23?.totalSpent).toBe(1919)
      expect(day23?.expenses.length).toBe(3)
    })

    it('distinguishes Razorpay transactions with source metadata', () => {
      const mockDate = new Date(2026, 7, 10)
      const mockExpenses = [
        {
          id: 'exp_razor_1',
          description: 'AWS Web Services',
          amount: 5400,
          category: 'Software & SaaS',
          paymentMethod: 'card',
          source: 'razorpay',
          razorpayPaymentId: 'pay_test_123',
          date: new Date(2026, 7, 10).toISOString(),
          status: 'captured',
        },
      ]

      const result = generateMonthlyCalendarDays({ currentDate: mockDate, expenses: mockExpenses })
      const day10 = result.days.find((d) => d.isCurrentMonth && d.dayOfMonth === 10)

      expect(day10?.expenses[0].source).toBe('razorpay')
    })
  })

  describe('Filtering Functionality', () => {
    const mockExpenses = [
      {
        id: 'f1',
        description: 'Swiggy Dinner',
        amount: 500,
        category: 'Food & Dining',
        paymentMethod: 'upi',
        source: 'manual',
        date: new Date(2026, 7, 12).toISOString(),
        status: 'completed',
      },
      {
        id: 'f2',
        description: 'Uber Ride',
        amount: 300,
        category: 'Transportation',
        paymentMethod: 'card',
        source: 'razorpay',
        date: new Date(2026, 7, 12).toISOString(),
        status: 'captured',
      },
    ]

    it('filters by category correctly', () => {
      const augDate = new Date(2026, 7, 12)
      const result = generateMonthlyCalendarDays({
        currentDate: augDate,
        expenses: mockExpenses,
        categoryFilter: 'Food & Dining',
      })

      const day12 = result.days.find((d) => d.isCurrentMonth && d.dayOfMonth === 12)
      expect(day12?.transactionCount).toBe(1)
      expect(day12?.totalSpent).toBe(500)
    })

    it('filters by payment method correctly', () => {
      const augDate = new Date(2026, 7, 12)
      const result = generateMonthlyCalendarDays({
        currentDate: augDate,
        expenses: mockExpenses,
        paymentFilter: 'card',
      })

      const day12 = result.days.find((d) => d.isCurrentMonth && d.dayOfMonth === 12)
      expect(day12?.transactionCount).toBe(1)
      expect(day12?.totalSpent).toBe(300)
    })

    it('filters by transaction source (Razorpay vs Manual)', () => {
      const augDate = new Date(2026, 7, 12)
      const result = generateMonthlyCalendarDays({
        currentDate: augDate,
        expenses: mockExpenses,
        sourceFilter: 'razorpay',
      })

      const day12 = result.days.find((d) => d.isCurrentMonth && d.dayOfMonth === 12)
      expect(day12?.transactionCount).toBe(1)
      expect(day12?.expenses[0].source).toBe('razorpay')
    })
  })
})
