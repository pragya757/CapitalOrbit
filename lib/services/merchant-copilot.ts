import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/format'
import { analyzeFailedTransactions } from './transaction-failure-intelligence'
import { analyzeRevenueRecovery, simulateRecoveryCampaign } from './revenue-recovery'
import { calculateFinancialHealth } from './financial-health'
import { calculateCashFlowAnalytics } from './cash-flow-analytics'
import { calculateSpendingAnalytics } from './spending-analytics'
import { calculateFinancialForecast } from './financial-forecast'
import { evaluateFinancialDecision } from './decision-engine'
import { parseNaturalLanguageQuery } from './decision-parser'
import type { CopilotIntent, CopilotResponse, CopilotMetricItem, CopilotEvidenceItem } from '@/lib/types'

/**
 * Classifies query intent using deterministic keyword rules.
 */
export function classifyCopilotIntent(query: string): CopilotIntent {
  const q = query.toLowerCase().trim()

  if (
    q.includes('how much could i recover') ||
    q.includes('if i retry my failed payments') ||
    q.includes('recover my high priority') ||
    q.includes('recover high priority') ||
    q.includes('biggest impact') ||
    q.includes('which recovery campaign') ||
    q.includes('revenue would remain at risk') ||
    q.includes('how much revenue would remain at risk') ||
    q.includes('how much revenue can i recover') ||
    q.includes('which failed payments should i recover first') ||
    q.includes('what should i do about') ||
    q.includes('highest-priority recovery') ||
    q.includes('highest priority recovery') ||
    q.includes('recover failed payments') ||
    q.includes('recovery opportunities') ||
    q.includes('revenue recovery')
  ) {
    return 'REVENUE_RECOVERY'
  }

  if (
    q.includes('revenue at risk') ||
    q.includes('revenue lost') ||
    q.includes('revenue') ||
    q.includes('losing from failed') ||
    q.includes('recoverable revenue') ||
    q.includes('amount at risk') ||
    q.includes('money at risk')
  ) {
    return 'REVENUE_RISK'
  }

  if (
    q.includes('failure spike') ||
    q.includes('unusual failure') ||
    q.includes('failures increasing') ||
    q.includes('abnormal') ||
    q.includes('spike')
  ) {
    return 'FAILURE_SPIKE'
  }

  if (
    q.includes('which payment method') ||
    q.includes('highest failure rate') ||
    q.includes('upi failing') ||
    q.includes('card failing') ||
    q.includes('payment method failure') ||
    q.includes('failing most')
  ) {
    return 'PAYMENT_METHOD_ANALYSIS'
  }

  if (
    q.includes('why did payments fail') ||
    q.includes('why are my payments failing') ||
    q.includes('failed payments') ||
    q.includes('failure reason') ||
    q.includes('what caused failed payments') ||
    q.includes('payment failure') ||
    q.includes('failed transactions')
  ) {
    return 'PAYMENT_FAILURES'
  }

  if (
    q.includes('financial health') ||
    q.includes('financially healthy') ||
    q.includes('current financial situation') ||
    q.includes('health score') ||
    q.includes('how is my health') ||
    q.includes('safe to spend')
  ) {
    return 'FINANCIAL_HEALTH'
  }

  if (
    q.includes('where am i spending') ||
    q.includes('spending the most') ||
    q.includes('what category costs') ||
    q.includes('how much do i spend') ||
    q.includes('category spending') ||
    q.includes('biggest expense')
  ) {
    return 'SPENDING_ANALYSIS'
  }

  if (
    q.includes('cash flow') ||
    q.includes('how much am i saving') ||
    q.includes('is my cash flow positive') ||
    q.includes('monthly cash flow') ||
    q.includes('savings rate')
  ) {
    return 'CASH_FLOW'
  }

  if (
    q.includes('90 days') ||
    q.includes('30 days') ||
    q.includes('60 days') ||
    q.includes('forecast') ||
    q.includes('balance look like in') ||
    q.includes('3 months') ||
    q.includes('future balance') ||
    q.includes('projected balance')
  ) {
    return 'FORECAST'
  }

  if (
    q.includes('can i afford') ||
    q.includes('can i spend') ||
    q.includes('what happens if i spend') ||
    q.includes('should i buy') ||
    q.includes('can i buy')
  ) {
    return 'FINANCIAL_DECISION'
  }

  if (
    q.includes('bike goal') ||
    q.includes('reach my goal') ||
    q.includes('goal deadline') ||
    q.includes('savings goal') ||
    q.includes('target goal') ||
    q.includes('reach target')
  ) {
    return 'GOAL_ANALYSIS'
  }

  if (
    q.includes('financial summary') ||
    q.includes('summarize my finances') ||
    q.includes('how am i doing financially') ||
    q.includes('complete summary') ||
    q.includes('overview')
  ) {
    return 'FINANCIAL_SUMMARY'
  }

  return 'UNKNOWN'
}

/**
 * Process a natural language Copilot query using data-grounded deterministic services.
 */
export async function processCopilotQuery(
  userId: string,
  query: string
): Promise<CopilotResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error(`User ${userId} not found.`)
  }

  const currency = user.currency || 'INR'
  const intent = classifyCopilotIntent(query)

  const disclaimer = 'Disclaimer: CapitalOrbit Copilot provides data-grounded decision intelligence based on recorded transactions, not regulated financial or tax advice.'

  switch (intent) {
    case 'PAYMENT_FAILURES': {
      const failures = await analyzeFailedTransactions(userId)
      const s = failures.summary
      const topCat = failures.categories[0]

      const answer = s.failedPayments > 0
        ? `Recorded ${s.failedPayments} failed payments (${s.failureRate}% failure rate) totaling ${formatCurrency(s.totalFailedAmount, currency)}. Primary failure cause: ${topCat ? topCat.category.replace(/_/g, ' ') : 'Various reasons'}.`
        : 'All payment transactions are healthy. Zero payment failures recorded.'

      const metrics: CopilotMetricItem[] = [
        { label: 'Failed Payments', value: `${s.failedPayments}` },
        { label: 'Failure Rate', value: `${s.failureRate}%` },
        { label: 'Amount at Risk', value: formatCurrency(s.totalFailedAmount, currency) },
        { label: 'Potentially Recoverable', value: formatCurrency(s.potentiallyRecoverableAmount, currency) },
      ]

      const evidence: CopilotEvidenceItem[] = failures.transactions.slice(0, 2).map((t) => ({
        label: `${t.paymentId} (${t.category})`,
        value: t.evidence,
        source: 'Transaction Failure Intelligence Engine',
      }))

      const recommendations: string[] = []
      if (topCat) {
        recommendations.push(`Investigate primary failure reason: ${topCat.category.replace(/_/g, ' ')} (${topCat.count} occurrences).`)
      }
      recommendations.push('Monitor gateway timeouts and 3D-Secure authentication success rates.')

      return {
        success: true,
        intent,
        answer,
        confidence: 0.96,
        metrics,
        evidence,
        recommendations,
        severity: s.failedPayments > 5 ? 'HIGH' : s.failedPayments > 0 ? 'MEDIUM' : 'INFO',
        disclaimer,
      }
    }

    case 'REVENUE_RISK': {
      const failures = await analyzeFailedTransactions(userId)
      const s = failures.summary

      const answer = `Revenue potentially at risk from failed transactions is ${formatCurrency(s.totalFailedAmount, currency)}. Of this, ${formatCurrency(s.potentiallyRecoverableAmount, currency)} is classified as potentially recoverable.`

      const metrics: CopilotMetricItem[] = [
        { label: 'Total Revenue at Risk', value: formatCurrency(s.totalFailedAmount, currency) },
        { label: 'Potentially Recoverable', value: formatCurrency(s.potentiallyRecoverableAmount, currency) },
        { label: 'Non-Recoverable', value: formatCurrency(s.nonRecoverableAmount, currency) },
        { label: 'Unknown Eligibility', value: formatCurrency(s.unknownAmount, currency) },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Revenue Classification Baseline',
          value: `${s.failedPayments} failed payments evaluated across ${failures.categories.length} failure categories.`,
          source: 'Transaction Failure Intelligence Engine',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.95,
        metrics,
        evidence,
        recommendations: [
          'Prioritize recovery efforts on RECOVERABLE network timeout transactions first.',
          'Review bank decline policies with issuing partners.',
        ],
        severity: s.totalFailedAmount > 10000 ? 'HIGH' : 'MEDIUM',
        disclaimer,
      }
    }

    case 'REVENUE_RECOVERY': {
      let priorityFilter: any = 'ALL'
      if (query.toLowerCase().includes('high priority')) priorityFilter = 'HIGH'
      if (query.toLowerCase().includes('critical')) priorityFilter = 'CRITICAL'

      const campaign = await simulateRecoveryCampaign(userId, { priority: priorityFilter })
      const s = campaign

      const answer = `Simulated Recovery Campaign Analysis: Evaluating ${s.transactionsEvaluated} failed payments (${s.transactionsSelectedCount} selected). Realistic expected recovery is ${formatCurrency(s.expectedRecoveredRevenue, currency)} (${s.expectedRecoveryRate}% recovery rate). Remaining revenue at risk will decrease from ${formatCurrency(s.beforeRecovery.revenueAtRisk, currency)} to ${formatCurrency(s.remainingRevenueAtRisk, currency)}.`

      const metrics: CopilotMetricItem[] = [
        { label: 'Revenue at Risk (Before)', value: formatCurrency(s.beforeRecovery.revenueAtRisk, currency) },
        { label: 'Expected Recovered (Simulated)', value: formatCurrency(s.expectedRecoveredRevenue, currency) },
        { label: 'Remaining Revenue Risk', value: formatCurrency(s.remainingRevenueAtRisk, currency) },
        { label: 'Expected Recovery Rate', value: `${s.expectedRecoveryRate}%` },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: s.explanation.title,
          value: `${s.explanation.summary} ${s.explanation.reasoning}`,
          source: 'Deterministic Recovery Campaign & Simulator Engine',
        },
      ]

      const recommendations = s.selectedOpportunities.slice(0, 3).map(
        (t) => `Payment ${t.paymentId} (${formatCurrency(t.amount, currency)}): Expected recovery ${formatCurrency(t.expectedRecovery, currency)} (${Math.round(t.probability * 100)}% prob.) via ${t.recommendedAction.replace(/_/g, ' ')}`
      )
      if (recommendations.length === 0) {
        recommendations.push('No transactions matched the selected campaign filter.')
      }

      return {
        success: true,
        intent,
        answer,
        confidence: 0.97,
        metrics,
        evidence,
        recommendations,
        severity: s.expectedRecoveredRevenue > 5000 ? 'HIGH' : 'MEDIUM',
        disclaimer: `${s.disclaimer} Disclaimer: CapitalOrbit Copilot provides data-grounded decision intelligence based on recorded transactions, not regulated financial or tax advice.`,
      }
    }

    case 'FAILURE_SPIKE': {
      const failures = await analyzeFailedTransactions(userId)
      const s = failures.summary
      const spike = s.failureRateVs7DayAvg

      const answer = spike.spikeNote

      const metrics: CopilotMetricItem[] = [
        { label: 'Recent Failure Rate', value: `${spike.recentFailureRate}%` },
        { label: '7-Day Avg Failure Rate', value: `${spike.sevenDayAvgFailureRate}%` },
        { label: 'Comparison Ratio', value: `${spike.ratio}x` },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Failure Rate Comparison',
          value: `Evaluated recent 24h failure rate (${spike.recentFailureRate}%) against 7-day average (${spike.sevenDayAvgFailureRate}%).`,
          source: 'Transaction Failure Intelligence Engine',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.94,
        metrics,
        evidence,
        recommendations: spike.ratio > 1.5 ? ['Investigate recent gateway infrastructure status.'] : ['Failure rate is within expected thresholds.'],
        severity: spike.ratio > 1.5 ? 'HIGH' : 'INFO',
        disclaimer,
      }
    }

    case 'PAYMENT_METHOD_ANALYSIS': {
      const failures = await analyzeFailedTransactions(userId)
      const methods = failures.paymentMethods
      const topFailed = methods[0]

      const answer = topFailed
        ? `Payment method breakdown shows ${topFailed.method} has the highest failure rate at ${topFailed.failureRate}% (${topFailed.failedCount} failed out of ${topFailed.totalCount} total attempts).`
        : 'No payment method failure patterns detected.'

      const metrics: CopilotMetricItem[] = methods.map((m) => ({
        label: `${m.method} Failure Rate`,
        value: `${m.failureRate}% (${m.failedCount}/${m.totalCount})`,
      }))

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Payment Method Audit',
          value: `Evaluated ${methods.length} payment methods from recorded transactions.`,
          source: 'Transaction Failure Intelligence Engine',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.95,
        metrics,
        evidence,
        recommendations: topFailed && topFailed.failureRate > 20
          ? [`Recommend checking acquiring bank routing for ${topFailed.method}.`]
          : ['Payment method failure distribution is balanced.'],
        severity: topFailed && topFailed.failureRate > 20 ? 'HIGH' : 'INFO',
        disclaimer,
      }
    }

    case 'FINANCIAL_HEALTH': {
      const health = await calculateFinancialHealth(userId)

      const answer = `Your financial health score is ${health.healthScore}/100 (${health.riskLevel.toUpperCase()} risk). Safe-to-spend limit is ${formatCurrency(health.safeToSpend, currency)} with an estimated available balance of ${formatCurrency(health.estimatedAvailableBalance, currency)}.`

      const metrics: CopilotMetricItem[] = [
        { label: 'Health Score', value: `${health.healthScore} / 100` },
        { label: 'Safe to Spend', value: formatCurrency(health.safeToSpend, currency) },
        { label: 'Available Balance', value: formatCurrency(health.estimatedAvailableBalance, currency) },
        { label: 'Upcoming Bills', value: `-${formatCurrency(health.upcomingObligations, currency)}` },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Safe-to-Spend Formula',
          value: 'Balance - Upcoming Bills - Goal Commitments - Safety Reserve',
          source: 'Financial Health Engine',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.98,
        metrics,
        evidence,
        recommendations: health.isOverCommitted
          ? ['Reduce discretionary spending immediately to clear shortfall.']
          : ['Maintain liquidity buffer for upcoming obligations.'],
        severity: health.isOverCommitted ? 'CRITICAL' : health.healthScore < 60 ? 'HIGH' : 'INFO',
        disclaimer,
      }
    }

    case 'SPENDING_ANALYSIS': {
      const analytics = await calculateSpendingAnalytics(userId)
      const topCat = analytics.categories[0]

      const answer = topCat
        ? `Your top spending category is ${topCat.category} at ${formatCurrency(topCat.amount, currency)} (${topCat.percentage}% of total). Total monthly spending is ${formatCurrency(analytics.totalSpending, currency)}.`
        : `Total monthly spending is ${formatCurrency(analytics.totalSpending, currency)}.`

      const metrics: CopilotMetricItem[] = analytics.categories.slice(0, 4).map((c) => ({
        label: c.category,
        value: `${formatCurrency(c.amount, currency)} (${c.percentage}%)`,
      }))

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Categorization Engine',
          value: `Evaluated ${analytics.categories.length} expense categories. Essential spending: ${formatCurrency(analytics.essentialSpending, currency)}.`,
          source: 'Spending Analytics Service',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.96,
        metrics,
        evidence,
        recommendations: topCat ? [`Review discretionary purchases under ${topCat.category}.`] : [],
        severity: 'INFO',
        disclaimer,
      }
    }

    case 'CASH_FLOW': {
      const cf = await calculateCashFlowAnalytics(userId)

      const answer = `Your net monthly cash flow is ${formatCurrency(cf.netCashFlow, currency)} (Income: ${formatCurrency(cf.totalIncome, currency)}, Expenses: ${formatCurrency(cf.totalExpenses, currency)}). Your current savings rate is ${cf.savingsRate}%.`

      const metrics: CopilotMetricItem[] = [
        { label: 'Net Cash Flow', value: formatCurrency(cf.netCashFlow, currency) },
        { label: 'Monthly Income', value: formatCurrency(cf.totalIncome, currency) },
        { label: 'Monthly Expenses', value: formatCurrency(cf.totalExpenses, currency) },
        { label: 'Savings Rate', value: `${cf.savingsRate}%` },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Cash Flow Deterministic Engine',
          value: `Net Cash Flow = Total Income (${formatCurrency(cf.totalIncome, currency)}) - Total Expenses (${formatCurrency(cf.totalExpenses, currency)})`,
          source: 'Cash Flow Analytics Service',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.97,
        metrics,
        evidence,
        recommendations: cf.netCashFlow < 0 ? ['Expenses exceed income. Reduce discretionary budget caps.'] : ['Maintain positive cash flow to fund savings goals.'],
        severity: cf.netCashFlow < 0 ? 'HIGH' : 'INFO',
        disclaimer,
      }
    }

    case 'FORECAST': {
      const fc = await calculateFinancialForecast(userId)

      const answer = `Based on your cash flow trends, your projected balance in 90 days is ${formatCurrency(fc.forecasts.day90.projectedBalance, currency)} (${fc.forecasts.day90.riskLevel} risk). 30-day projected balance is ${formatCurrency(fc.forecasts.day30.projectedBalance, currency)}.`

      const metrics: CopilotMetricItem[] = [
        { label: '30-Day Proj. Balance', value: formatCurrency(fc.forecasts.day30.projectedBalance, currency) },
        { label: '60-Day Proj. Balance', value: formatCurrency(fc.forecasts.day60.projectedBalance, currency) },
        { label: '90-Day Proj. Balance', value: formatCurrency(fc.forecasts.day90.projectedBalance, currency) },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Forecast Simulation Model',
          value: 'Forward projection derived from recurring obligations and historical cash flow trends.',
          source: 'Financial Forecast Service',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.94,
        metrics,
        evidence,
        recommendations: [fc.forecasts.day90.statusNote],
        severity: fc.forecasts.day90.riskLevel === 'HIGH' ? 'HIGH' : 'INFO',
        disclaimer,
      }
    }

    case 'FINANCIAL_DECISION': {
      const parsedReq = parseNaturalLanguageQuery(query)

      // Fallback handling: If an amount cannot be extracted, ask the user to provide the amount
      if (!parsedReq.amount || isNaN(parsedReq.amount) || parsedReq.amount <= 0) {
        return {
          success: true,
          intent,
          answer: "Please specify the monetary amount you would like to evaluate (for example: 'Can I afford ₹20,000?' or 'Can I spend ₹15,000 on a phone?').",
          confidence: 0.9,
          metrics: [],
          evidence: [],
          recommendations: [
            "Try asking: 'Can I afford ₹20,000?'",
            "Try asking: 'Can I spend ₹15,000 on a phone?'",
            "Try asking: 'Can I spend 20000 on a laptop?'",
            "Try asking: 'Can I afford a ₹50,000 laptop?'",
          ],
          severity: 'INFO',
          disclaimer,
        }
      }

      const decision = await evaluateFinancialDecision(userId, parsedReq)

      // Fix duplicate answer generation: Display financial-decision explanation only ONCE
      const answer = decision.explanation

      const metrics: CopilotMetricItem[] = [
        { label: 'Decision', value: decision.decision },
        { label: 'Requested Amount', value: formatCurrency(decision.requestedAmount || parsedReq.amount, currency) },
        { label: 'Risk Level', value: decision.riskLevel },
        { label: 'Safe to Spend', value: formatCurrency(decision.safeToSpend, currency) },
        { label: 'Remaining Margin', value: formatCurrency(decision.remainingSafeToSpend, currency) },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: 'Decision Engine Baseline',
          value: `Evaluated against Safe-to-Spend (${formatCurrency(decision.safeToSpend, currency)}).`,
          source: 'Financial Decision Engine',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: decision.confidence,
        metrics,
        evidence,
        recommendations: decision.alternatives.map((a) => `${a.title}: ${a.calculatedSavingsOrDelay}`),
        severity: decision.riskLevel === 'CRITICAL' ? 'CRITICAL' : decision.riskLevel === 'HIGH' ? 'HIGH' : 'INFO',
        disclaimer,
      }
    }

    case 'GOAL_ANALYSIS': {
      const health = await calculateFinancialHealth(userId)
      const goal = health.goalBreakdown[0]

      const answer = goal && !isNaN(goal.requiredMonthlyContribution) && !isNaN(goal.savedAmount) && !isNaN(goal.targetAmount)
        ? `Your active savings goal '${goal.name}' requires a monthly contribution of ${formatCurrency(goal.requiredMonthlyContribution, currency)}. You have saved ${formatCurrency(goal.savedAmount, currency)} of ${formatCurrency(goal.targetAmount, currency)}.`
        : 'No active savings goals found. Create a savings goal to track your progress.'

      const metrics: CopilotMetricItem[] = goal
        ? [
            { label: 'Goal Name', value: goal.name },
            { label: 'Target Amount', value: formatCurrency(goal.targetAmount, currency) },
            { label: 'Saved Amount', value: formatCurrency(goal.savedAmount, currency) },
            { label: 'Req. Monthly Contribution', value: formatCurrency(goal.requiredMonthlyContribution, currency) },
          ]
        : []

      const evidence: CopilotEvidenceItem[] = goal
        ? [
            {
              label: 'Goal Allocation Formula',
              value: `Required Monthly = (Target ${formatCurrency(goal.targetAmount, currency)} - Saved ${formatCurrency(goal.savedAmount, currency)}) / Months`,
              source: 'Financial Health & Savings Goal Engine',
            },
          ]
        : []

      return {
        success: true,
        intent,
        answer,
        confidence: 0.96,
        metrics,
        evidence,
        recommendations: goal ? [`Set aside ${formatCurrency(goal.requiredMonthlyContribution, currency)} monthly.`] : [],
        severity: 'INFO',
        disclaimer,
      }
    }

    case 'FINANCIAL_SUMMARY': {
      const health = await calculateFinancialHealth(userId)
      const cf = await calculateCashFlowAnalytics(userId)
      const failures = await analyzeFailedTransactions(userId)

      const answer = `Complete Financial Summary: Health Score is ${health.healthScore}/100 (${health.riskLevel.toUpperCase()} risk). Safe-to-Spend is ${formatCurrency(health.safeToSpend, currency)}. Net monthly cash flow is ${formatCurrency(cf.netCashFlow, currency)}. ${failures.summary.failedPayments} failed payments (${formatCurrency(failures.summary.totalFailedAmount, currency)} at risk).`

      const metrics: CopilotMetricItem[] = [
        { label: 'Health Score', value: `${health.healthScore}/100` },
        { label: 'Safe to Spend', value: formatCurrency(health.safeToSpend, currency) },
        { label: 'Net Cash Flow', value: formatCurrency(cf.netCashFlow, currency) },
        { label: 'Failed Payments', value: `${failures.summary.failedPayments} (${formatCurrency(failures.summary.totalFailedAmount, currency)})` },
      ]

      const evidence: CopilotEvidenceItem[] = [
        {
          label: '360° Financial Aggregator',
          value: 'Combined Financial Health, Cash Flow, Spending Analytics, and Transaction Failure Intelligence.',
          source: 'CapitalOrbit Copilot Engine',
        },
      ]

      return {
        success: true,
        intent,
        answer,
        confidence: 0.98,
        metrics,
        evidence,
        recommendations: [
          'Maintain liquidity margin for upcoming bills.',
          'Review failed transaction details to recover lost revenue.',
        ],
        severity: health.isOverCommitted ? 'CRITICAL' : 'INFO',
        disclaimer,
      }
    }

    default: {
      return {
        success: true,
        intent: 'UNKNOWN',
        answer: 'I can help you analyze payments, spending, cash flow, financial health, forecasts, goals, and financial decisions. Try asking me one of those.',
        confidence: 0.5,
        metrics: [],
        evidence: [],
        recommendations: [
          'Ask: "Why did payments fail today?"',
          'Ask: "How is my financial health?"',
          'Ask: "Where am I spending the most?"',
          'Ask: "What will my balance look like in 90 days?"',
        ],
        severity: 'INFO',
        disclaimer,
      }
    }
  }
}
