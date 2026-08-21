'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useExpenses } from '@/components/expense-provider'
import { TrendingUp, Wallet, Target, Receipt, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { motion } from 'framer-motion'

export function StatsCards() {
  const { getTotalSpent, user, budgets, expenses } = useExpenses()

  const monthlySpent = getTotalSpent('month')
  const weeklySpent = getTotalSpent('week')
  const todaySpent = getTotalSpent('today')
  const remaining = user.monthlyBudget - monthlySpent
  const percentUsed = (monthlySpent / user.monthlyBudget) * 100

  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length

  const stats = [
    {
      title: 'Monthly Spent',
      value: formatCurrency(monthlySpent, user.currency),
      subtitle: `of ${formatCurrency(user.monthlyBudget, user.currency)}`,
      icon: Wallet,
      trend: percentUsed > 80 ? 'warning' : 'normal',
      progress: Math.min(percentUsed, 100),
    },
    {
      title: 'Remaining',
      value: formatCurrency(Math.max(remaining, 0), user.currency),
      subtitle: remaining < 0 ? 'Over budget!' : 'left this month',
      icon: Target,
      trend: remaining < 0 ? 'danger' : remaining < user.monthlyBudget * 0.2 ? 'warning' : 'success',
    },
    {
      title: 'This Week',
      value: formatCurrency(weeklySpent, user.currency),
      subtitle: `${expenses.filter((e) => {
        const d = new Date(e.date)
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        return d >= startOfWeek
      }).length} transactions`,
      icon: Receipt,
      trend: 'normal',
    },
    {
      title: 'Today',
      value: formatCurrency(todaySpent, user.currency),
      subtitle: overBudgetCount > 0 ? `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''} exceeded` : 'Orbiting smoothly ✨',
      icon: overBudgetCount > 0 ? AlertCircle : TrendingUp,
      trend: overBudgetCount > 0 ? 'danger' : 'success',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card className="overflow-hidden border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl shadow-sm h-full">
              <CardContent className="p-4 md:p-5 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs text-[#756E72] dark:text-[#A89FA6] font-medium truncate">{stat.title}</p>
                    <p className="mt-1 text-lg sm:text-2xl font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED] truncate">{stat.value}</p>
                    <p
                      className={cn(
                        'mt-1 text-[11px] font-medium truncate',
                        stat.trend === 'danger' && 'text-[#E9785B]',
                        stat.trend === 'warning' && 'text-[#D8A84E]',
                        stat.trend === 'success' && 'text-[#72B8A5]',
                        stat.trend === 'normal' && 'text-[#756E72]'
                      )}
                    >
                      {stat.subtitle}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold',
                      stat.trend === 'danger'
                        ? 'bg-[#E9785B]'
                        : stat.trend === 'warning'
                        ? 'bg-[#D8A84E]'
                        : stat.trend === 'success'
                        ? 'bg-[#72B8A5]'
                        : 'bg-[#3B1F3A]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                {stat.progress !== undefined && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-[#E4DED5] dark:bg-[#3D2D3D] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          stat.progress > 80 ? 'bg-[#E9785B]' : 'bg-[#3B1F3A]'
                        )}
                        style={{ width: `${stat.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
