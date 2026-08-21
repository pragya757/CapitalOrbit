import { calculateFinancialHealth } from './financial-health'

export interface ForecastHorizonResult {
  horizonDays: number
  projectedIncome: number
  projectedExpenses: number
  projectedBalance: number
  projectedSafeToSpend: number
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  statusNote: string
}

export interface FinancialForecastResult {
  currentAvailableBalance: number
  currentSafeToSpend: number
  forecasts: {
    day30: ForecastHorizonResult
    day60: ForecastHorizonResult
    day90: ForecastHorizonResult
  }
  generatedAt: string
}

/**
 * Builds a deterministic 30/60/90 day financial forecast based on actual SpendWise data,
 * recurring obligations, active goals, and historical spending velocity.
 */
export async function calculateFinancialForecast(userId: string): Promise<FinancialForecastResult> {
  let health: any
  try {
    health = await calculateFinancialHealth(userId)
  } catch {
    health = {
      estimatedAvailableBalance: 0,
      safeToSpend: 0,
      monthlyIncome: 0,
      monthlySpending: 0,
      upcomingObligations: 0,
      goalCommitments: 0,
      safetyReserve: 0,
    }
  }

  const currentAvailableBalance = health.estimatedAvailableBalance
  const currentSafeToSpend = health.safeToSpend

  const monthlyIncome = health.monthlyIncome
  const monthlySpending = health.monthlySpending
  const monthlyObligations = health.upcomingObligations
  const monthlyGoalCommitments = health.goalCommitments
  const safetyReserve = health.safetyReserve

  const generateHorizon = (days: number): ForecastHorizonResult => {
    const months = days / 30
    const projectedIncome = Number((monthlyIncome * months).toFixed(2))
    const projectedExpenses = Number(((monthlySpending + monthlyObligations) * months).toFixed(2))
    const projectedBalance = Number((currentAvailableBalance + projectedIncome - projectedExpenses).toFixed(2))

    const projectedSafeToSpend = Number(
      (projectedBalance - monthlyObligations * months - monthlyGoalCommitments * months - safetyReserve).toFixed(2)
    )

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW'
    let statusNote = `Projected buffer is healthy for the next ${days} days.`

    if (projectedSafeToSpend < 0) {
      if (Math.abs(projectedSafeToSpend) > safetyReserve) {
        riskLevel = 'CRITICAL'
        statusNote = `High risk of shortfall within ${days} days. Discretionary spending cut strongly recommended.`
      } else {
        riskLevel = 'HIGH'
        statusNote = `Potential over-commitment projected within ${days} days.`
      }
    } else if (projectedSafeToSpend < 5000) {
      riskLevel = 'MODERATE'
      statusNote = `Tight liquidity margin projected over the next ${days} days.`
    }

    return {
      horizonDays: days,
      projectedIncome,
      projectedExpenses,
      projectedBalance,
      projectedSafeToSpend,
      riskLevel,
      statusNote,
    }
  }

  return {
    currentAvailableBalance,
    currentSafeToSpend,
    forecasts: {
      day30: generateHorizon(30),
      day60: generateHorizon(60),
      day90: generateHorizon(90),
    },
    generatedAt: new Date().toISOString(),
  }
}
