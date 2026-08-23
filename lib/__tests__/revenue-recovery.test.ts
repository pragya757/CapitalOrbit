import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  analyzeRevenueRecovery,
  calculateRecoveryPriority,
  determineRecommendedAction,
  simulateSingleRecovery,
  simulateBatchRecovery,
  simulateRecoveryCampaign,
  DETERMINISTIC_RECOVERY_PROBABILITIES,
} from '@/lib/services/revenue-recovery'
import { classifyCopilotIntent, processCopilotQuery } from '@/lib/services/merchant-copilot'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user_12', currency: 'INR' }),
    },
  },
}))

describe('Revenue Recovery Intelligence Engine (Step 12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Recovery Priority Calculation', () => {
    it('assigns CRITICAL priority to high value recoverable transactions (>= 10,000)', () => {
      const p = calculateRecoveryPriority(15000, 'HIGH', 'RECOVERABLE', new Date().toISOString())
      expect(p).toBe('CRITICAL')
    })

    it('assigns HIGH priority to transactions >= 3000 or recent recoverable transactions', () => {
      const p = calculateRecoveryPriority(5000, 'MEDIUM', 'RECOVERABLE', new Date().toISOString())
      expect(p).toBe('HIGH')
    })

    it('assigns LOW priority to NOT_RECOVERABLE transactions regardless of amount', () => {
      const p = calculateRecoveryPriority(50000, 'CRITICAL', 'NOT_RECOVERABLE', new Date().toISOString())
      expect(p).toBe('LOW')
    })
  })

  describe('Recommended Recovery Actions', () => {
    it('recommends RETRY_PAYMENT for network failures and timeouts', () => {
      const rec = determineRecommendedAction('TIMEOUT', 'RECOVERABLE')
      expect(rec.action).toBe('RETRY_PAYMENT')
      expect(rec.explanation).toContain('Transient connection drop')
    })

    it('recommends ASK_CUSTOMER_TO_RETRY for insufficient funds and auth failures', () => {
      const rec = determineRecommendedAction('INSUFFICIENT_FUNDS', 'POSSIBLY_RECOVERABLE')
      expect(rec.action).toBe('ASK_CUSTOMER_TO_RETRY')
      expect(rec.explanation).toContain('Customer balance')
    })

    it('recommends NO_ACTION for NOT_RECOVERABLE or customer cancelled failures', () => {
      const rec = determineRecommendedAction('BANK_DECLINE', 'NOT_RECOVERABLE')
      expect(rec.action).toBe('NO_ACTION')
      expect(rec.explanation).toContain('Permanent failure')
    })
  })

  describe('Single Recovery Simulation & Stopping Rules', () => {
    it('simulates recovery attempt for an eligible recoverable transaction', async () => {
      const mockExpenses = [
        {
          id: 'exp_step12_1',
          razorpayPaymentId: 'pay_sim_step12_1',
          amount: 5000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
          paymentMethod: 'card',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const sim = await simulateSingleRecovery('user_12', 'pay_sim_step12_1')
      expect(sim.success).toBe(true)
      expect(sim.status).toBe('SUCCESS')
      expect(sim.amountRecovered).toBe(5000)
      expect(sim.auditEntry.paymentId).toBe('pay_sim_step12_1')
    })

    it('enforces Stopping Rule: Rejects simulation for protected NOT_RECOVERABLE transactions', async () => {
      const mockExpenses = [
        {
          id: 'exp_step12_2',
          razorpayPaymentId: 'pay_perm_declined',
          amount: 20000,
          status: 'failed',
          failureCode: 'BAD_REQUEST_PAYMENT_CARD_EXPIRED',
          paymentMethod: 'card',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const sim = await simulateSingleRecovery('user_12', 'pay_perm_declined')
      expect(sim.success).toBe(false)
      expect(sim.status).toBe('REJECTED_PERMANENT')
      expect(sim.amountRecovered).toBe(0)
      expect(sim.auditEntry.reason).toContain('Stopping Rule Enforced')
    })

    it('enforces Stopping Rule: Caps max simulated recovery attempts at 2', async () => {
      const mockExpenses = [
        {
          id: 'exp_step12_3',
          razorpayPaymentId: 'pay_attempt_cap',
          amount: 5000,
          status: 'failed',
          failureCode: 'BAD_REQUEST_PAYMENT_DECLINED_BY_BANK',
          paymentMethod: 'upi',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      // Attempt 1
      await simulateSingleRecovery('user_12', 'pay_attempt_cap')
      // Attempt 2
      await simulateSingleRecovery('user_12', 'pay_attempt_cap')
      // Attempt 3 (Should be blocked by Stopping Rule)
      const sim3 = await simulateSingleRecovery('user_12', 'pay_attempt_cap')

      expect(sim3.success).toBe(false)
      expect(sim3.status).toBe('MAX_ATTEMPTS_EXCEEDED')
      expect(sim3.amountRecovered).toBe(0)
      expect(sim3.auditEntry.reason).toContain('Maximum simulated retry threshold')
    })
  })

  describe('Batch Recovery Simulation', () => {
    it('executes batch simulation across eligible transactions and excludes non-recoverable ones', async () => {
      const mockExpenses = [
        {
          id: 'exp_b1',
          razorpayPaymentId: 'pay_batch_1',
          amount: 10000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT', // Recoverable
          paymentMethod: 'card',
          createdAt: new Date(),
        },
        {
          id: 'exp_b2',
          razorpayPaymentId: 'pay_batch_2',
          amount: 5000,
          status: 'failed',
          failureCode: 'BAD_REQUEST_PAYMENT_CARD_EXPIRED', // NOT_RECOVERABLE
          paymentMethod: 'card',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const batch = await simulateBatchRecovery('user_12')
      expect(batch.totalEvaluated).toBe(2)
      expect(batch.eligibleCount).toBe(1)
      expect(batch.successfulCount).toBe(1)
      expect(batch.recoveredAmount).toBe(10000)
      expect(batch.exceptions.length).toBe(1)
      expect(batch.exceptions[0].reason).toContain('NOT_RECOVERABLE')
    })
  })

  describe('Copilot Integration for Revenue Recovery', () => {
    it('classifies recovery queries into REVENUE_RECOVERY intent', () => {
      expect(classifyCopilotIntent('How much revenue can I recover?')).toBe('REVENUE_RECOVERY')
      expect(classifyCopilotIntent('Which failed payments should I recover first?')).toBe('REVENUE_RECOVERY')
      expect(classifyCopilotIntent('Show me my highest-priority recovery opportunities')).toBe('REVENUE_RECOVERY')
      expect(classifyCopilotIntent('How much could I recover if I retry my failed payments?')).toBe('REVENUE_RECOVERY')
      expect(classifyCopilotIntent('What would happen if I recover my high priority payments?')).toBe('REVENUE_RECOVERY')
      expect(classifyCopilotIntent('Which recovery campaign would have the biggest impact?')).toBe('REVENUE_RECOVERY')
      expect(classifyCopilotIntent('How much revenue would remain at risk?')).toBe('REVENUE_RECOVERY')
    })

    it('processes REVENUE_RECOVERY queries using deterministic engine', async () => {
      const mockExpenses = [
        {
          id: 'exp_cop1',
          razorpayPaymentId: 'pay_cop_1',
          amount: 8000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
          paymentMethod: 'upi',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const res = await processCopilotQuery('user_12', 'How much revenue can I recover?')
      expect(res.intent).toBe('REVENUE_RECOVERY')
      expect(res.answer).toContain('8,000')
      expect(res.metrics.length).toBeGreaterThan(0)
      expect(res.evidence.length).toBeGreaterThan(0)
    })
  })

  describe('Step 13 — Recovery Campaign & Outcome Simulator Engine', () => {
    it('verifies deterministic recovery probability values per category', () => {
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.NETWORK_FAILURE).toBe(0.85)
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.TIMEOUT).toBe(0.80)
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.PAYMENT_GATEWAY_FAILURE).toBe(0.75)
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.AUTHENTICATION_FAILURE).toBe(0.50)
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.INSUFFICIENT_FUNDS).toBe(0.35)
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.BANK_DECLINE).toBe(0.15)
      expect(DETERMINISTIC_RECOVERY_PROBABILITIES.CUSTOMER_CANCELLED).toBe(0.00)
    })

    it('simulates campaign outcomes deterministically with before/after visualization metrics', async () => {
      const mockExpenses = [
        {
          id: 'exp_step13_1',
          razorpayPaymentId: 'pay_step13_net',
          amount: 10000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT', // TIMEOUT -> 80% prob = 8,000
          paymentMethod: 'card',
          createdAt: new Date(),
        },
        {
          id: 'exp_step13_2',
          razorpayPaymentId: 'pay_step13_declined',
          amount: 5000,
          status: 'failed',
          failureCode: 'BAD_REQUEST_PAYMENT_CARD_EXPIRED', // NOT_RECOVERABLE
          paymentMethod: 'card',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      const result = await simulateRecoveryCampaign('user_12')

      expect(result.isSimulation).toBe(true)
      expect(result.disclaimer).toContain('Simulation only')
      expect(result.transactionsEvaluated).toBe(2)
      expect(result.transactionsSelectedCount).toBe(1)
      expect(result.expectedRecoveredRevenue).toBe(8000)
      expect(result.beforeRecovery.revenueAtRisk).toBe(15000)
      expect(result.simulatedRecovery.expectedRecovery).toBe(8000)
      expect(result.afterRecovery.remainingRisk).toBe(7000)
      expect(result.exceptions.length).toBe(1)
      expect(result.exceptions[0].reason).toContain('NOT_RECOVERABLE')
      expect(result.auditEntry.decision).toBe('SIMULATION')
    })

    it('enforces campaign filters and max transaction count limits', async () => {
      const mockExpenses = [
        {
          id: 'exp_c1',
          razorpayPaymentId: 'pay_c1',
          amount: 12000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
          paymentMethod: 'card',
          createdAt: new Date(),
        },
        {
          id: 'exp_c2',
          razorpayPaymentId: 'pay_c2',
          amount: 15000,
          status: 'failed',
          failureCode: 'GATEWAY_ERROR_PAYMENT_TIMED_OUT',
          paymentMethod: 'upi',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any)

      // Filter by card method only
      const cardCampaign = await simulateRecoveryCampaign('user_12', { paymentMethod: 'card' })
      expect(cardCampaign.transactionsSelectedCount).toBe(1)
      expect(cardCampaign.selectedOpportunities[0].paymentId).toBe('pay_c1')

      // Limit max transactions to 1
      const limitedCampaign = await simulateRecoveryCampaign('user_12', { maxTransactions: 1 })
      expect(limitedCampaign.transactionsSelectedCount).toBe(1)
      expect(limitedCampaign.exceptions.some((e: any) => e.reason.includes('maximum campaign transaction limit'))).toBe(true)
    })

    it('handles empty transaction datasets safely', async () => {
      vi.mocked(prisma.expense.findMany).mockResolvedValue([])

      const result = await simulateRecoveryCampaign('user_12')
      expect(result.transactionsEvaluated).toBe(0)
      expect(result.transactionsSelectedCount).toBe(0)
      expect(result.expectedRecoveredRevenue).toBe(0)
      expect(result.remainingRevenueAtRisk).toBe(0)
    })
  })
})
