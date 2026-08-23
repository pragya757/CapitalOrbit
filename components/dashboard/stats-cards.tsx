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
  const budgetLimit = user?.monthlyBudget || 15000
  const currency = user?.currency || 'INR'
  const remaining = budgetLimit - monthlySpent
  const percentUsed = budgetLimit > 0 ? (monthlySpent / budgetLimit) * 100 : 0

  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length

  const stats = [
    {
      title: 'Monthly Spent',
      value: formatCurrency(monthlySpent, currency),
      subtitle: `of ${formatCurrency(budgetLimit, currency)}`,
      icon: Wallet,
      trend: percentUsed > 80 ? 'warning' : 'normal',
      progress: Math.min(percentUsed, 100),
      cardBg: 'bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] dark:from-[#171E3B] dark:to-[#0E1328] border-indigo-300 dark:border-indigo-800/60',
      titleColor: 'text-indigo-800 dark:text-indigo-300',
      valueColor: 'text-indigo-950 dark:text-indigo-100',
    },
    {
      title: 'Remaining',
      value: formatCurrency(Math.max(remaining, 0), currency),
      subtitle: remaining < 0 ? 'Over budget!' : 'left this month',
      icon: Target,
      trend: remaining < 0 ? 'danger' : remaining < budgetLimit * 0.2 ? 'warning' : 'success',
      cardBg: 'bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0A3B1E] dark:to-[#052613] border-emerald-300 dark:border-emerald-800/60',
      titleColor: 'text-emerald-800 dark:text-emerald-300',
      valueColor: 'text-emerald-950 dark:text-emerald-100',
    },
    {
      title: 'This Week',
      value: formatCurrency(weeklySpent, currency),
      subtitle: `${expenses.filter((e) => {
        const d = new Date(e.date)
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        return d >= startOfWeek
      }).length} transactions`,
      icon: Receipt,
      trend: 'normal',
      cardBg: 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#2B230A] dark:to-[#1C1605] border-amber-300 dark:border-amber-800/60',
      titleColor: 'text-amber-800 dark:text-amber-300',
      valueColor: 'text-amber-950 dark:text-amber-100',
    },
    {
      title: 'Today',
      value: formatCurrency(todaySpent, currency),
      subtitle: overBudgetCount > 0 ? `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''} exceeded` : 'Orbiting smoothly ✨',
      icon: overBudgetCount > 0 ? AlertCircle : TrendingUp,
      trend: overBudgetCount > 0 ? 'danger' : 'success',
      cardBg: 'bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-[#3B1417] dark:to-[#260A0C] border-rose-300 dark:border-rose-800/60',
      titleColor: 'text-rose-800 dark:text-rose-300',
      valueColor: 'text-rose-950 dark:text-rose-100',
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
            <Card className={cn("overflow-hidden rounded-2xl shadow-sm h-full border", stat.cardBg)}>
              <CardContent className="p-4 md:p-5 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={cn("text-xs font-bold uppercase tracking-wider truncate", stat.titleColor)}>{stat.title}</p>
                    <p className={cn("mt-1 text-lg sm:text-2xl font-serif font-extrabold truncate font-mono", stat.valueColor)}>{stat.value}</p>
                    <p
                      className={cn(
                        'mt-1 text-[11px] font-medium truncate',
                        stat.trend === 'danger' && 'text-rose-600 dark:text-rose-400 font-bold',
                        stat.trend === 'warning' && 'text-amber-600 dark:text-amber-400 font-bold',
                        stat.trend === 'success' && 'text-emerald-600 dark:text-emerald-400 font-bold',
                        stat.trend === 'normal' && 'text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {stat.subtitle}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold shadow-sm',
                      stat.trend === 'danger'
                        ? 'bg-rose-500'
                        : stat.trend === 'warning'
                        ? 'bg-amber-500'
                        : stat.trend === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-600'
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                {stat.progress !== undefined && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-indigo-200 dark:bg-indigo-900/60 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          stat.progress > 80 ? 'bg-rose-500' : 'bg-indigo-600'
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
