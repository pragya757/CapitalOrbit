import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'

export type SpendingIntensity = 'NONE' | 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH'

export interface DailyExpenseSummary {
  dateKey: string // YYYY-MM-DD
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  transactionCount: number
  totalSpent: number
  totalIncome: number
  netCashFlow: number
  intensity: SpendingIntensity
  expenses: Array<{
    id: string
    description: string
    merchantName?: string
    amount: number
    currency?: string
    category: string
    paymentMethod: string
    date: string
    source?: string
    status?: string
    isRecurring?: boolean
  }>
}

export interface MonthGridOptions {
  currentDate: Date
  expenses: Array<any>
  categoryFilter?: string
  paymentFilter?: string
  sourceFilter?: string
  searchQuery?: string
}

/**
 * Calculates spending intensity relative to the user's average daily spending.
 */
export function calculateSpendingIntensity(
  dailyAmount: number,
  averageDailySpending: number
): SpendingIntensity {
  if (dailyAmount <= 0) return 'NONE'
  if (averageDailySpending <= 0) return 'NORMAL'

  const ratio = dailyAmount / averageDailySpending

  if (ratio < 0.5) return 'LOW'
  if (ratio < 1.2) return 'NORMAL'
  if (ratio < 2.0) return 'HIGH'
  return 'VERY_HIGH'
}

/**
 * Generates calendar month days grid with daily totals, intensities, and filters.
 */
export function generateMonthlyCalendarDays(options: MonthGridOptions) {
  const {
    currentDate,
    expenses,
    categoryFilter = 'all',
    paymentFilter = 'all',
    sourceFilter = 'all',
    searchQuery = '',
  } = options

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const allGridDates = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const filtered = expenses.filter((exp) => {
    if (exp.status === 'failed' || exp.status === 'refunded') return false

    const matchSearch = searchQuery
      ? exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.merchantName && exp.merchantName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true

    const matchCat = categoryFilter === 'all' || exp.category === categoryFilter
    const matchPay = paymentFilter === 'all' || exp.paymentMethod === paymentFilter
    const matchSrc =
      sourceFilter === 'all'
        ? true
        : sourceFilter === 'razorpay'
        ? exp.source === 'razorpay'
        : exp.source !== 'razorpay'

    return matchSearch && matchCat && matchPay && matchSrc
  })

  const dateMap: Record<string, any[]> = {}
  let monthTotalSpent = 0
  let monthTotalIncome = 0
  let totalMonthTxCount = 0

  for (const exp of filtered) {
    const expDate = new Date(exp.date)
    const dateKey = format(expDate, 'yyyy-MM-dd')

    if (!dateMap[dateKey]) dateMap[dateKey] = []
    dateMap[dateKey].push(exp)

    if (isSameMonth(expDate, currentDate)) {
      totalMonthTxCount += 1
      if (exp.type === 'income') {
        monthTotalIncome += exp.amount
      } else {
        monthTotalSpent += exp.amount
      }
    }
  }

  const activeDaysInMonth = Object.keys(dateMap).filter((dk) => {
    const d = new Date(dk)
    return isSameMonth(d, currentDate) && dateMap[dk].some((e) => e.type !== 'income')
  }).length

  const denominator = activeDaysInMonth > 0 ? activeDaysInMonth : 1
  const averageDailySpending = monthTotalSpent > 0 ? monthTotalSpent / denominator : 0

  const todayDate = new Date()

  const days: DailyExpenseSummary[] = allGridDates.map((d) => {
    const dateKey = format(d, 'yyyy-MM-dd')
    const dayExpenses = dateMap[dateKey] || []
    const isCurrentMonth = isSameMonth(d, currentDate)
    const isToday = isSameDay(d, todayDate)

    let totalSpent = 0
    let totalIncome = 0

    for (const e of dayExpenses) {
      if (e.type === 'income') {
        totalIncome += e.amount
      } else {
        totalSpent += e.amount
      }
    }

    const netCashFlow = totalIncome - totalSpent
    const intensity = isCurrentMonth ? calculateSpendingIntensity(totalSpent, averageDailySpending) : 'NONE'

    return {
      dateKey,
      date: d,
      dayOfMonth: d.getDate(),
      isCurrentMonth,
      isToday,
      transactionCount: dayExpenses.length,
      totalSpent,
      totalIncome,
      netCashFlow,
      intensity,
      expenses: dayExpenses,
    }
  })

  return {
    days,
    averageDailySpending,
    monthTotalSpent,
    monthTotalIncome,
    monthNetCashFlow: monthTotalIncome - monthTotalSpent,
    totalMonthTransactions: totalMonthTxCount,
    activeDaysCount: activeDaysInMonth,
  }
}
