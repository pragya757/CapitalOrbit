import { prisma } from '@/lib/prisma'

export type FailureCategory =
  | 'BANK_DECLINE'
  | 'INSUFFICIENT_FUNDS'
  | 'AUTHENTICATION_FAILURE'
  | 'NETWORK_FAILURE'
  | 'TIMEOUT'
  | 'PAYMENT_GATEWAY_FAILURE'
  | 'CUSTOMER_CANCELLED'
  | 'UNKNOWN'

export type FailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type RecoveryEligibility =
  | 'RECOVERABLE'
  | 'POSSIBLY_RECOVERABLE'
  | 'NOT_RECOVERABLE'
  | 'UNKNOWN'

export interface SingleFailureAnalysis {
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
  amountAtRisk: number
  failureReason: string
  failureCode: string | null
  failureSource: string | null
  evidence: string
}

export interface FailurePatternSummary {
  failedPayments: number
  successfulPayments: number
  totalPayments: number
  failureRate: number
  totalFailedAmount: number
  potentiallyRecoverableAmount: number
  nonRecoverableAmount: number
  unknownAmount: number
  hourlyDistribution: Record<number, number>
  failureRateVs7DayAvg: {
    recentFailureRate: number
    sevenDayAvgFailureRate: number
    ratio: number
    spikeNote: string
  }
}

export interface FailureCategoryBreakdown {
  category: FailureCategory
  count: number
  amount: number
}

export interface PaymentMethodFailurePattern {
  method: string
  totalCount: number
  failedCount: number
  failureRate: number
}

export interface TransactionFailureIntelligenceResult {
  success: boolean
  summary: FailurePatternSummary
  categories: FailureCategoryBreakdown[]
  paymentMethods: PaymentMethodFailurePattern[]
  transactions: SingleFailureAnalysis[]
}

/**
 * Deterministically analyze a single transaction failure.
 */
export function analyzeTransactionFailure(
  expenseInput: {
    razorpayPaymentId?: string | null
    razorpayOrderId?: string | null
    amount: number
    status: string
    paymentMethod: string
    createdAt?: Date | string
    failureReason?: string | null
    failureCode?: string | null
    failureSource?: string | null
  },
  attemptsCountForOrder: number = 1
): SingleFailureAnalysis {
  const paymentId = expenseInput.razorpayPaymentId || `pay_sim_${Math.random().toString(36).substring(2, 9)}`
  const orderId = expenseInput.razorpayOrderId || null
  const amount = expenseInput.amount
  const currency = 'INR'
  const status = expenseInput.status
  const paymentMethod = expenseInput.paymentMethod || 'upi'
  const createdAt = expenseInput.createdAt
    ? new Date(expenseInput.createdAt).toISOString()
    : new Date().toISOString()

  const rawReason = (expenseInput.failureReason || '').toLowerCase()
  const rawCode = (expenseInput.failureCode || '').toLowerCase()
  const rawSource = (expenseInput.failureSource || '').toLowerCase()
  const combined = `${rawReason} ${rawCode} ${rawSource}`

  let category: FailureCategory = 'UNKNOWN'
  let severity: FailureSeverity = 'LOW'
  let recoveryEligibility: RecoveryEligibility = 'UNKNOWN'
  let evidence = 'Insufficient Razorpay failure metadata provided to determine precise failure root cause.'

  if (
    combined.includes('insufficient_balance') ||
    combined.includes('insufficient_funds') ||
    combined.includes('low_balance') ||
    combined.includes('insufficient')
  ) {
    category = 'INSUFFICIENT_FUNDS'
    severity = 'MEDIUM'
    recoveryEligibility = 'POSSIBLY_RECOVERABLE'
    evidence = 'Razorpay returned insufficient balance code for customer account/card. Customer can retry after adding funds.'
  } else if (
    combined.includes('timeout') ||
    combined.includes('timed_out') ||
    combined.includes('gateway_error_payment_timed_out')
  ) {
    category = 'TIMEOUT'
    severity = 'MEDIUM'
    recoveryEligibility = 'RECOVERABLE'
    evidence = 'Payment session timed out before confirmation from payment gateway.'
  } else if (
    combined.includes('network') ||
    combined.includes('connection_error') ||
    combined.includes('socket')
  ) {
    category = 'NETWORK_FAILURE'
    severity = 'MEDIUM'
    recoveryEligibility = 'RECOVERABLE'
    evidence = 'Transient network connectivity error between checkout client and Razorpay gateway servers.'
  } else if (
    combined.includes('3d_secure') ||
    combined.includes('otp') ||
    combined.includes('auth_failed') ||
    combined.includes('authentication') ||
    combined.includes('password')
  ) {
    category = 'AUTHENTICATION_FAILURE'
    severity = 'LOW'
    recoveryEligibility = 'POSSIBLY_RECOVERABLE'
    evidence = 'Customer failed 3D-Secure authentication or OTP verification during checkout.'
  } else if (
    combined.includes('cancelled') ||
    combined.includes('canceled') ||
    combined.includes('user_cancelled') ||
    combined.includes('checkout_closed')
  ) {
    category = 'CUSTOMER_CANCELLED'
    severity = 'LOW'
    recoveryEligibility = 'POSSIBLY_RECOVERABLE'
    evidence = 'Customer closed the checkout modal or explicitly abandoned the payment flow.'
  } else if (
    combined.includes('expired_card') ||
    combined.includes('stolen_card') ||
    combined.includes('stolen') ||
    combined.includes('expired')
  ) {
    category = 'BANK_DECLINE'
    severity = 'HIGH'
    recoveryEligibility = 'NOT_RECOVERABLE'
    evidence = 'Card is expired or reported stolen. Re-attempt with this instrument is invalid.'
  } else if (
    combined.includes('bank_decline') ||
    combined.includes('declined_by_bank') ||
    combined.includes('decline') ||
    combined.includes('do_not_honor')
  ) {
    category = 'BANK_DECLINE'
    severity = 'HIGH'
    recoveryEligibility = 'POSSIBLY_RECOVERABLE'
    evidence = 'Issuing bank declined transaction attempt. Customer should contact card issuer.'
  } else if (
    combined.includes('gateway_error') ||
    combined.includes('gateway_down') ||
    combined.includes('internal_server_error') ||
    combined.includes('gateway')
  ) {
    category = 'PAYMENT_GATEWAY_FAILURE'
    severity = 'HIGH'
    recoveryEligibility = 'RECOVERABLE'
    evidence = 'Payment gateway infrastructure or acquiring server experienced an internal processing error.'
  } else if (expenseInput.failureReason || expenseInput.failureCode) {
    category = 'UNKNOWN'
    severity = 'MEDIUM'
    recoveryEligibility = 'UNKNOWN'
    evidence = `Unmapped Razorpay failure code '${expenseInput.failureCode || 'N/A'}' received.`
  }

  // Adjust for repeated consecutive failures on the same order
  if (attemptsCountForOrder >= 3) {
    severity = 'CRITICAL'
    if (recoveryEligibility !== 'NOT_RECOVERABLE') {
      recoveryEligibility = 'NOT_RECOVERABLE'
    }
    evidence += ` (${attemptsCountForOrder} consecutive failed attempts recorded for order).`
  } else if (attemptsCountForOrder === 2) {
    if (severity === 'LOW') severity = 'MEDIUM'
    else if (severity === 'MEDIUM') severity = 'HIGH'
    evidence += ` (2 repeated failed attempts recorded for order).`
  }

  return {
    paymentId,
    orderId,
    amount,
    currency,
    status,
    paymentMethod,
    createdAt,
    category,
    severity,
    recoveryEligibility,
    amountAtRisk: amount,
    failureReason: expenseInput.failureReason || expenseInput.failureCode || 'Transaction failed',
    failureCode: expenseInput.failureCode || null,
    failureSource: expenseInput.failureSource || null,
    evidence,
  }
}

/**
 * Analyze all failed transactions and calculate failure patterns for a specific user.
 */
export async function analyzeFailedTransactions(
  userId: string
): Promise<TransactionFailureIntelligenceResult> {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const failedExpenses = expenses.filter((e) => e.status === 'failed')
  const successfulExpenses = expenses.filter(
    (e) => e.status === 'captured' || e.status === 'authorized'
  )

  const totalPayments = expenses.length
  const failedPayments = failedExpenses.length
  const successfulPayments = successfulExpenses.length
  const failureRate = totalPayments > 0 ? Number(((failedPayments / totalPayments) * 100).toFixed(1)) : 0

  // Count order attempts
  const orderAttemptCounts: Record<string, number> = {}
  failedExpenses.forEach((exp) => {
    if (exp.razorpayOrderId) {
      orderAttemptCounts[exp.razorpayOrderId] = (orderAttemptCounts[exp.razorpayOrderId] || 0) + 1
    }
  })

  // Analyze individual failed transactions
  const transactions: SingleFailureAnalysis[] = failedExpenses.map((exp) => {
    const attempts = exp.razorpayOrderId ? orderAttemptCounts[exp.razorpayOrderId] || 1 : 1
    return analyzeTransactionFailure(
      {
        razorpayPaymentId: exp.razorpayPaymentId,
        razorpayOrderId: exp.razorpayOrderId,
        amount: exp.amount,
        status: exp.status,
        paymentMethod: exp.paymentMethod,
        createdAt: exp.createdAt,
        failureReason: exp.failureReason,
        failureCode: exp.failureCode,
        failureSource: exp.failureSource,
      },
      attempts
    )
  })

  // Aggregate Amounts & Categories
  let totalFailedAmount = 0
  let potentiallyRecoverableAmount = 0
  let nonRecoverableAmount = 0
  let unknownAmount = 0

  const categoryMap: Record<FailureCategory, { count: number; amount: number }> = {
    BANK_DECLINE: { count: 0, amount: 0 },
    INSUFFICIENT_FUNDS: { count: 0, amount: 0 },
    AUTHENTICATION_FAILURE: { count: 0, amount: 0 },
    NETWORK_FAILURE: { count: 0, amount: 0 },
    TIMEOUT: { count: 0, amount: 0 },
    PAYMENT_GATEWAY_FAILURE: { count: 0, amount: 0 },
    CUSTOMER_CANCELLED: { count: 0, amount: 0 },
    UNKNOWN: { count: 0, amount: 0 },
  }

  const hourlyDistribution: Record<number, number> = {}
  for (let i = 0; i < 24; i++) hourlyDistribution[i] = 0

  transactions.forEach((tx) => {
    totalFailedAmount += tx.amount
    if (tx.recoveryEligibility === 'RECOVERABLE' || tx.recoveryEligibility === 'POSSIBLY_RECOVERABLE') {
      potentiallyRecoverableAmount += tx.amount
    } else if (tx.recoveryEligibility === 'NOT_RECOVERABLE') {
      nonRecoverableAmount += tx.amount
    } else {
      unknownAmount += tx.amount
    }

    if (categoryMap[tx.category]) {
      categoryMap[tx.category].count += 1
      categoryMap[tx.category].amount += tx.amount
    }

    const hour = new Date(tx.createdAt).getHours()
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
  })

  const categories: FailureCategoryBreakdown[] = (Object.keys(categoryMap) as FailureCategory[])
    .filter((cat) => categoryMap[cat].count > 0)
    .map((cat) => ({
      category: cat,
      count: categoryMap[cat].count,
      amount: categoryMap[cat].amount,
    }))
    .sort((a, b) => b.count - a.count)

  // Payment Method Analysis
  const methodStats: Record<string, { total: number; failed: number }> = {}
  expenses.forEach((e) => {
    const m = (e.paymentMethod || 'upi').toLowerCase()
    if (!methodStats[m]) methodStats[m] = { total: 0, failed: 0 }
    methodStats[m].total += 1
    if (e.status === 'failed') methodStats[m].failed += 1
  })

  const paymentMethods: PaymentMethodFailurePattern[] = Object.keys(methodStats).map((m) => {
    const tot = methodStats[m].total
    const fld = methodStats[m].failed
    const rate = tot > 0 ? Number(((fld / tot) * 100).toFixed(1)) : 0
    return {
      method: m.toUpperCase(),
      totalCount: tot,
      failedCount: fld,
      failureRate: rate,
    }
  }).sort((a, b) => b.failedCount - a.failedCount)

  // 7-day vs recent comparison (Simple failure spike comparison)
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const recentTx = expenses.filter((e) => new Date(e.createdAt) >= oneDayAgo)
  const recentFailed = recentTx.filter((e) => e.status === 'failed').length
  const recentFailureRate = recentTx.length > 0 ? Number(((recentFailed / recentTx.length) * 100).toFixed(1)) : failureRate

  const sevenDayTx = expenses.filter((e) => new Date(e.createdAt) >= sevenDaysAgo)
  const sevenDayFailed = sevenDayTx.filter((e) => e.status === 'failed').length
  const sevenDayAvgFailureRate = sevenDayTx.length > 0 ? Number(((sevenDayFailed / sevenDayTx.length) * 100).toFixed(1)) : failureRate

  const ratio = sevenDayAvgFailureRate > 0 ? Number((recentFailureRate / sevenDayAvgFailureRate).toFixed(1)) : 1.0
  const spikeNote =
    ratio > 1.5
      ? `Recent failure rate (${recentFailureRate}%) is ${ratio}x higher than 7-day average (${sevenDayAvgFailureRate}%).`
      : `Recent failure rate (${recentFailureRate}%) is within normal range relative to 7-day average (${sevenDayAvgFailureRate}%).`

  return {
    success: true,
    summary: {
      failedPayments,
      successfulPayments,
      totalPayments,
      failureRate,
      totalFailedAmount,
      potentiallyRecoverableAmount,
      nonRecoverableAmount,
      unknownAmount,
      hourlyDistribution,
      failureRateVs7DayAvg: {
        recentFailureRate,
        sevenDayAvgFailureRate,
        ratio,
        spikeNote,
      },
    },
    categories,
    paymentMethods,
    transactions,
  }
}
