'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryIcon, getCategoryLabel, getCategoryColor, DEFAULT_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import type { ExpenseCategory, Budget } from '@/lib/types'
import {
  Plus,
  Edit2,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryManager } from './category-manager'

export function BudgetsPage() {
  const { budgets, user, updateBudget, addBudget, updateUser, totalBudgeted, categories } = useExpenses()
  const [isAddingBudget, setIsAddingBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [newBudgetCategory, setNewBudgetCategory] = useState<ExpenseCategory>('food')
  const [newBudgetLimit, setNewBudgetLimit] = useState('')
  const [newBudgetPeriod, setNewBudgetPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [monthlyBudget, setMonthlyBudget] = useState(user.monthlyBudget.toString())
  const [isEditingMonthly, setIsEditingMonthly] = useState(false)

  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const remainingGlobal = user.monthlyBudget - totalSpent

  const existingCategories = budgets.map(b => b.category)
  const availableCategories = categories
    .map((c) => c.name)
    .filter(cat => !existingCategories.includes(cat))

  const validateBudget = (newLimit: number, category: ExpenseCategory, budgetId?: string) => {
    const otherBudgetsTotal = budgets
      .filter(b => b.id !== budgetId)
      .reduce((sum, b) => sum + b.limit, 0)
    
    return (otherBudgetsTotal + newLimit) <= user.monthlyBudget
  }

  const handleAddBudget = () => {
    const limit = parseFloat(newBudgetLimit)
    if (!newBudgetLimit || isNaN(limit)) return

    if (!validateBudget(limit, newBudgetCategory)) {
      toast.error('Over Allocation!', {
        description: `Total category budgets cannot exceed your monthly limit of ${formatCurrency(user.monthlyBudget, user.currency)}`
      })
      return
    }

    addBudget({
      category: newBudgetCategory,
      limit,
      period: newBudgetPeriod,
    })
    setNewBudgetLimit('')
    setNewBudgetCategory(availableCategories[0] || 'other')
    setIsAddingBudget(false)
  }

  const handleUpdateBudget = () => {
    const limit = parseFloat(newBudgetLimit)
    if (!editingBudget || !newBudgetLimit || isNaN(limit)) return

    if (!validateBudget(limit, editingBudget.category, editingBudget.id)) {
      toast.error('Over Allocation!', {
        description: `This update would exceed your monthly limit of ${formatCurrency(user.monthlyBudget, user.currency)}`
      })
      return
    }

    updateBudget(editingBudget.id, {
      limit,
      period: newBudgetPeriod,
    })
    setEditingBudget(null)
    setNewBudgetLimit('')
  }


  const handleSaveMonthlyBudget = () => {
    updateUser({ monthlyBudget: parseFloat(monthlyBudget) || 0 })
    setIsEditingMonthly(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budgets</h2>
          <p className="text-sm text-muted-foreground">
            Set and manage your spending limits
          </p>
        </div>
        {availableCategories.length > 0 && (
          <Dialog open={isAddingBudget} onOpenChange={setIsAddingBudget}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Budget</DialogTitle>
              </DialogHeader>
                <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newBudgetCategory} onValueChange={(v) => setNewBudgetCategory(v as ExpenseCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Limit ({user.currency})</Label>
                  <Input
                    type="number"
                    placeholder="Enter budget limit"
                    value={newBudgetLimit}
                    onChange={(e) => setNewBudgetLimit(e.target.value)}
                  />
                  {newBudgetLimit && !validateBudget(parseFloat(newBudgetLimit), newBudgetCategory) && (
                    <p className="text-[10px] font-bold text-red-500 animate-pulse">
                      Exceeds monthly limit! ⚠️
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={newBudgetPeriod} onValueChange={(v) => setNewBudgetPeriod(v as 'weekly' | 'monthly')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddBudget} 
                  className="w-full"
                  disabled={!newBudgetLimit || !validateBudget(parseFloat(newBudgetLimit), newBudgetCategory)}
                >
                  Add Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Overall Budget Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Overall Monthly Budget</CardTitle>
              <CardDescription>Your total spending limit for the month</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMonthly(!isEditingMonthly)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditingMonthly ? (
            <div className="flex gap-2">
              <Input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleSaveMonthlyBudget}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditingMonthly(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{formatCurrency(totalBudgeted, user.currency)}</span>
                <span className="mb-1 text-muted-foreground">/ month</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Total Budgeted</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalBudgeted, user.currency)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalSpent, user.currency)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    remainingGlobal < 0 && "text-destructive"
                  )}>
                    {formatCurrency(remainingGlobal, user.currency)}
                  </p>
                </div>
              </div>
              {totalBudgeted > user.monthlyBudget && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-red-600 dark:text-red-400 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-bold leading-tight">
                    Warning: Your category allocations ({formatCurrency(totalBudgeted, user.currency)}) exceed your monthly limit!
                  </p>
                </div>
              )}
              {totalBudgeted === user.monthlyBudget && totalBudgeted > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <TrendingDown className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-bold leading-tight">
                    100% Allocated: You have used your entire monthly limit for category budgets.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const Icon = getCategoryIcon(budget.category)
          const percentage = (budget.spent / budget.limit) * 100
          const isOverBudget = budget.spent > budget.limit
          const isNearLimit = percentage >= 80 && !isOverBudget
          const remaining = budget.limit - budget.spent

          return (
            <Card key={budget.id} className={cn(
              "relative overflow-hidden",
              isOverBudget && "border-destructive/50"
            )}>
              <div className={cn(
                "absolute top-0 left-0 h-1 w-full",
                getCategoryColor(budget.category)
              )} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      isOverBudget ? "bg-destructive/10 text-destructive" :
                      isNearLimit ? "bg-warning/10 text-warning-foreground" :
                      "bg-primary/10 text-primary"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {getCategoryLabel(budget.category)}
                      </CardTitle>
                      <CardDescription className="text-xs capitalize">
                        {budget.period}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingBudget(budget)
                      setNewBudgetLimit(budget.limit.toString())
                      setNewBudgetPeriod(budget.period)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(budget.spent, user.currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        of {formatCurrency(budget.limit, user.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      {isOverBudget ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Over by {formatCurrency(Math.abs(remaining), user.currency)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-accent">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm font-medium">{formatCurrency(remaining, user.currency)} left</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverBudget ? "bg-destructive" :
                        isNearLimit ? "bg-warning" :
                        getCategoryColor(budget.category)
                      )}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {percentage.toFixed(0)}% used
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          {editingBudget && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getCategoryIcon(editingBudget.category)
                  return <Icon className="h-5 w-5" />
                })()}
                <span className="font-medium">{getCategoryLabel(editingBudget.category)}</span>
              </div>
              <div className="space-y-2">
                <Label>New Limit ({user.currency})</Label>
                <Input
                  type="number"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                />
                {newBudgetLimit && !validateBudget(parseFloat(newBudgetLimit), editingBudget.category, editingBudget.id) && (
                  <p className="text-[10px] font-bold text-red-500 animate-pulse">
                    This update would exceed your monthly limit! ⚠️
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={newBudgetPeriod} onValueChange={(v) => setNewBudgetPeriod(v as 'weekly' | 'monthly')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleUpdateBudget} 
                className="w-full"
                disabled={!newBudgetLimit || !validateBudget(parseFloat(newBudgetLimit), editingBudget.category, editingBudget.id)}
              >
                Update Budget
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Management */}
      <CategoryManager />
    </div>
  )
}
