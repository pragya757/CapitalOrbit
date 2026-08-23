import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  analyzeTransactionFailure,
  analyzeFailedTransactions,
} from '@/lib/services/transaction-failure-intelligence'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  },
}))

describe('Transaction Failure Intelligence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Single Transaction Failure Classification', () => {
    it('correctly classifies INSUFFICIENT_FUNDS', () => {
      const res = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_1',
        amount: 5000,
        status: 'failed',
        paymentMethod: 'card',
        failureCode: 'BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE',
        failureReason: 'Insufficient balance',
      })

      expect(res.category).toBe('INSUFFICIENT_FUNDS')
      expect(res.severity).toBe('MEDIUM')
      expect(res.recoveryEligibility).toBe('POSSIBLY_RECOVERABLE')
      expect(res.amountAtRisk).toBe(5000)
    })

    it('correctly classifies TIMEOUT and NETWORK_FAILURE', () => {
      const timeoutRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_2',
        amount: 2500,
        status: 'failed',
        paymentMethod: 'upi',
        failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
      })
      expect(timeoutRes.category).toBe('TIMEOUT')
      expect(timeoutRes.severity).toBe('MEDIUM')
      expect(timeoutRes.recoveryEligibility).toBe('RECOVERABLE')

      const netRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_3',
        amount: 3000,
        status: 'failed',
        paymentMethod: 'upi',
        failureReason: 'network_error_connection_refused',
      })
      expect(netRes.category).toBe('NETWORK_FAILURE')
      expect(netRes.recoveryEligibility).toBe('RECOVERABLE')
    })

    it('correctly classifies AUTHENTICATION_FAILURE', () => {
      const authRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_4',
        amount: 1500,
        status: 'failed',
        paymentMethod: 'card',
        failureCode: 'BAD_REQUEST_PAYMENT_DECLINED_3D_SECURE_AUTH_FAILED',
      })
      expect(authRes.category).toBe('AUTHENTICATION_FAILURE')
      expect(authRes.severity).toBe('LOW')
      expect(authRes.recoveryEligibility).toBe('POSSIBLY_RECOVERABLE')
    })

    it('correctly classifies BANK_DECLINE and expired card', () => {
      const bankRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_5',
        amount: 8000,
        status: 'failed',
        paymentMethod: 'card',
        failureCode: 'BAD_REQUEST_PAYMENT_DECLINED_BY_BANK',
      })
      expect(bankRes.category).toBe('BANK_DECLINE')
      expect(bankRes.severity).toBe('HIGH')

      const expiredRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_6',
        amount: 4000,
        status: 'failed',
        paymentMethod: 'card',
        failureCode: 'expired_card',
      })
      expect(expiredRes.category).toBe('BANK_DECLINE')
      expect(expiredRes.recoveryEligibility).toBe('NOT_RECOVERABLE')
    })

    it('correctly classifies CUSTOMER_CANCELLED', () => {
      const cancelRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_7',
        amount: 2000,
        status: 'failed',
        paymentMethod: 'upi',
        failureReason: 'customer_cancelled',
      })
      expect(cancelRes.category).toBe('CUSTOMER_CANCELLED')
      expect(cancelRes.severity).toBe('LOW')
      expect(cancelRes.recoveryEligibility).toBe('POSSIBLY_RECOVERABLE')
    })

    it('defaults to UNKNOWN when metadata is insufficient', () => {
      const unknownRes = analyzeTransactionFailure({
        razorpayPaymentId: 'pay_8',
        amount: 1000,
        status: 'failed',
        paymentMethod: 'wallet',
      })
      expect(unknownRes.category).toBe('UNKNOWN')
      expect(unknownRes.recoveryEligibility).toBe('UNKNOWN')
    })

    it('escalates severity and marks NOT_RECOVERABLE for repeated failed order attempts', () => {
      const repeatedRes = analyzeTransactionFailure(
        {
          razorpayPaymentId: 'pay_9',
          razorpayOrderId: 'order_repeat_1',
          amount: 5000,
          status: 'failed',
          paymentMethod: 'upi',
          failureCode: 'BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE',
        },
        3 // 3 repeated attempts
      )

      expect(repeatedRes.severity).toBe('CRITICAL')
      expect(repeatedRes.recoveryEligibility).toBe('NOT_RECOVERABLE')
      expect(repeatedRes.evidence).toContain('consecutive failed attempts')
    })
  })

  describe('Aggregate Pattern Analysis (analyzeFailedTransactions)', () => {
    it('aggregates failure rate, revenue at risk, category breakdown, and payment methods', async () => {
      const mockExpenses = [
        {
          id: 'exp_1',
          userId: 'user_123',
          amount: 10000,
          status: 'captured',
          paymentMethod: 'upi',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp_2',
          userId: 'user_123',
          amount: 5000,
          status: 'failed',
          paymentMethod: 'card',
          failureCode: 'BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp_3',
          userId: 'user_123',
          amount: 2500,
          status: 'failed',
          paymentMethod: 'upi',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_123')

      expect(res.success).toBe(true)
      expect(res.summary.totalPayments).toBe(3)
      expect(res.summary.failedPayments).toBe(2)
      expect(res.summary.successfulPayments).toBe(1)
      expect(res.summary.failureRate).toBe(66.7)
      expect(res.summary.totalFailedAmount).toBe(7500)
      expect(res.summary.potentiallyRecoverableAmount).toBe(7500)

      expect(res.categories.length).toBeGreaterThan(0)
      expect(res.paymentMethods.length).toBeGreaterThan(0)
    })
  })

  describe('Security Boundaries', () => {
    it('does not expose Razorpay key secrets in analysis results', async () => {
      const mockExpenses = [
        {
          id: 'exp_sec',
          userId: 'user_123',
          amount: 5000,
          status: 'failed',
          paymentMethod: 'upi',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await analyzeFailedTransactions('user_123')

      const stringified = JSON.stringify(res)
      expect(stringified).not.toContain('4BMoupzEyun0QPMZ8OHOyOIG')
      expect(stringified).not.toContain('KEY_SECRET')
    })
  })
})
