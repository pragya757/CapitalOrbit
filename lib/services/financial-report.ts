import { calculateFinancialHealth } from './financial-health'
import { calculateSpendingAnalytics } from './spending-analytics'
import { calculateCashFlowAnalytics } from './cash-flow-analytics'
import { calculateFinancialForecast } from './financial-forecast'
import { generateFinancialInsights } from './financial-insights'
import { formatCurrency } from '../format'

export interface FinancialReportData {
  generatedAt: string
  userName: string
  currency: string
  healthSummary: any
  cashFlowSummary: any
  spendingSummary: any
  forecastSummary: any
  insightsSummary: any[]
}

/**
 * Compiles a comprehensive, printable financial summary report for the user.
 */
export async function generateFinancialReport(userId: string, userName = 'User'): Promise<FinancialReportData> {
  const [health, cashFlow, spending, forecast, insightsResult] = await Promise.all([
    calculateFinancialHealth(userId),
    calculateCashFlowAnalytics(userId),
    calculateSpendingAnalytics(userId),
    calculateFinancialForecast(userId),
    generateFinancialInsights(userId),
  ])

  return {
    generatedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    userName,
    currency: 'INR',
    healthSummary: {
      healthScore: health.healthScore,
      riskLevel: health.riskLevel,
      estimatedAvailableBalance: health.estimatedAvailableBalance,
      upcomingObligations: health.upcomingObligations,
      goalCommitments: health.goalCommitments,
      safetyReserve: health.safetyReserve,
      safeToSpend: health.safeToSpend,
      isOverCommitted: health.isOverCommitted,
      shortfall: health.shortfall,
      dataConfidence: health.dataConfidence,
      confidenceNote: health.confidenceNote,
    },
    cashFlowSummary: {
      totalIncome: cashFlow.totalIncome,
      totalExpenses: cashFlow.totalExpenses,
      netCashFlow: cashFlow.netCashFlow,
      savingsRate: cashFlow.savingsRate,
      averageMonthlyIncome: cashFlow.averageMonthlyIncome,
      averageMonthlyExpenses: cashFlow.averageMonthlyExpenses,
    },
    spendingSummary: {
      totalSpending: spending.totalSpending,
      essentialSpending: spending.essentialSpending,
      discretionarySpending: spending.discretionarySpending,
      categories: spending.categories,
      topMerchants: spending.topMerchants,
    },
    forecastSummary: forecast.forecasts,
    insightsSummary: insightsResult.insights,
  }
}
