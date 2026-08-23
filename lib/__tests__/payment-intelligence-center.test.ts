import { describe, it, expect, beforeEach, vi } from 'vitest'
import { analyzeFailedTransactions, analyzeTransactionFailure } from '@/lib/services/transaction-failure-intelligence'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: vi.fn(),
    },
  },
}))

describe('Payment Intelligence Center Engine (Step 11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success & Failure Rate Calculations', () => {
    it('calculates 100% success rate when zero payment failures exist', async () => {
      const mockExpenses = [
        { id: 'exp_1', amount: 5000, status: 'captured', paymentMethod: 'upi', createdAt: new Date() },
        { id: 'exp_2', amount: 3000, status: 'captured', paymentMethod: 'card', createdAt: new Date() },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_step11_1')
      const s = res.summary

      expect(s.totalPayments).toBe(2)
      expect(s.successfulPayments).toBe(2)
      expect(s.failedPayments).toBe(0)
      expect(s.failureRate).toBe(0)
      expect(s.totalFailedAmount).toBe(0)
    })

    it('accurately calculates failure rate and amount at risk when failures exist', async () => {
      const mockExpenses = [
        { id: 'exp_1', amount: 5000, status: 'captured', paymentMethod: 'upi', createdAt: new Date() },
        { id: 'exp_2', amount: 2000, status: 'failed', failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT', paymentMethod: 'card', createdAt: new Date() },
        { id: 'exp_3', amount: 3000, status: 'failed', failureCode: 'BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE', paymentMethod: 'upi', createdAt: new Date() },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_step11_2')
      const s = res.summary

      expect(s.totalPayments).toBe(3)
      expect(s.failedPayments).toBe(2)
      expect(s.successfulPayments).toBe(1)
      expect(s.failureRate).toBe(66.7)
      expect(s.totalFailedAmount).toBe(5000)
    })
  })

  describe('Revenue Impact & Recovery Opportunity Calculations', () => {
    it('correctly partitions potentially recoverable vs non-recoverable revenue', async () => {
      const mockExpenses = [
        {
          id: 'exp_1',
          amount: 10000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT', // RECOVERABLE
          paymentMethod: 'card',
          createdAt: new Date(),
        },
        {
          id: 'exp_2',
          amount: 5000,
          status: 'failed',
          failureCode: 'BAD_REQUEST_PAYMENT_CARD_EXPIRED', // NOT_RECOVERABLE
          paymentMethod: 'card',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_step11_3')
      const s = res.summary

      expect(s.totalFailedAmount).toBe(15000)
      expect(s.potentiallyRecoverableAmount).toBe(10000)
      expect(s.nonRecoverableAmount).toBe(5000)

      const recoveryOpportunityPercent = Number(((s.potentiallyRecoverableAmount / s.totalFailedAmount) * 100).toFixed(1))
      expect(recoveryOpportunityPercent).toBe(66.7)
    })
  })

  describe('Failure Reason Category Aggregation (8 Categories)', () => {
    it('aggregates all 8 deterministic failure categories cleanly', () => {
      const timeoutAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'upi', failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT' })
      expect(timeoutAnalysis.category).toBe('TIMEOUT')

      const balanceAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'card', failureCode: 'INSUFFICIENT_BALANCE' })
      expect(balanceAnalysis.category).toBe('INSUFFICIENT_FUNDS')

      const networkAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'card', failureCode: 'NETWORK_CONNECTION_ERROR' })
      expect(networkAnalysis.category).toBe('NETWORK_FAILURE')

      const authAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'card', failureCode: '3D_SECURE_AUTH_FAILED' })
      expect(authAnalysis.category).toBe('AUTHENTICATION_FAILURE')

      const cancelAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'upi', failureReason: 'CUSTOMER_CANCELLED' })
      expect(cancelAnalysis.category).toBe('CUSTOMER_CANCELLED')

      const bankAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'card', failureCode: 'BANK_DECLINE_DO_NOT_HONOR' })
      expect(bankAnalysis.category).toBe('BANK_DECLINE')

      const gwAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'netbanking', failureCode: 'GATEWAY_DOWN_INTERNAL_SERVER_ERROR' })
      expect(gwAnalysis.category).toBe('PAYMENT_GATEWAY_FAILURE')

      const unknownAnalysis = analyzeTransactionFailure({ amount: 1000, status: 'failed', paymentMethod: 'wallet' })
      expect(unknownAnalysis.category).toBe('UNKNOWN')
    })
  })

  describe('Payment Method Risk Intelligence', () => {
    it('computes failure rates per payment method and sorts highest risk first', async () => {
      const mockExpenses = [
        { id: 'e1', amount: 1000, status: 'captured', paymentMethod: 'upi', createdAt: new Date() },
        { id: 'e2', amount: 1000, status: 'captured', paymentMethod: 'upi', createdAt: new Date() },
        { id: 'e3', amount: 5000, status: 'failed', paymentMethod: 'card', createdAt: new Date() },
        { id: 'e4', amount: 5000, status: 'failed', paymentMethod: 'card', createdAt: new Date() },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_step11_4')
      const methods = res.paymentMethods

      const cardMethod = methods.find((m) => m.method === 'CARD')
      const upiMethod = methods.find((m) => m.method === 'UPI')

      expect(cardMethod?.failureRate).toBe(100)
      expect(upiMethod?.failureRate).toBe(0)
      expect(methods[0].method).toBe('CARD') // Highest risk method first
    })
  })

  describe('Anomaly / Spike Detection & Insufficient Data Safeguards', () => {
    it('safely handles sparse baseline transaction history (< 3 transactions)', async () => {
      const mockExpenses = [
        { id: 'e1', amount: 1000, status: 'failed', paymentMethod: 'upi', createdAt: new Date() },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_step11_5')
      expect(res.summary.totalPayments).toBe(1)
      expect(res.summary.failureRateVs7DayAvg).toBeDefined()
    })

    it('escalates severity to CRITICAL for repeated consecutive failures on the same order', () => {
      const analysis = analyzeTransactionFailure(
        { amount: 10000, status: 'failed', paymentMethod: 'card', razorpayOrderId: 'order_123', failureCode: 'BANK_DECLINE' },
        3 // 3rd consecutive attempt
      )

      expect(analysis.severity).toBe('CRITICAL')
      expect(analysis.recoveryEligibility).toBe('NOT_RECOVERABLE')
      expect(analysis.evidence).toContain('consecutive failed attempts')
    })
  })
})
