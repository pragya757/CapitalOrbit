'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Switch } from '@/components/ui/switch'
import { useExpenses } from '@/components/expense-provider'
import { formatCurrency } from '@/lib/format'
import type { RecurringFrequency } from '@/lib/types'
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trash2,
  Briefcase,
  Gift,
  Laptop,
  Wallet,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const SOURCE_ICONS: Record<string, typeof Briefcase> = {
  salary: Briefcase,
  freelance: Laptop,
  gift: Gift,
  investment: TrendingUp,
  allowance: Wallet,
  other: MoreHorizontal,
}

export default function IncomePage() {
  const { incomes, addIncome, deleteIncome, getTotalIncome, getTotalSpent, user } = useExpenses()
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('salary')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly')

  const monthlyIncome = getTotalIncome('month')
  const monthlyExpense = getTotalSpent('month')
  const netSavings = monthlyIncome - monthlyExpense
  const totalIncome = getTotalIncome('all')

  const handleAddIncome = () => {
    if (!amount || !source) return
    addIncome({
      amount: parseFloat(amount),
      source,
      description: description || undefined,
      date,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
    })
    setAmount('')
    setSource('salary')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setIsRecurring(false)
    setIsAddingIncome(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Income</h2>
          <p className="text-sm text-muted-foreground">
            Track your earnings and savings
          </p>
        </div>
        <Dialog open={isAddingIncome} onOpenChange={setIsAddingIncome}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Income</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount ({user.currency})</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold h-14"
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="allowance">Allowance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="Additional details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="income-recurring">Recurring Income</Label>
                  <p className="text-xs text-muted-foreground">Mark as recurring</p>
                </div>
                <Switch
                  id="income-recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>
              {isRecurring && (
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as RecurringFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAddIncome} className="w-full">
                Add Income
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Income</p>
                <p className="text-xl font-bold text-accent">{formatCurrency(monthlyIncome, user.currency)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Expenses</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(monthlyExpense, user.currency)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Net Savings</p>
                <p className={cn(
                  "text-xl font-bold",
                  netSavings >= 0 ? "text-accent" : "text-destructive"
                )}>
                  {formatCurrency(Math.abs(netSavings), user.currency)}
                  {netSavings < 0 && ' deficit'}
                </p>
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                netSavings >= 0 ? "bg-accent/10" : "bg-destructive/10"
              )}>
                <DollarSign className={cn(
                  "h-5 w-5",
                  netSavings >= 0 ? "text-accent" : "text-destructive"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income History</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No income recorded</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start by adding your first income source
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomes.map((income) => {
                const Icon = SOURCE_ICONS[income.source] || MoreHorizontal
                return (
                  <div
                    key={income.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{income.source}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {income.description && <span>{income.description}</span>}
                        {income.description && <span>·</span>}
                        <span>{format(new Date(income.date), 'MMM d, yyyy')}</span>
                        {income.isRecurring && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{income.recurringFrequency}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-accent">
                        +{formatCurrency(income.amount, user.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => deleteIncome(income.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
