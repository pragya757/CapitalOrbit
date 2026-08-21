'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryIcon, getCategoryLabel, PAYMENT_ICONS } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { RefreshCw, Trash2, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { getEmptyStateMessage } from '@/lib/microcopy'

interface RecentExpensesProps {
  limit?: number
  showAll?: boolean
}

export function RecentExpenses({ limit = 5, showAll = false }: RecentExpensesProps) {
  const { expenses, deleteExpense, user } = useExpenses()
  const displayedExpenses = showAll ? expenses : expenses.slice(0, limit)

  if (expenses.length === 0) {
    return (
      <Card className="border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4ED] text-[#E9785B] mb-3">
              <PartyPopper className="h-6 w-6" />
            </div>
            <p className="mt-2 text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Clean Slate!</p>
            <p className="mt-1 text-[11px] text-[#756E72] max-w-[200px]">
              {getEmptyStateMessage()}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Recent Transactions</CardTitle>
        {!showAll && expenses.length > limit && (
          <span className="text-[11px] font-semibold text-[#756E72] bg-[#F7F4ED] dark:bg-[#1C141C] border border-[#E4DED5] px-3 py-0.5 rounded-full">
            Showing {limit} of {expenses.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div className="space-y-2.5">
          <AnimatePresence>
            {displayedExpenses.map((expense, i) => {
              const CategoryIcon = getCategoryIcon(expense.category)
              const PaymentIcon = (PAYMENT_ICONS as Record<string, any>)[expense.paymentMethod] || PAYMENT_ICONS.cash
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3.5 rounded-xl p-3 border border-[#E4DED5]/60 bg-[#F7F4ED]/40 dark:bg-[#1C141C]/40 hover:bg-[#F7F4ED] transition-all group cursor-pointer shadow-none"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B1F3A] text-white font-bold">
                    <CategoryIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED] truncate">{expense.description}</p>
                      {expense.isRecurring && (
                        <RefreshCw className="h-3 w-3 text-[#70536F] shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#756E72]">
                      <span>{getCategoryLabel(expense.category)}</span>
                      <span className="opacity-40">•</span>
                      <div className="flex items-center gap-1 text-[#3B1F3A] dark:text-[#F7F4ED]">
                        <PaymentIcon className="h-3 w-3" />
                        <span className="capitalize">{expense.paymentMethod}</span>
                      </div>
                      <span className="opacity-40">•</span>
                      <span>{formatDistanceToNow(new Date(expense.date), { addSuffix: true })}</span>
                      {expense.source === 'razorpay' && (
                        <span className="inline-flex items-center rounded-full bg-[#72B8A5]/20 text-[#72B8A5] px-1.5 py-0.5 text-[9px] font-bold">
                          Razorpay
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pr-1">
                    <span className="text-sm font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                      {formatCurrency(expense.amount, user.currency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#E9785B] hover:bg-[#E9785B]/10 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteExpense(expense.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete expense</span>
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
