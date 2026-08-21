import { prisma } from '@/lib/prisma'

export interface CategorySpending {
  category: string
  amount: number
  percentage: number
  changeFromPreviousMonth: number
}

export interface MerchantSpending {
  merchantName: string
  amount: number
  count: number
}

export interface SpendingAnalyticsResult {
  totalSpending: number
  essentialSpending: number
  discretionarySpending: number
  essentialPercentage: number
  discretionaryPercentage: number
  categories: CategorySpending[]
  topMerchants: MerchantSpending[]
  largestTransactions: any[]
}

const ESSENTIAL_CATEGORIES = new Set(['housing', 'utilities', 'transportation', 'groceries', 'health', 'education'])

/**
 * Calculates deterministic spending analytics, category breakdown, top merchants, and MoM changes.
 */
export async function calculateSpendingAnalytics(userId: string): Promise<SpendingAnalyticsResult> {
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      status: { notIn: ['failed', 'refunded'] },
    },
    orderBy: { date: 'desc' },
  })

  const totalSpending = Number(expenses.reduce((acc, exp) => acc + exp.amount, 0).toFixed(2))

  let essentialSpending = 0
  let discretionarySpending = 0

  const categoryMap: Record<string, { current: number; previous: number }> = {}
  const merchantMap: Record<string, { amount: number; count: number }> = {}

  const today = new Date()
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`

  expenses.forEach((exp) => {
    const isEssential = ESSENTIAL_CATEGORIES.has(exp.category.toLowerCase())
    if (isEssential) {
      essentialSpending += exp.amount
    } else {
      discretionarySpending += exp.amount
    }

    const monthKey = (exp.date || '').substring(0, 7)
    const cat = exp.category || 'uncategorized'

    if (!categoryMap[cat]) categoryMap[cat] = { current: 0, previous: 0 }

    if (monthKey === currentMonthKey || !monthKey) {
      categoryMap[cat].current += exp.amount
    } else if (monthKey === prevMonthKey) {
      categoryMap[cat].previous += exp.amount
    } else {
      categoryMap[cat].current += exp.amount
    }

    const mName = exp.merchantName || exp.description.split(' ')[0] || 'Other'
    if (!merchantMap[mName]) merchantMap[mName] = { amount: 0, count: 0 }
    merchantMap[mName].amount += exp.amount
    merchantMap[mName].count += 1
  })

  essentialSpending = Number(essentialSpending.toFixed(2))
  discretionarySpending = Number(discretionarySpending.toFixed(2))

  const essentialPercentage = totalSpending > 0 ? Number(((essentialSpending / totalSpending) * 100).toFixed(1)) : 0
  const discretionaryPercentage = totalSpending > 0 ? Number(((discretionarySpending / totalSpending) * 100).toFixed(1)) : 0

  const categories: CategorySpending[] = Object.keys(categoryMap).map((cat) => {
    const current = categoryMap[cat].current
    const previous = categoryMap[cat].previous
    const percentage = totalSpending > 0 ? Number(((current / totalSpending) * 100).toFixed(1)) : 0
    let changeFromPreviousMonth = 0

    if (previous > 0) {
      changeFromPreviousMonth = Number((((current - previous) / previous) * 100).toFixed(1))
    }

    return {
      category: cat,
      amount: Number(current.toFixed(2)),
      percentage,
      changeFromPreviousMonth,
    }
  }).sort((a, b) => b.amount - a.amount)

  const topMerchants: MerchantSpending[] = Object.keys(merchantMap)
    .map((mName) => ({
      merchantName: mName,
      amount: Number(merchantMap[mName].amount.toFixed(2)),
      count: merchantMap[mName].count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const largestTransactions = expenses
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
      paymentMethod: e.paymentMethod,
      source: e.source,
      merchantName: e.merchantName,
    }))

  return {
    totalSpending,
    essentialSpending,
    discretionarySpending,
    essentialPercentage,
    discretionaryPercentage,
    categories,
    topMerchants,
    largestTransactions,
  }
}
