'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryLabel, CHART_COLORS, ALL_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import type { ExpenseCategory } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isWithinInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns'
import { cn } from '@/lib/utils'

export function AnalyticsPage() {
  const { expenses, getTotalSpent, getSpendingByCategory, user, totalBudgeted } = useExpenses()

  // Daily spending for last 7 days
  const dailySpending = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    })

    return days.map(day => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)

      const total = expenses
        .filter(exp => {
          const expDate = new Date(exp.date)
          return isWithinInterval(expDate, { start: dayStart, end: dayEnd })
        })
        .reduce((sum, exp) => sum + exp.amount, 0)

      return {
        day: format(day, 'EEE'),
        amount: total,
        fullDate: format(day, 'MMM d'),
      }
    })
  }, [expenses])

  // Weekly spending for current month
  const weeklySpending = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd })

    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart)

      const total = expenses
        .filter(exp => {
          const expDate = new Date(exp.date)
          return isWithinInterval(expDate, {
            start: weekStart,
            end: weekEnd > monthEnd ? monthEnd : weekEnd
          })
        })
        .reduce((sum, exp) => sum + exp.amount, 0)

      return {
        week: `Week ${index + 1}`,
        amount: total,
      }
    })
  }, [expenses])

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = { cash: 0, card: 0, upi: 0, wallet: 0 }
    const monthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      const monthStart = startOfMonth(new Date())
      return expDate >= monthStart
    })
    monthExpenses.forEach(exp => {
      methods[exp.paymentMethod] += exp.amount
    })
    return Object.entries(methods)
      .filter(([, amount]) => amount > 0)
      .map(([method, amount]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: amount,
      }))
  }, [expenses])

  // Top spending categories
  const topCategories = getSpendingByCategory('month').slice(0, 5)

  // Stats calculations
  const monthlySpent = getTotalSpent('month')
  const weeklySpent = getTotalSpent('week')
  const lastWeekStart = subDays(startOfWeek(new Date()), 7)
  const lastWeekEnd = subDays(endOfWeek(new Date()), 7)
  const lastWeekSpent = expenses
    .filter(exp => {
      const expDate = new Date(exp.date)
      return isWithinInterval(expDate, { start: lastWeekStart, end: lastWeekEnd })
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  const weeklyChange = lastWeekSpent > 0
    ? ((weeklySpent - lastWeekSpent) / lastWeekSpent) * 100
    : 0

  const avgDailySpend = monthlySpent / new Date().getDate()
  const projectedMonthly = avgDailySpend * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()

  const currencySymbol = user.currency

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Insights into your spending habits
          </p>
        </div>
        <Button onClick={() => window.print()} className="gap-2 shrink-0">
          <Calendar className="h-4 w-4" /> {/* Or a Printer icon if imported */}
          Export PDF Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Daily Spend</p>
                <p className="text-xl font-bold">{formatCurrency(avgDailySpend, currencySymbol)}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Week vs Last Week</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{formatCurrency(weeklySpent, currencySymbol)}</p>
                  <span className={cn(
                    "flex items-center text-xs font-medium",
                    weeklyChange > 0 ? "text-destructive" : "text-accent"
                  )}>
                    {weeklyChange > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {Math.abs(weeklyChange).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Projected Monthly</p>
                <p className={cn(
                  "text-xl font-bold",
                  projectedMonthly > totalBudgeted && "text-destructive"
                )}>
                  {formatCurrency(projectedMonthly, currencySymbol)}
                </p>
              </div>
              {projectedMonthly > totalBudgeted ? (
                <TrendingUp className="h-8 w-8 text-destructive/50" />
              ) : (
                <TrendingDown className="h-8 w-8 text-accent/50" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold">{expenses.length}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                This month: {expenses.filter(exp => new Date(exp.date) >= startOfMonth(new Date())).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Spending (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySpending}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-card p-3 shadow-md">
                            <p className="text-sm font-medium">{data.fullDate}</p>
                            <p className="text-lg font-bold">{formatCurrency(data.amount, currencySymbol)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySpending}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-card p-3 shadow-md">
                            <p className="text-sm font-medium">{data.week}</p>
                            <p className="text-lg font-bold">{formatCurrency(data.amount, currencySymbol)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Spending Categories</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No spending data available
                </p>
              ) : (
                topCategories.map((cat, index) => {
                  const maxAmount = topCategories[0].amount
                  const percentage = (cat.amount / maxAmount) * 100
                  return (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {getCategoryLabel(cat.category)}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(cat.amount, currencySymbol)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[(ALL_CATEGORIES as string[]).indexOf(cat.category) % CHART_COLORS.length] || CHART_COLORS[CHART_COLORS.length - 1]
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
            <CardDescription>How you pay for things</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentBreakdown.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No payment data available
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const total = paymentBreakdown.reduce((sum, p) => sum + p.value, 0)
                          const percentage = ((data.value / total) * 100).toFixed(1)
                          return (
                            <div className="rounded-lg border bg-card p-3 shadow-md">
                              <p className="text-sm font-medium">{data.name}</p>
                              <p className="text-lg font-bold">{formatCurrency(data.value, currencySymbol)}</p>
                              <p className="text-xs text-muted-foreground">{percentage}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      content={({ payload }) => (
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                          {payload?.map((entry, index) => {
                            const Icon = entry.value === 'Cash' ? Banknote :
                              entry.value === 'Card' ? CreditCard :
                              entry.value === 'Upi' ? Smartphone : Wallet
                            return (
                              <div key={`legend-${index}`} className="flex items-center gap-1.5">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <Icon className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{entry.value}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
