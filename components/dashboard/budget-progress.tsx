'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryIcon, getCategoryLabel } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { AlertTriangle, Ghost } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { getBudgetMessage } from '@/lib/microcopy'

export function BudgetProgress() {
  const { budgets, user } = useExpenses()

  if (budgets.length === 0) {
    return (
      <Card className="h-full border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Budget Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4ED] dark:bg-[#1C141C] text-[#3B1F3A] dark:text-[#F7F4ED] mb-3">
              <Ghost className="h-6 w-6" />
            </div>
            <p className="mt-2 text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">No category budgets defined</p>
            <p className="mt-1 text-[11px] text-[#756E72]">
              Define category caps to protect your Safe-to-Spend limit
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Budget Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget, i) => {
            const Icon = getCategoryIcon(budget.category)
            const percentage = Math.min((budget.spent / budget.limit) * 100, 100)
            const isOverBudget = budget.spent > budget.limit
            const isNearLimit = percentage >= 80 && !isOverBudget
            const message = getBudgetMessage((budget.spent / budget.limit) * 100)

            return (
              <motion.div
                key={budget.id}
                className="space-y-1.5 p-2.5 rounded-xl border border-[#E4DED5]/60 bg-[#F7F4ED]/50 dark:bg-[#1C141C]/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold',
                        isOverBudget
                          ? 'bg-[#E9785B]'
                          : isNearLimit
                          ? 'bg-[#D8A84E]'
                          : 'bg-[#3B1F3A]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                        {getCategoryLabel(budget.category)}
                      </span>
                      <span className="text-[10px] text-[#756E72]">{message}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={cn('font-bold', isOverBudget ? 'text-[#E9785B]' : 'text-[#3B1F3A] dark:text-[#F7F4ED]')}>
                      {formatCurrency(budget.spent, user.currency)}
                    </span>
                    <span className="text-[#756E72] text-[11px]">
                      / {formatCurrency(budget.limit, user.currency)}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-[#E4DED5] dark:bg-[#3D2D3D] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isOverBudget ? 'bg-[#E9785B]' : isNearLimit ? 'bg-[#D8A84E]' : 'bg-[#72B8A5]'
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
