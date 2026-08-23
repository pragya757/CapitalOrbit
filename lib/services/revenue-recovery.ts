import { prisma } from '@/lib/prisma'
import {
  analyzeFailedTransactions,
  SingleFailureAnalysis,
  FailureCategory,
  FailureSeverity,
  RecoveryEligibility,
} from './transaction-failure-intelligence'

export type RecoveryPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type RecommendedRecoveryAction =
  | 'RETRY_PAYMENT'
  | 'RETRY_LATER'
  | 'ASK_CUSTOMER_TO_RETRY'
  | 'VERIFY_PAYMENT_METHOD'
  | 'NO_ACTION'

export type SimulationResultStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'REJECTED_PERMANENT'
  | 'MAX_ATTEMPTS_EXCEEDED'

export interface SingleRecoveryOpportunity {
  paymentId: string
  orderId: string | null
  amount: number
  currency: string
  status: string
  paymentMethod: string
  createdAt: string
  category: FailureCategory
  severity: FailureSeverity
  recoveryEligibility: RecoveryEligibility
  priority: RecoveryPriority
  recommendedAction: RecommendedRecoveryAction
  actionExplanation: string
  evidence: string
  attemptCount: number
  isEligibleForSimulation: boolean
  recoveryStatus: 'PENDING' | 'SIMULATED_RECOVERED' | 'SIMULATED_FAILED' | 'NON_RECOVERABLE'
}

export interface RecoveryAuditLogEntry {
  id: string
  timestamp: string
  paymentId: string
  previousStatus: string
  decision: string
  recommendedAction: RecommendedRecoveryAction
  simulationResult: string
  reason: string
}

export interface RevenueRecoverySummary {
  totalRevenueAtRisk: number
  potentiallyRecoverableRevenue: number
  nonRecoverableAmount: number
  recoveryOpportunityPercent: number
  totalOpportunitiesCount: number
  eligibleOpportunitiesCount: number
  nonRecoverableCount: number
  simulatedRecoveredAmount: number
}

export interface SingleSimulationResponse {
  success: boolean
  paymentId: string
  status: SimulationResultStatus
  attemptedAction: RecommendedRecoveryAction
  amountRecovered: number
  remainingRiskAmount: number
  nextRecommendedStep: string
  auditEntry: RecoveryAuditLogEntry
}

export interface BatchSimulationResult {
  totalEvaluated: number
  eligibleCount: number
  attemptedCount: number
  successfulCount: number
  failedCount: number
  recoveredAmount: number
  remainingRiskAmount: number
  exceptions: Array<{ paymentId: string; reason: string }>
}

export interface RevenueRecoveryAnalysisResult {
  success: boolean
  summary: RevenueRecoverySummary
  priorityQueue: SingleRecoveryOpportunity[]
  auditTrail: RecoveryAuditLogEntry[]
}

// In-memory simulation attempt tracker and audit store
const simulationAttemptTracker: Record<string, number> = {}
const simulationStatusTracker: Record<string, 'SIMULATED_RECOVERED' | 'SIMULATED_FAILED'> = {}
const globalAuditTrailStore: RecoveryAuditLogEntry[] = []

/**
 * Deterministically calculates recovery priority based on transaction attributes.
 */
export function calculateRecoveryPriority(
  amount: number,
  severity: FailureSeverity,
  eligibility: RecoveryEligibility,
  createdAt: string
): RecoveryPriority {
  if (eligibility === 'NOT_RECOVERABLE') return 'LOW'

  const txDate = new Date(createdAt)
  const isRecent = Date.now() - txDate.getTime() <= 48 * 60 * 60 * 1000

  if (amount >= 10000 && (eligibility === 'RECOVERABLE' || eligibility === 'POSSIBLY_RECOVERABLE')) {
    return 'CRITICAL'
  }

  if (amount >= 3000 || (eligibility === 'RECOVERABLE' && isRecent)) {
    return 'HIGH'
  }

  if (eligibility === 'RECOVERABLE' || eligibility === 'POSSIBLY_RECOVERABLE') {
    return 'MEDIUM'
  }

  return 'LOW'
}

/**
 * Maps failure category to a bounded recommended recovery action.
 */
export function determineRecommendedAction(
  category: FailureCategory,
  eligibility: RecoveryEligibility
): { action: RecommendedRecoveryAction; explanation: string } {
  if (eligibility === 'NOT_RECOVERABLE' || category === 'CUSTOMER_CANCELLED') {
    return {
      action: 'NO_ACTION',
      explanation: 'Permanent failure or customer cancellation. Re-attempts prohibited to protect merchant standing.',
    }
  }

  switch (category) {
    case 'NETWORK_FAILURE':
    case 'TIMEOUT':
      return {
        action: 'RETRY_PAYMENT',
        explanation: 'Transient connection drop detected. High probability of immediate retry success.',
      }
    case 'PAYMENT_GATEWAY_FAILURE':
      return {
        action: 'RETRY_LATER',
        explanation: 'Payment gateway experienced temporary downtime. Wait for acquiring bank status recovery.',
      }
    case 'INSUFFICIENT_FUNDS':
    case 'AUTHENTICATION_FAILURE':
      return {
        action: 'ASK_CUSTOMER_TO_RETRY',
        explanation: 'Customer balance or 3DS OTP issue. Send notification inviting customer-initiated checkout retry.',
      }
    case 'BANK_DECLINE':
      return {
        action: 'VERIFY_PAYMENT_METHOD',
        explanation: 'Issuing bank decline. Verify instrument limits or ask customer for alternate card/UPI ID.',
      }
    default:
      return {
        action: 'RETRY_LATER',
        explanation: 'Evaluate metadata and attempt retry during next processing cycle.',
      }
  }
}

/**
 * Deterministically analyzes failed transactions to build the Revenue Recovery Queue & Summary.
 */
export async function analyzeRevenueRecovery(
  userId: string
): Promise<RevenueRecoveryAnalysisResult> {
  const failureIntel = await analyzeFailedTransactions(userId)

  let totalRevenueAtRisk = 0
  let potentiallyRecoverableRevenue = 0
  let nonRecoverableAmount = 0
  let nonRecoverableCount = 0
  let eligibleOpportunitiesCount = 0
  let simulatedRecoveredAmount = 0

  const priorityQueue: SingleRecoveryOpportunity[] = failureIntel.transactions.map((tx) => {
    totalRevenueAtRisk += tx.amount

    const attempts = simulationAttemptTracker[tx.paymentId] || 0
    const simStatus = simulationStatusTracker[tx.paymentId]

    const priority = calculateRecoveryPriority(tx.amount, tx.severity, tx.recoveryEligibility, tx.createdAt)
    const { action, explanation } = determineRecommendedAction(tx.category, tx.recoveryEligibility)

    const isEligibleForSimulation =
      tx.recoveryEligibility !== 'NOT_RECOVERABLE' &&
      attempts < 2 &&
      simStatus !== 'SIMULATED_RECOVERED'

    if (tx.recoveryEligibility === 'RECOVERABLE' || tx.recoveryEligibility === 'POSSIBLY_RECOVERABLE') {
      if (simStatus === 'SIMULATED_RECOVERED') {
        simulatedRecoveredAmount += tx.amount
      } else {
        potentiallyRecoverableRevenue += tx.amount
      }
      if (isEligibleForSimulation) {
        eligibleOpportunitiesCount += 1
      }
    } else {
      nonRecoverableAmount += tx.amount
      nonRecoverableCount += 1
    }

    let recoveryStatus: SingleRecoveryOpportunity['recoveryStatus'] = 'PENDING'
    if (simStatus) {
      recoveryStatus = simStatus
    } else if (tx.recoveryEligibility === 'NOT_RECOVERABLE') {
      recoveryStatus = 'NON_RECOVERABLE'
    }

    return {
      paymentId: tx.paymentId,
      orderId: tx.orderId,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      createdAt: tx.createdAt,
      category: tx.category,
      severity: tx.severity,
      recoveryEligibility: tx.recoveryEligibility,
      priority,
      recommendedAction: action,
      actionExplanation: explanation,
      evidence: tx.evidence,
      attemptCount: attempts,
      isEligibleForSimulation,
      recoveryStatus,
    }
  })

  // Sort queue by Priority (CRITICAL > HIGH > MEDIUM > LOW) and then Amount desc
  const priorityWeight: Record<RecoveryPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  }

  priorityQueue.sort((a, b) => {
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority]
    if (diff !== 0) return diff
    return b.amount - a.amount
  })

  const recoveryOpportunityPercent =
    totalRevenueAtRisk > 0
      ? Number(((potentiallyRecoverableRevenue / totalRevenueAtRisk) * 100).toFixed(1))
      : 0

  const summary: RevenueRecoverySummary = {
    totalRevenueAtRisk,
    potentiallyRecoverableRevenue,
    nonRecoverableAmount,
    recoveryOpportunityPercent,
    totalOpportunitiesCount: priorityQueue.length,
    eligibleOpportunitiesCount,
    nonRecoverableCount,
    simulatedRecoveredAmount,
  }

  return {
    success: true,
    summary,
    priorityQueue,
    auditTrail: [...globalAuditTrailStore].reverse(),
  }
}

/**
 * Simulates recovery attempt for a single transaction (TEST/SIMULATION MODE ONLY).
 */
export async function simulateSingleRecovery(
  userId: string,
  paymentId: string
): Promise<SingleSimulationResponse> {
  const analysis = await analyzeRevenueRecovery(userId)
  const tx = analysis.priorityQueue.find((t) => t.paymentId === paymentId)

  if (!tx) {
    throw new Error(`Failed payment ${paymentId} not found.`)
  }

  // Stopping Rule 1: Protected NON_RECOVERABLE transactions
  if (tx.recoveryEligibility === 'NOT_RECOVERABLE') {
    const auditEntry: RecoveryAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      paymentId,
      previousStatus: tx.status,
      decision: 'REJECTED',
      recommendedAction: 'NO_ACTION',
      simulationResult: 'REJECTED_PERMANENT',
      reason: 'Stopping Rule Enforced: Protected NOT_RECOVERABLE transaction cannot be retried.',
    }
    globalAuditTrailStore.push(auditEntry)

    return {
      success: false,
      paymentId,
      status: 'REJECTED_PERMANENT',
      attemptedAction: 'NO_ACTION',
      amountRecovered: 0,
      remainingRiskAmount: tx.amount,
      nextRecommendedStep: 'No action permitted for permanent bank decline / cancellation.',
      auditEntry,
    }
  }

  // Stopping Rule 2: Max simulated retries (Limit: 2)
  const currentAttempts = simulationAttemptTracker[paymentId] || 0
  if (currentAttempts >= 2) {
    const auditEntry: RecoveryAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      paymentId,
      previousStatus: tx.status,
      decision: 'STOPPED',
      recommendedAction: 'NO_ACTION',
      simulationResult: 'MAX_ATTEMPTS_EXCEEDED',
      reason: 'Stopping Rule Enforced: Maximum simulated retry threshold (2 attempts) reached.',
    }
    globalAuditTrailStore.push(auditEntry)

    return {
      success: false,
      paymentId,
      status: 'MAX_ATTEMPTS_EXCEEDED',
      attemptedAction: 'NO_ACTION',
      amountRecovered: 0,
      remainingRiskAmount: tx.amount,
      nextRecommendedStep: 'Escalate to merchant support or mark transaction as permanent loss.',
      auditEntry,
    }
  }

  // Record attempt
  simulationAttemptTracker[paymentId] = currentAttempts + 1

  // Deterministic simulation result logic:
  // Network failures & timeouts recover on attempt 1.
  // Insufficient funds & auth failures succeed if attempt == 1 and category is recoverable.
  const isSuccessful =
    tx.category === 'NETWORK_FAILURE' ||
    tx.category === 'TIMEOUT' ||
    tx.category === 'PAYMENT_GATEWAY_FAILURE' ||
    (tx.recoveryEligibility === 'RECOVERABLE' && currentAttempts === 0)

  if (isSuccessful) {
    simulationStatusTracker[paymentId] = 'SIMULATED_RECOVERED'
    const auditEntry: RecoveryAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      paymentId,
      previousStatus: tx.status,
      decision: 'SUCCESSFUL_SIMULATION',
      recommendedAction: tx.recommendedAction,
      simulationResult: 'SIMULATED_RECOVERED',
      reason: `Simulated ${tx.recommendedAction} action succeeded for transient failure (${tx.category}).`,
    }
    globalAuditTrailStore.push(auditEntry)

    return {
      success: true,
      paymentId,
      status: 'SUCCESS',
      attemptedAction: tx.recommendedAction,
      amountRecovered: tx.amount,
      remainingRiskAmount: 0,
      nextRecommendedStep: 'Simulation complete. Payment recovered in test mode.',
      auditEntry,
    }
  } else {
    simulationStatusTracker[paymentId] = 'SIMULATED_FAILED'
    const auditEntry: RecoveryAuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      paymentId,
      previousStatus: tx.status,
      decision: 'FAILED_SIMULATION',
      recommendedAction: tx.recommendedAction,
      simulationResult: 'SIMULATED_FAILED',
      reason: `Simulated ${tx.recommendedAction} attempt did not recover payment. Failure persists.`,
    }
    globalAuditTrailStore.push(auditEntry)

    return {
      success: false,
      paymentId,
      status: 'FAILED',
      attemptedAction: tx.recommendedAction,
      amountRecovered: 0,
      remainingRiskAmount: tx.amount,
      nextRecommendedStep:
        currentAttempts + 1 >= 2
          ? 'Stopping rule limit reached. Do not retry further.'
          : 'Consider contacting customer for alternate payment method.',
      auditEntry,
    }
  }
}

/**
 * Simulates batch recovery across all eligible failed transactions (TEST/SIMULATION MODE ONLY).
 */
export async function simulateBatchRecovery(
  userId: string
): Promise<BatchSimulationResult> {
  const analysis = await analyzeRevenueRecovery(userId)
  const queue = analysis.priorityQueue

  let totalEvaluated = queue.length
  let eligibleCount = 0
  let attemptedCount = 0
  let successfulCount = 0
  let failedCount = 0
  let recoveredAmount = 0
  let remainingRiskAmount = 0
  const exceptions: Array<{ paymentId: string; reason: string }> = []

  for (const tx of queue) {
    if (!tx.isEligibleForSimulation) {
      exceptions.push({
        paymentId: tx.paymentId,
        reason:
          tx.recoveryEligibility === 'NOT_RECOVERABLE'
            ? 'Protected NOT_RECOVERABLE transaction'
            : tx.attemptCount >= 2
            ? 'Maximum simulated attempts (2) reached'
            : 'Already simulated',
      })
      remainingRiskAmount += tx.amount
      continue
    }

    eligibleCount += 1
    attemptedCount += 1

    const result = await simulateSingleRecovery(userId, tx.paymentId)
    if (result.status === 'SUCCESS') {
      successfulCount += 1
      recoveredAmount += result.amountRecovered
    } else {
      failedCount += 1
      remainingRiskAmount += tx.amount
      exceptions.push({
        paymentId: tx.paymentId,
        reason: `Simulated recovery attempt failed (${result.status})`,
      })
    }
  }

  return {
    totalEvaluated,
    eligibleCount,
    attemptedCount,
    successfulCount,
    failedCount,
    recoveredAmount,
    remainingRiskAmount,
    exceptions,
  }
}

/**
 * Step 13: Deterministic Recovery Probabilities Matrix per failure category.
 */
export const DETERMINISTIC_RECOVERY_PROBABILITIES: Record<FailureCategory, number> = {
  NETWORK_FAILURE: 0.85,
  TIMEOUT: 0.80,
  PAYMENT_GATEWAY_FAILURE: 0.75,
  AUTHENTICATION_FAILURE: 0.50,
  INSUFFICIENT_FUNDS: 0.35,
  BANK_DECLINE: 0.15,
  CUSTOMER_CANCELLED: 0.00,
  UNKNOWN: 0.10,
}

export interface CampaignFilters {
  priority?: RecoveryPriority | 'ALL'
  failureCategory?: FailureCategory | 'ALL'
  paymentMethod?: string | 'ALL'
  maxTransactions?: number
  recoveryAction?: RecommendedRecoveryAction | 'ALL'
}

export interface CampaignExceptionItem {
  paymentId: string
  amount: number
  currency: string
  category: FailureCategory
  paymentMethod: string
  reason: string
}

export interface SelectedCampaignOpportunity {
  paymentId: string
  orderId: string | null
  amount: number
  currency: string
  category: FailureCategory
  priority: RecoveryPriority
  paymentMethod: string
  probability: number
  expectedRecovery: number
  remainingRisk: number
  recommendedAction: RecommendedRecoveryAction
  evidence: string
}

export interface RecoveryCampaignResult {
  campaignId: string
  timestamp: string
  isSimulation: true
  disclaimer: string
  filters: Required<CampaignFilters>

  transactionsEvaluated: number
  eligibleTransactionsCount: number
  totalAmountAtRisk: number
  potentiallyRecoverableAmount: number
  nonRecoverableAmount: number

  transactionsSelectedCount: number
  selectedAmountAtRisk: number
  simulatedAttemptsCount: number

  expectedRecoveredRevenue: number
  remainingRevenueAtRisk: number
  expectedRecoveryRate: number

  beforeRecovery: {
    revenueAtRisk: number
  }
  simulatedRecovery: {
    expectedRecovery: number
  }
  afterRecovery: {
    remainingRisk: number
  }

  explanation: {
    title: string
    summary: string
    reasoning: string
  }

  exceptions: CampaignExceptionItem[]
  selectedOpportunities: SelectedCampaignOpportunity[]
  auditEntry: RecoveryAuditLogEntry
}

/**
 * Step 13: Deterministically simulates a batch recovery campaign based on configurable probability rules.
 */
export async function simulateRecoveryCampaign(
  userId: string,
  filters?: CampaignFilters
): Promise<RecoveryCampaignResult> {
  const analysis = await analyzeRevenueRecovery(userId)
  const queue = analysis.priorityQueue

  const normFilters: Required<CampaignFilters> = {
    priority: filters?.priority || 'ALL',
    failureCategory: filters?.failureCategory || 'ALL',
    paymentMethod: filters?.paymentMethod || 'ALL',
    maxTransactions: typeof filters?.maxTransactions === 'number' ? filters.maxTransactions : 0,
    recoveryAction: filters?.recoveryAction || 'ALL',
  }

  const campaignId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const timestamp = new Date().toISOString()
  const disclaimer = 'Simulation only — no real payment was retried or recovered.'

  let totalAmountAtRisk = 0
  let potentiallyRecoverableAmount = 0
  let nonRecoverableAmount = 0
  let eligibleTransactionsCount = 0

  const exceptions: CampaignExceptionItem[] = []
  const selectedOpportunities: SelectedCampaignOpportunity[] = []

  for (const tx of queue) {
    totalAmountAtRisk += tx.amount

    if (tx.recoveryEligibility === 'RECOVERABLE' || tx.recoveryEligibility === 'POSSIBLY_RECOVERABLE') {
      potentiallyRecoverableAmount += tx.amount
    } else {
      nonRecoverableAmount += tx.amount
    }

    // Exclude Rule 1: Protected NOT_RECOVERABLE or CUSTOMER_CANCELLED
    if (tx.recoveryEligibility === 'NOT_RECOVERABLE' || tx.category === 'CUSTOMER_CANCELLED') {
      exceptions.push({
        paymentId: tx.paymentId,
        amount: tx.amount,
        currency: tx.currency,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        reason: 'Protected NOT_RECOVERABLE transaction / Customer cancelled',
      })
      continue
    }

    // Exclude Rule 2: Max attempts threshold (>= 2)
    if (tx.attemptCount >= 2) {
      exceptions.push({
        paymentId: tx.paymentId,
        amount: tx.amount,
        currency: tx.currency,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        reason: 'Maximum simulated retry threshold (2) reached',
      })
      continue
    }

    // Filter checks
    const matchPriority = normFilters.priority === 'ALL' || tx.priority === normFilters.priority
    const matchCategory = normFilters.failureCategory === 'ALL' || tx.category === normFilters.failureCategory
    const matchMethod = normFilters.paymentMethod === 'ALL' || tx.paymentMethod.toLowerCase() === normFilters.paymentMethod.toLowerCase()
    const matchAction = normFilters.recoveryAction === 'ALL' || tx.recommendedAction === normFilters.recoveryAction

    if (!matchPriority || !matchCategory || !matchMethod || !matchAction) {
      exceptions.push({
        paymentId: tx.paymentId,
        amount: tx.amount,
        currency: tx.currency,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        reason: 'Outside selected campaign filters',
      })
      continue
    }

    eligibleTransactionsCount += 1

    // Exclude Rule 3: Max transaction count limit
    if (normFilters.maxTransactions > 0 && selectedOpportunities.length >= normFilters.maxTransactions) {
      exceptions.push({
        paymentId: tx.paymentId,
        amount: tx.amount,
        currency: tx.currency,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        reason: 'Exceeds selected maximum campaign transaction limit',
      })
      continue
    }

    // Selected for campaign!
    const probability = DETERMINISTIC_RECOVERY_PROBABILITIES[tx.category] ?? 0.10
    const expectedRecovery = Number((tx.amount * probability).toFixed(2))
    const remainingRisk = Number((tx.amount - expectedRecovery).toFixed(2))

    selectedOpportunities.push({
      paymentId: tx.paymentId,
      orderId: tx.orderId,
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      priority: tx.priority,
      paymentMethod: tx.paymentMethod,
      probability,
      expectedRecovery,
      remainingRisk,
      recommendedAction: tx.recommendedAction,
      evidence: tx.evidence,
    })
  }

  const selectedAmountAtRisk = selectedOpportunities.reduce((sum, o) => sum + o.amount, 0)
  const expectedRecoveredRevenue = Number(selectedOpportunities.reduce((sum, o) => sum + o.expectedRecovery, 0).toFixed(2))
  const remainingRevenueAtRisk = Number((totalAmountAtRisk - expectedRecoveredRevenue).toFixed(2))
  const expectedRecoveryRate = totalAmountAtRisk > 0 ? Number(((expectedRecoveredRevenue / totalAmountAtRisk) * 100).toFixed(1)) : 0

  // Explanation generation derived from actual campaign data
  const topCategories = Array.from(new Set(selectedOpportunities.map((o) => o.category)))
  const topCategoriesText = topCategories.length > 0
    ? topCategories.slice(0, 2).map((c) => c.replace(/_/g, ' ')).join(' & ')
    : 'selected filter criteria'

  const explanation = {
    title: 'Why this recovery campaign?',
    summary: selectedOpportunities.length > 0
      ? `This campaign targets ${selectedOpportunities.length} high-value failed transactions totaling ₹${selectedAmountAtRisk.toLocaleString()}. Most recoverable revenue comes from recent ${topCategoriesText} failures.`
      : 'No failed transactions matched the campaign criteria.',
    reasoning: selectedOpportunities.length > 0
      ? `These transactions were prioritized because they carry high recovery probabilities (35% - 85%) and meaningful value. Executing this campaign is estimated to recover ₹${expectedRecoveredRevenue.toLocaleString()} (${expectedRecoveryRate}% of overall risk).`
      : 'Refine campaign filters or check transaction eligibility in the priority queue.',
  }

  const auditEntry: RecoveryAuditLogEntry = {
    id: `audit_campaign_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    paymentId: `CAMPAIGN_${campaignId}`,
    previousStatus: 'FAILED',
    decision: 'SIMULATION',
    recommendedAction: selectedOpportunities[0]?.recommendedAction || 'RETRY_PAYMENT',
    simulationResult: 'SIMULATION',
    reason: `Simulated recovery campaign executed: Evaluated ${queue.length} failed transactions, selected ${selectedOpportunities.length}. Expected recovery: ₹${expectedRecoveredRevenue}.`,
  }
  globalAuditTrailStore.push(auditEntry)

  return {
    campaignId,
    timestamp,
    isSimulation: true,
    disclaimer,
    filters: normFilters,

    transactionsEvaluated: queue.length,
    eligibleTransactionsCount,
    totalAmountAtRisk,
    potentiallyRecoverableAmount,
    nonRecoverableAmount,

    transactionsSelectedCount: selectedOpportunities.length,
    selectedAmountAtRisk,
    simulatedAttemptsCount: selectedOpportunities.length,

    expectedRecoveredRevenue,
    remainingRevenueAtRisk,
    expectedRecoveryRate,

    beforeRecovery: {
      revenueAtRisk: totalAmountAtRisk,
    },
    simulatedRecovery: {
      expectedRecovery: expectedRecoveredRevenue,
    },
    afterRecovery: {
      remainingRisk: remainingRevenueAtRisk,
    },

    explanation,
    exceptions,
    selectedOpportunities,
    auditEntry,
  }
}

