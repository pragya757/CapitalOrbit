import { calculateFinancialHealth } from './financial-health'
import { calculateSpendingAnalytics, type CategorySpending } from './spending-analytics'
import { calculateCashFlowAnalytics } from './cash-flow-analytics'
import { formatCurrency } from '../format'

export interface FinancialInsightItem {
  id: string
  title: string
  severity: 'INFO' | 'POSITIVE' | 'WARNING' | 'CRITICAL'
  explanation: string
  metric: string
  recommendedAction?: string
}

export interface FinancialInsightsResult {
  insights: FinancialInsightItem[]
  generatedAt: string
}

/**
 * Generates explainable, deterministic financial insights from live application metrics.
 */
export async function generateFinancialInsights(userId: string): Promise<FinancialInsightsResult> {
  let health: any, spending: any, cashFlow: any
  try {
    const results = await Promise.all([
      calculateFinancialHealth(userId),
      calculateSpendingAnalytics(userId),
      calculateCashFlowAnalytics(userId),
    ])
    health = results[0]
    spending = results[1]
    cashFlow = results[2]
  } catch {
    return {
      insights: [
        {
          id: 'ins_welcome',
          title: 'Welcome to CapitalOrbit',
          severity: 'INFO',
          explanation: 'Load demo profile or add transactions to unlock AI Financial Insights.',
          metric: 'CapitalOrbit Active',
        },
      ],
      generatedAt: new Date().toISOString(),
    }
  }

  const insights: FinancialInsightItem[] = []

  // 1. Safe-to-Spend Status
  if (health.isOverCommitted) {
    insights.push({
      id: 'ins_overcommitted',
      title: 'Safe-to-Spend Limit Over-Committed',
      severity: 'CRITICAL',
      explanation: `Your current Safe-to-Spend is negative (-₹${health.shortfall.toLocaleString()}). Your fixed obligations and goal targets exceed your available liquid cash.`,
      metric: `-₹${health.shortfall.toLocaleString()} Shortfall`,
      recommendedAction: 'Temporarily pause non-essential goal contributions or trim discretionary dining and shopping.',
    })
  } else if (health.safeToSpend > 0) {
    insights.push({
      id: 'ins_safe_to_spend_healthy',
      title: 'Safe Liquidity Buffer Active',
      severity: 'POSITIVE',
      explanation: `You have ₹${health.safeToSpend.toLocaleString()} available to spend safely after protecting safety reserves, recurring obligations, and active goals.`,
      metric: `₹${health.safeToSpend.toLocaleString()} Safe-to-Spend`,
      recommendedAction: 'Maintain current budget limits to stay on schedule for your goals.',
    })
  }

  // 2. Savings Rate Insight
  if (cashFlow.savingsRate >= 20) {
    insights.push({
      id: 'ins_high_savings_rate',
      title: 'Strong Savings Rate Recorded',
      severity: 'POSITIVE',
      explanation: `Your current savings rate is ${cashFlow.savingsRate}%, outperforming the standard 20% benchmark.`,
      metric: `${cashFlow.savingsRate}% Savings Rate`,
    })
  } else if (cashFlow.savingsRate > 0 && cashFlow.savingsRate < 20) {
    insights.push({
      id: 'ins_low_savings_rate',
      title: 'Savings Rate Below 20% Benchmark',
      severity: 'WARNING',
      explanation: `Your savings rate is currently ${cashFlow.savingsRate}%. Increasing savings by triming discretionary spending will strengthen your safety reserve.`,
      metric: `${cashFlow.savingsRate}% Savings Rate`,
      recommendedAction: 'Target allocating at least 20% of net monthly income to savings and emergency reserves.',
    })
  }

  // 3. Category Increase Warnings (MoM)
  if (spending?.categories) {
    spending.categories.forEach((cat: CategorySpending) => {
      if (cat.changeFromPreviousMonth >= 15 && cat.amount > 1000) {
        insights.push({
          id: `ins_cat_increase_${cat.category}`,
          title: `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} Spending Increased ${cat.changeFromPreviousMonth}%`,
          severity: 'WARNING',
          explanation: `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} spending rose by ${cat.changeFromPreviousMonth}% compared to last month (now ₹${cat.amount.toLocaleString()}).`,
          metric: `+${cat.changeFromPreviousMonth}% MoM`,
          recommendedAction: `Review recent ${cat.category} transactions to identify non-essential purchases.`,
        })
      }
    })
  }

  // 4. Upcoming Obligations Ratio
  if (health.monthlyIncome > 0) {
    const obligationsRatio = Number(((health.upcomingObligations / health.monthlyIncome) * 100).toFixed(1))
    if (obligationsRatio > 40) {
      insights.push({
        id: 'ins_high_obligations',
        title: 'High Fixed Obligations Ratio',
        severity: 'WARNING',
        explanation: `Upcoming fixed obligations consume ${obligationsRatio}% of your monthly income (₹${health.upcomingObligations.toLocaleString()}).`,
        metric: `${obligationsRatio}% of Income`,
        recommendedAction: 'Avoid adding new recurring subscriptions until your income increases.',
      })
    }
  }

  // 5. Goal Commitment Progress
  if (health.goalBreakdown.length > 0) {
    const primaryGoal = health.goalBreakdown[0]
    insights.push({
      id: 'ins_goal_progress',
      title: `Goal Commitment: ${primaryGoal.name}`,
      severity: primaryGoal.isAtRisk ? 'WARNING' : 'INFO',
      explanation: primaryGoal.isAtRisk
        ? `'${primaryGoal.name}' requires ₹${primaryGoal.requiredMonthlyContribution.toLocaleString()}/month, which currently tightens your monthly liquidity.`
        : `'${primaryGoal.name}' is on track with ₹${primaryGoal.savedAmount.toLocaleString()} saved towards ₹${primaryGoal.targetAmount.toLocaleString()}.`,
      metric: `₹${primaryGoal.requiredMonthlyContribution.toLocaleString()}/mo Required`,
    })
  }

  return {
    insights,
    generatedAt: new Date().toISOString(),
  }
}
