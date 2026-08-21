import { prisma } from '@/lib/prisma'

export interface MonthlyCashFlowPoint {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface CashFlowAnalyticsResult {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  averageMonthlyIncome: number
  averageMonthlyExpenses: number
  savingsRate: number
  monthlyTrend: MonthlyCashFlowPoint[]
}

/**
 * Calculates deterministic historical cash flow analytics from database records.
 * Excludes failed and refunded expenses.
 */
export async function calculateCashFlowAnalytics(userId: string): Promise<CashFlowAnalyticsResult> {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({
      where: {
        userId,
        status: { notIn: ['failed', 'refunded'] },
      },
    }),
  ])

  const totalIncome = Number(incomes.reduce((acc, inc) => acc + inc.amount, 0).toFixed(2))
  const totalExpenses = Number(expenses.reduce((acc, exp) => acc + exp.amount, 0).toFixed(2))
  const netCashFlow = Number((totalIncome - totalExpenses).toFixed(2))

  const savingsRate = totalIncome > 0 ? Number(Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)) : 0

  // Group by YYYY-MM
  const monthlyMap: Record<string, { income: number; expenses: number }> = {}

  incomes.forEach((inc) => {
    const key = (inc.date || '').substring(0, 7)
    if (!key) return
    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expenses: 0 }
    monthlyMap[key].income += inc.amount
  })

  expenses.forEach((exp) => {
    const key = (exp.date || '').substring(0, 7)
    if (!key) return
    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expenses: 0 }
    monthlyMap[key].expenses += exp.amount
  })

  const sortedKeys = Object.keys(monthlyMap).sort()
  const monthCount = Math.max(1, sortedKeys.length)

  const averageMonthlyIncome = Number((totalIncome / monthCount).toFixed(2))
  const averageMonthlyExpenses = Number((totalExpenses / monthCount).toFixed(2))

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const monthlyTrend: MonthlyCashFlowPoint[] = sortedKeys.map((key) => {
    const [year, monthNum] = key.split('-')
    const monthLabel = monthNames[parseInt(monthNum, 10) - 1] || key
    const inc = Number(monthlyMap[key].income.toFixed(2))
    const exp = Number(monthlyMap[key].expenses.toFixed(2))
    const sav = Number((inc - exp).toFixed(2))

    return {
      month: `${monthLabel} ${year ? year.substring(2) : ''}`.trim(),
      income: inc,
      expenses: exp,
      savings: sav,
    }
  })

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    averageMonthlyIncome,
    averageMonthlyExpenses,
    savingsRate,
    monthlyTrend,
  }
}
