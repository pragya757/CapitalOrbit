'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenses } from '@/components/expense-provider'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  X,
  CreditCard,
  Trash2,
  RefreshCw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addMonths, subMonths } from 'date-fns'
import { formatCurrency } from '@/lib/format'
import {
  generateMonthlyCalendarDays,
  DailyExpenseSummary,
  SpendingIntensity,
} from '@/lib/services/expense-calendar'
import { getCategoryIcon, getCategoryLabel, PAYMENT_ICONS } from '@/lib/constants'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ExpenseCalendarViewProps {
  searchQuery?: string
  initialCategoryFilter?: string
  initialPaymentFilter?: string
}

export function ExpenseCalendarView({
  searchQuery = '',
  initialCategoryFilter = 'all',
  initialPaymentFilter = 'all',
}: ExpenseCalendarViewProps) {
  const { expenses, deleteExpense, user, categories } = useExpenses()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Internal Filters
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter)
  const [paymentFilter, setPaymentFilter] = useState<string>(initialPaymentFilter)
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  // Date Detail Selection
  const [selectedDay, setSelectedDay] = useState<DailyExpenseSummary | null>(null)

  const currencySymbol = user?.currency || 'INR'

  const {
    days,
    averageDailySpending,
    monthTotalSpent,
    monthTotalIncome,
    monthNetCashFlow,
    totalMonthTransactions,
    activeDaysCount,
  } = generateMonthlyCalendarDays({
    currentDate,
    expenses,
    categoryFilter,
    paymentFilter,
    sourceFilter,
    searchQuery,
  })

  const hasActiveFilters =
    categoryFilter !== 'all' || paymentFilter !== 'all' || sourceFilter !== 'all' || searchQuery !== ''

  const clearFilters = () => {
    setCategoryFilter('all')
    setPaymentFilter('all')
    setSourceFilter('all')
  }

  const getIntensityBadgeStyle = (intensity: SpendingIntensity) => {
    switch (intensity) {
      case 'LOW':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
      case 'NORMAL':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
      case 'HIGH':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      case 'VERY_HIGH':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
      default:
        return 'bg-transparent text-muted-foreground border-transparent'
    }
  }

  const getCellBgStyle = (day: DailyExpenseSummary) => {
    if (!day.isCurrentMonth) {
      return 'bg-slate-50/40 dark:bg-slate-900/20 text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-800/50'
    }

    switch (day.intensity) {
      case 'LOW':
        return 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
      case 'NORMAL':
        return 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-100'
      case 'HIGH':
        return 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
      case 'VERY_HIGH':
        return 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-100'
      default:
        return 'bg-white/80 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40 text-purple-950 dark:text-purple-100'
    }
  }

  return (
    <Card className="border-purple-300 dark:border-purple-800/60 bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] dark:from-[#1C1426] dark:to-[#120B1A] rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-purple-200 dark:border-purple-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-sm">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                Expense Calendar 📅
              </CardTitle>
              <CardDescription className="text-xs text-purple-700 dark:text-purple-300">
                Visual day-by-day transaction breakdown and intensity indicators
              </CardDescription>
            </div>
          </div>

          {/* Month Navigation & Today */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="h-8 px-3 text-xs font-bold border-purple-300 dark:border-purple-700 bg-white/80 dark:bg-purple-950/80 text-purple-950 dark:text-purple-100"
            >
              Today
            </Button>
            <div className="flex items-center rounded-lg border border-purple-300 dark:border-purple-700 bg-white/80 dark:bg-purple-950/80 p-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="h-7 w-7 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-xs font-bold font-serif text-purple-950 dark:text-purple-100 min-w-[110px] text-center font-mono">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="h-7 w-7 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Controls & Legend */}
        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between border-t border-purple-200/60 dark:border-purple-900/40 mt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-[130px] bg-white/80 dark:bg-[#120B1A] border-purple-200 dark:border-purple-900 text-xs font-bold">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {getCategoryLabel(c.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-8 w-[120px] bg-white/80 dark:bg-[#120B1A] border-purple-200 dark:border-purple-900 text-xs font-bold">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-[120px] bg-white/80 dark:bg-[#120B1A] border-purple-200 dark:border-purple-900 text-xs font-bold">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1 px-2.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900 dark:text-purple-200 bg-white/60 dark:bg-purple-950/40 p-1.5 rounded-lg border border-purple-200/60">
            <span className="text-[9px] uppercase tracking-wider text-purple-700 dark:text-purple-400 mr-1">Intensity:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Low</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">Normal</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">High</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">Very High</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Month Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#120B1A]/80 border border-purple-200 dark:border-purple-900/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Monthly Spending</span>
            <div className="text-lg font-serif font-extrabold text-purple-950 dark:text-purple-100 font-mono">
              {formatCurrency(monthTotalSpent, currencySymbol)}
            </div>
            <span className="text-[10px] text-purple-700 dark:text-purple-300">{totalMonthTransactions} transactions recorded</span>
          </div>

          {monthTotalIncome > 0 && (
            <div className="p-3 rounded-xl bg-white/80 dark:bg-[#120B1A]/80 border border-purple-200 dark:border-purple-900/60 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Monthly Income</span>
              <div className="text-lg font-serif font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +{formatCurrency(monthTotalIncome, currencySymbol)}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300">Recorded deposits</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#120B1A]/80 border border-purple-200 dark:border-purple-900/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Active Days</span>
            <div className="text-lg font-serif font-bold text-purple-950 dark:text-purple-100 font-mono">
              {activeDaysCount} Days
            </div>
            <span className="text-[10px] text-purple-700 dark:text-purple-300">With recorded purchases</span>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-[#120B1A]/80 border border-purple-200 dark:border-purple-900/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Avg. Daily Spend</span>
            <div className="text-lg font-serif font-bold text-purple-950 dark:text-purple-100 font-mono">
              {formatCurrency(averageDailySpending, currencySymbol)}
            </div>
            <span className="text-[10px] text-purple-700 dark:text-purple-300">Per active spending day</span>
          </div>
        </div>

        {/* Empty Month State */}
        {totalMonthTransactions === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-[#120B1A]/60 border border-purple-200 dark:border-purple-900/40 my-4 space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="font-bold text-sm text-purple-950 dark:text-purple-100">No transactions recorded this month.</p>
            <p className="text-xs text-purple-700 dark:text-purple-300 max-w-sm mx-auto">
              {hasActiveFilters ? 'Try adjusting your category, payment, or source filters.' : 'Add your first expense or sync Razorpay transactions.'}
            </p>
          </div>
        ) : (
          /* Calendar Month Grid */
          <div className="space-y-1">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-purple-800 dark:text-purple-300 py-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {days.map((day) => {
                const cellBg = getCellBgStyle(day)
                return (
                  <div
                    key={day.dateKey}
                    onClick={() => day.transactionCount > 0 && setSelectedDay(day)}
                    className={cn(
                      'min-h-[72px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between select-none relative group',
                      cellBg,
                      day.transactionCount > 0 ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : 'cursor-default opacity-80',
                      day.isToday && 'ring-2 ring-purple-600 dark:ring-purple-400 font-bold'
                    )}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full font-mono',
                          day.isToday ? 'bg-purple-600 text-white' : day.isCurrentMonth ? 'text-purple-950 dark:text-purple-100' : 'text-slate-400'
                        )}
                      >
                        {day.dayOfMonth}
                      </span>

                      {day.isCurrentMonth && day.transactionCount > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/90 dark:bg-purple-950/90 text-purple-950 dark:text-purple-100 border border-purple-200 dark:border-purple-800">
                          {day.transactionCount} tx{day.transactionCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Middle / Bottom Row: Totals */}
                    {day.transactionCount > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <div className="text-xs sm:text-sm font-serif font-extrabold text-purple-950 dark:text-purple-100 font-mono truncate">
                          {formatCurrency(day.totalSpent, currencySymbol)}
                        </div>
                        {day.totalIncome > 0 && (
                          <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate">
                            +{formatCurrency(day.totalIncome, currencySymbol)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Date Transaction Inspection Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 border-purple-300 dark:border-purple-800 bg-white dark:bg-[#120B1A]">
          {selectedDay && (
            <div className="space-y-4 text-xs">
              <DialogHeader className="pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-serif font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-purple-600" />
                    {format(selectedDay.date, 'EEEE, d MMMM yyyy')}
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-bold border-purple-300 dark:border-purple-700">
                    {selectedDay.transactionCount} {selectedDay.transactionCount === 1 ? 'Transaction' : 'Transactions'}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Day Total Summary */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                <span className="font-bold text-purple-950 dark:text-purple-100 text-xs">Daily Total Spent:</span>
                <span className="text-base font-serif font-extrabold text-purple-950 dark:text-purple-100 font-mono">
                  {formatCurrency(selectedDay.totalSpent, currencySymbol)}
                </span>
              </div>

              {/* Day Transactions List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedDay.expenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category)
                  const PaymentIcon = (PAYMENT_ICONS as Record<string, any>)[expense.paymentMethod] || PAYMENT_ICONS.cash

                  return (
                    <div
                      key={expense.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C1426] border border-purple-100 dark:border-purple-900/40 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-sm">
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-purple-950 dark:text-purple-100 text-xs truncate">
                              {expense.merchantName && expense.merchantName !== 'Unknown Merchant'
                                ? expense.merchantName
                                : expense.description}
                            </p>
                            {expense.source === 'razorpay' && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 text-[9px] font-bold border border-blue-300">
                                Razorpay
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-purple-700 dark:text-purple-300 mt-0.5">
                            <span>{getCategoryLabel(expense.category)}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <PaymentIcon className="h-3 w-3 text-purple-600" />
                              <span className="capitalize">{expense.paymentMethod}</span>
                            </div>
                            <span>•</span>
                            <span>{format(new Date(expense.date), 'HH:mm')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-purple-950 dark:text-purple-100 font-mono">
                          {formatCurrency(expense.amount, currencySymbol)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:bg-rose-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            deleteExpense(expense.id)
                            setSelectedDay({
                              ...selectedDay,
                              transactionCount: selectedDay.transactionCount - 1,
                              totalSpent: selectedDay.totalSpent - expense.amount,
                              expenses: selectedDay.expenses.filter((e) => e.id !== expense.id),
                            })
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
