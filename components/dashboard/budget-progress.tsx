'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryIcon, getCategoryLabel } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { Ghost } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { getBudgetMessage } from '@/lib/microcopy'

export function BudgetProgress() {
  const { budgets, user } = useExpenses()

  if (budgets.length === 0) {
    return (
      <Card className="h-full border-teal-300 dark:border-teal-800/60 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] dark:from-[#0B2524] dark:to-[#061817] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-serif font-bold text-teal-950 dark:text-teal-100">Budget Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-[#061817] text-teal-700 dark:text-teal-300 mb-3">
              <Ghost className="h-6 w-6" />
            </div>
            <p className="mt-2 text-xs font-bold text-teal-950 dark:text-teal-100">No category budgets defined</p>
            <p className="mt-1 text-[11px] text-teal-700 dark:text-teal-300">
              Define category caps to protect your Safe-to-Spend limit
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-teal-300 dark:border-teal-800/60 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] dark:from-[#0B2524] dark:to-[#061817] rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-serif font-bold text-teal-950 dark:text-teal-100">Budget Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {budgets.map((budget, i) => {
            const Icon = getCategoryIcon(budget.category)
            const percentage = Math.min((budget.spent / budget.limit) * 100, 100)
            const isOverBudget = budget.spent > budget.limit
            const isNearLimit = percentage >= 80 && !isOverBudget
            const message = getBudgetMessage((budget.spent / budget.limit) * 100)

            return (
              <motion.div
                key={budget.id}
                className="space-y-1.5 p-2.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-white/80 dark:bg-[#061817]/80 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold shadow-sm',
                        isOverBudget
                          ? 'bg-rose-500'
                          : isNearLimit
                          ? 'bg-amber-500'
                          : 'bg-teal-600'
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-teal-950 dark:text-teal-100">
                        {getCategoryLabel(budget.category)}
                      </span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-300 font-medium">{message}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={cn('font-bold font-mono', isOverBudget ? 'text-rose-600' : 'text-teal-950 dark:text-teal-100')}>
                      {formatCurrency(budget.spent, user?.currency || 'INR')}
                    </span>
                    <span className="text-teal-700 dark:text-teal-300 text-[11px] font-mono">
                      / {formatCurrency(budget.limit, user?.currency || 'INR')}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-teal-200/60 dark:bg-teal-950/60 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-teal-600'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
