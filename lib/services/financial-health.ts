import { prisma } from '@/lib/prisma'
import type { FinancialHealthSummary, ObligationBreakdownItem, GoalBreakdownItem, ScoreBreakdown } from '@/lib/types'

const ESSENTIAL_CATEGORIES = new Set([
  'food',
  'groceries',
  'transport',
  'utilities',
  'health',
  'rent',
  'salaries',
  'inventory',
  'operations',
])

/**
 * Calculates user's Financial Health & Safe-to-Spend summary based on actual SpendWise data.
 */
export async function calculateFinancialHealth(userId: string): Promise<FinancialHealthSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      incomes: true,
      expenses: true,
      recurring: true,
      savingsGoals: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
  const currentMonthPrefix = `${currentYear}-${currentMonth}`

  // 1. Calculate Estimated Available Balance
  // Filter out failed and refunded payments strictly
  const validExpenses = user.expenses.filter(
    (exp) => exp.status !== 'failed' && exp.status !== 'refunded'
  )

  const totalIncome = user.incomes.reduce((acc, inc) => acc + inc.amount, 0)
  const totalExpenses = validExpenses.reduce((acc, exp) => acc + exp.amount, 0)

  // Estimated Available Balance from historical data
  const estimatedAvailableBalance = Math.max(0, totalIncome - totalExpenses)

  // 2. Current Month Metrics
  const currentMonthIncomes = user.incomes.filter((inc) => inc.date.startsWith(currentMonthPrefix))
  const currentMonthExpenses = validExpenses.filter((exp) => exp.date.startsWith(currentMonthPrefix))

  const monthlyIncome =
    currentMonthIncomes.length > 0
      ? currentMonthIncomes.reduce((acc, inc) => acc + inc.amount, 0)
      : totalIncome > 0
      ? totalIncome
      : user.monthlyBudget || 15000

  const monthlySpending = currentMonthExpenses.reduce((acc, exp) => acc + exp.amount, 0)

  const monthlyEssentialExpenses = currentMonthExpenses
    .filter((exp) => ESSENTIAL_CATEGORIES.has(exp.category.toLowerCase()))
    .reduce((acc, exp) => acc + exp.amount, 0)

  // 3. Upcoming Obligations
  const obligationsBreakdown: ObligationBreakdownItem[] = []

  // Active Recurring Rules (Expense)
  for (const rule of user.recurring) {
    if (rule.isActive && rule.type === 'expense') {
      obligationsBreakdown.push({
        name: rule.description,
        amount: rule.amount,
        type: 'known',
        frequency: rule.frequency,
      })
    }
  }

  // Recurring Expenses from history
  const recurringExpenses = validExpenses.filter((exp) => exp.isRecurring)
  for (const exp of recurringExpenses) {
    // Avoid double counting if already present in breakdown
    if (!obligationsBreakdown.some((o) => o.name.toLowerCase() === exp.description.toLowerCase())) {
      obligationsBreakdown.push({
        name: exp.merchantName || exp.description,
        amount: exp.amount,
        type: 'known',
        frequency: exp.recurringFrequency || 'monthly',
      })
    }
  }

  const upcomingObligations = obligationsBreakdown.reduce((acc, item) => acc + item.amount, 0)

  // 4. Goal Commitments
  const goalBreakdown: GoalBreakdownItem[] = []

  for (const goal of user.savingsGoals) {
    if (goal.savedAmount < goal.targetAmount) {
      const remainingTarget = goal.targetAmount - goal.savedAmount

      let remainingMonths = 12
      if (goal.deadline) {
        const deadlineDate = new Date(goal.deadline)
        const diffMs = deadlineDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        remainingMonths = Math.max(1, Math.ceil(diffDays / 30))
      }

      const requiredMonthlyContribution = Number((remainingTarget / remainingMonths).toFixed(2))

      goalBreakdown.push({
        goalId: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        deadline: goal.deadline || undefined,
        requiredMonthlyContribution,
      })
    }
  }

  const goalCommitments = goalBreakdown.reduce((acc, item) => acc + item.requiredMonthlyContribution, 0)

  // 5. Safety Reserve Calculation
  // Dynamic reserve based on essential expenses or 15% fallback
  const safetyReserve =
    monthlyEssentialExpenses > 0
      ? monthlyEssentialExpenses
      : Number((user.monthlyBudget * 0.15).toFixed(2))

  // 6. Safe to Spend Baseline Formula
  const rawSafeToSpend = estimatedAvailableBalance - upcomingObligations - goalCommitments - safetyReserve
  const isOverCommitted = rawSafeToSpend < 0
  const safeToSpend = isOverCommitted ? 0 : Number(rawSafeToSpend.toFixed(2))
  const shortfall = isOverCommitted ? Number(Math.abs(rawSafeToSpend).toFixed(2)) : 0

  // 7. Savings Rate
  const savingsRate =
    monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - monthlySpending) / monthlyIncome) * 100))
      : 0

  // 8. Data Confidence Evaluation
  const totalTransactions = validExpenses.length + user.incomes.length
  let dataConfidence: 'high' | 'medium' | 'low' = 'low'
  let confidenceNote = 'Based on limited transaction history'

  if (totalTransactions >= 15) {
    dataConfidence = 'high'
    confidenceNote = 'Based on comprehensive transaction history'
  } else if (totalTransactions >= 5) {
    dataConfidence = 'medium'
    confidenceNote = 'Based on 1-2 months of transaction data'
  }

  // 9. Deterministic Health Score Calculation (0-100)
  const targetRequiredLiquidity = upcomingObligations + goalCommitments + safetyReserve
  const cashCoverageRatio = targetRequiredLiquidity > 0 ? estimatedAvailableBalance / targetRequiredLiquidity : 1.0
  const cashCoverage = Math.min(100, Math.round(cashCoverageRatio * 100))

  const spendingStability = Math.min(100, Math.max(0, Math.round(savingsRate * 1.5)))

  const discretionaryCashFlow = Math.max(0, monthlyIncome - monthlyEssentialExpenses - upcomingObligations)
  const goalAffordabilityRatio = goalCommitments > 0 ? discretionaryCashFlow / goalCommitments : 1.0
  const goalAffordability = Math.min(100, Math.round(goalAffordabilityRatio * 100))

  const safetyReserveCoverageRatio = safetyReserve > 0 ? estimatedAvailableBalance / safetyReserve : 1.0
  const safetyReserveCoverage = Math.min(100, Math.round(safetyReserveCoverageRatio * 100))

  const rawScore =
    cashCoverage * 0.30 +
    spendingStability * 0.25 +
    goalAffordability * 0.25 +
    safetyReserveCoverage * 0.20

  const healthScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low'
  if (healthScore < 40 || isOverCommitted) {
    riskLevel = 'critical'
  } else if (healthScore < 60) {
    riskLevel = 'high'
  } else if (healthScore < 80) {
    riskLevel = 'moderate'
  }

  const scoreBreakdown: ScoreBreakdown = {
    cashCoverage,
    spendingStability,
    goalAffordability,
    safetyReserveCoverage,
  }

  return {
    estimatedAvailableBalance: Number(estimatedAvailableBalance.toFixed(2)),
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    monthlySpending: Number(monthlySpending.toFixed(2)),
    monthlyEssentialExpenses: Number(monthlyEssentialExpenses.toFixed(2)),
    upcomingObligations: Number(upcomingObligations.toFixed(2)),
    goalCommitments: Number(goalCommitments.toFixed(2)),
    safetyReserve: Number(safetyReserve.toFixed(2)),
    safeToSpend,
    isOverCommitted,
    shortfall,
    healthScore,
    riskLevel,
    savingsRate,
    dataConfidence,
    confidenceNote,
    scoreBreakdown,
    obligationsBreakdown,
    goalBreakdown,
    hasSufficientData: totalTransactions >= 3,
  }
}
