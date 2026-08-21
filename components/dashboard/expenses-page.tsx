'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenses } from '@/components/expense-provider'
import {
  getCategoryIcon,
  getCategoryLabel,
  getCategoryIconColor,
  PAYMENT_ICONS,
} from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import type { PaymentMethod } from '@/lib/types'
import {
  Search,
  Filter,
  RefreshCw,
  Trash2,
  LayoutList,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AddExpenseDialog } from './add-expense-dialog'
import { recordUserCategoryCorrection } from '@/lib/actions/categorize'
import { toast } from 'sonner'

type ViewMode = 'list' | 'grouped'

export function ExpensesPage() {
  const { expenses, deleteExpense, user, categories, refreshData, updateExpense } = useExpenses()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleCategoryCorrection = async (expenseId: string, newCategory: string) => {
    updateExpense(expenseId, {
      category: newCategory,
      categorySource: 'manual',
      categoryConfidence: 1.0,
      categoryReason: 'User manual category selection',
    })
    const res = await recordUserCategoryCorrection(expenseId, newCategory)
    if (res.success) {
      toast.success(`Category updated & learned preference saved for future transactions!`)
      refreshData()
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
      const matchesPayment = paymentFilter === 'all' || expense.paymentMethod === paymentFilter

      let matchesDate = true
      if (dateFilter !== 'all') {
        const expenseDate = new Date(expense.date)
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        switch (dateFilter) {
          case 'today':
            matchesDate = expenseDate >= startOfDay
            break
          case 'week':
            matchesDate = expenseDate >= startOfWeek
            break
          case 'month':
            matchesDate = expenseDate >= startOfMonth
            break
        }
      }

      return matchesSearch && matchesCategory && matchesPayment && matchesDate
    })
  }, [expenses, search, categoryFilter, paymentFilter, dateFilter])

  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Group expenses by category
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof filteredExpenses> = {}
    for (const expense of filteredExpenses) {
      const cat = expense.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(expense)
    }
    // Sort groups by total descending
    return Object.entries(groups).sort(
      (a, b) =>
        b[1].reduce((s, e) => s + e.amount, 0) - a[1].reduce((s, e) => s + e.amount, 0)
    )
  }, [filteredExpenses])

  // All category filter options = all known categories
  const allCategoryNames = categories.map((c) => c.name)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-sm text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <AddExpenseDialog />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategoryNames.map((name) => (
                    <SelectItem key={name} value={name}>{getCategoryLabel(name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[130px]">
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

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex items-center rounded-lg border p-0.5">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grouped')}
                  title="Grouped by category"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No expenses found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {expenses.length === 0
                  ? 'Start by adding your first expense'
                  : 'Try adjusting your filters'
                }
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Showing {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold">
                  Total: {formatCurrency(totalFiltered, user.currency)}
                </span>
              </div>
              <div className="space-y-2">
                {filteredExpenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category)
                  const PaymentIcon = (PAYMENT_ICONS as Record<string, any>)[expense.paymentMethod] || PAYMENT_ICONS.cash
                  const confidence = expense.categoryConfidence ? Math.round(expense.categoryConfidence * 100) : null
                  const confidenceTier = confidence !== null ? (confidence >= 85 ? 'high' : confidence >= 60 ? 'medium' : 'low') : null

                  return (
                    <div
                      key={expense.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', getCategoryIconColor(expense.category))}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold truncate">{expense.description}</p>
                            {expense.merchantName && expense.merchantName !== 'Unknown Merchant' && expense.merchantName !== expense.description && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                                {expense.merchantName}
                              </span>
                            )}
                            {expense.isRecurring && (
                              <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {/* Inline category editor / label */}
                            <Select
                              value={expense.category}
                              onValueChange={(newCat) => handleCategoryCorrection(expense.id, newCat)}
                            >
                              <SelectTrigger className="h-6 px-1.5 py-0 text-xs border-dashed border-muted-foreground/30 hover:border-primary">
                                <SelectValue>{getCategoryLabel(expense.category)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c.id} value={c.name}>
                                    {getCategoryLabel(c.name)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <span>·</span>
                            <div className="flex items-center gap-1">
                              <PaymentIcon className="h-3 w-3" />
                              <span className="capitalize">{expense.paymentMethod}</span>
                            </div>
                            <span>·</span>
                            <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>

                            {expense.source === 'razorpay' && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-400/20">
                                Razorpay
                              </span>
                            )}

                            {/* Confidence badge */}
                            {confidenceTier === 'high' && (
                              <span
                                className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300"
                                title={expense.categoryReason || 'High confidence category match'}
                              >
                                {confidence}% confidence
                              </span>
                            )}
                            {confidenceTier === 'medium' && (
                              <span
                                className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300"
                                title={expense.categoryReason || 'Medium confidence category match'}
                              >
                                {confidence}% confidence
                              </span>
                            )}
                            {confidenceTier === 'low' && (
                              <span
                                className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/50 dark:text-red-300"
                                title={expense.categoryReason || 'Uncertain match — Needs Review'}
                              >
                                ⚠ Needs Review
                              </span>
                            )}

                            {expense.categorySource && (
                              <span className="text-[10px] text-muted-foreground/80 capitalize">
                                ({expense.categorySource})
                              </span>
                            )}

                            {expense.status && expense.status !== 'captured' && (
                              <span className={cn(
                                "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                                expense.status === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                                expense.status === 'refunded' ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {expense.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
                        <span className="text-sm font-semibold">
                          {formatCurrency(expense.amount, user.currency)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete expense</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            /* Grouped by category view */
            <>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {groupedExpenses.length} categor{groupedExpenses.length !== 1 ? 'ies' : 'y'}
                  {' · '}
                  {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold">
                  Total: {formatCurrency(totalFiltered, user.currency)}
                </span>
              </div>
              <div className="space-y-4">
                {groupedExpenses.map(([categoryName, catExpenses]) => {
                  const CategoryIcon = getCategoryIcon(categoryName)
                  const catTotal = catExpenses.reduce((s, e) => s + e.amount, 0)
                  const percentage = totalFiltered > 0 ? (catTotal / totalFiltered) * 100 : 0

                  return (
                    <div key={categoryName} className="rounded-xl border overflow-hidden">
                      {/* Category header */}
                      <div className="flex items-center gap-3 p-3 bg-muted/30">
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', getCategoryIconColor(categoryName))}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{getCategoryLabel(categoryName)}</p>
                          <p className="text-xs text-muted-foreground">
                            {catExpenses.length} expense{catExpenses.length !== 1 ? 's' : ''}
                            {' · '}
                            {percentage.toFixed(1)}% of total
                          </p>
                        </div>
                        <span className="text-sm font-bold">
                          {formatCurrency(catTotal, user.currency)}
                        </span>
                      </div>

                      {/* Category expenses */}
                      <div className="divide-y">
                        {catExpenses.map((expense) => {
                          const PaymentIcon = (PAYMENT_ICONS as Record<string, any>)[expense.paymentMethod] || PAYMENT_ICONS.cash
                          return (
                            <div
                              key={expense.id}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">{expense.description}</p>
                                  {expense.isRecurring && (
                                    <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <PaymentIcon className="h-3 w-3" />
                                    <span className="capitalize">{expense.paymentMethod}</span>
                                  </div>
                                  <span>·</span>
                                  <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                                  {expense.source === 'razorpay' && (
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-400/20">
                                      Razorpay
                                    </span>
                                  )}
                                  {expense.status && expense.status !== 'captured' && (
                                    <span className={cn(
                                      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                                      expense.status === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                                      expense.status === 'refunded' ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                                      "bg-muted text-muted-foreground"
                                    )}>
                                      {expense.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {formatCurrency(expense.amount, user.currency)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  onClick={() => deleteExpense(expense.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete expense</span>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
