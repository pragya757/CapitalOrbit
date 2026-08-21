'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Expense, Budget, User, Income, ExpenseCategory, RecurringRule, CategoryItem, PaymentMethod } from '@/lib/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import {
  fetchUserData,
  syncExpense,
  syncBudget,
  syncIncome,
  syncRecurringRule,
  syncUserProfile,
  syncCategory as syncCategoryAction,
  deleteCategory as deleteCategoryAction,
} from '@/lib/actions/data'

// Helper to reliably format a local JS Date to YYYY-MM-DD for comparisons
const toDateStr = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function useExpenseStore() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [user, setUser] = useState<User>({
    id: '1',
    name: '',
    email: '',
    monthlyBudget: 15000,
    currency: 'INR',
  })
  const [incomes, setIncomes] = useState<Income[]>([])
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>(
    DEFAULT_CATEGORIES.map((name) => ({ id: name, name, isCustom: false }))
  )
  const [isLoading, setIsLoading] = useState(true)

  // Calculate spent amounts for budgets
  const calculateBudgetSpent = useCallback((expenseList: Expense[], budgetList: Budget[]): Budget[] => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())

    const monthStr = toDateStr(startOfMonth)
    const weekStr = toDateStr(startOfWeek)

    return budgetList.map((budget) => {
      const relevantExpenses = expenseList.filter((expense) => {
        const isFailedOrRefunded = expense.status === 'failed' || expense.status === 'refunded'
        if (isFailedOrRefunded) return false
        const isInPeriod =
          budget.period === 'monthly' ? expense.date >= monthStr : expense.date >= weekStr
        return expense.category.toLowerCase() === budget.category.toLowerCase() && isInPeriod
      })
      const spent = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      return { ...budget, spent }
    })
  }, [])

  // Process recurring rules — auto-create expenses/incomes for due rules
  const processRecurringRules = useCallback(
    (rules: RecurringRule[]) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let rulesUpdated = false
      const newLocalExpenses: Expense[] = []
      const newLocalIncomes: Income[] = []

      const updatedRules = rules.map((rule) => {
        if (!rule.isActive) return rule

        const nextDate = new Date(rule.nextDate)
        nextDate.setHours(0, 0, 0, 0)

        if (nextDate > today) return rule

        // Create the transaction
        if (rule.type === 'expense' && rule.category && rule.paymentMethod) {
          const newExpense: Expense = {
            id: crypto.randomUUID(),
            amount: rule.amount,
            category: rule.category as ExpenseCategory,
            description: `${rule.description} (recurring)`,
            date: rule.nextDate,
            paymentMethod: rule.paymentMethod as any,
            isRecurring: true,
            recurringFrequency: rule.frequency as any,
          }
          newLocalExpenses.push(newExpense)
          syncExpense(newExpense)
        } else if (rule.type === 'income') {
          const newIncome: Income = {
            id: crypto.randomUUID(),
            amount: rule.amount,
            source: rule.source || 'Recurring',
            description: `${rule.description} (recurring)`,
            date: rule.nextDate,
            isRecurring: true,
            recurringFrequency: rule.frequency as any,
          }
          newLocalIncomes.push(newIncome)
          syncIncome(newIncome)
        }

        // Advance the next date
        const next = new Date(rule.nextDate)
        switch (rule.frequency) {
          case 'daily':
            next.setDate(next.getDate() + 1)
            break
          case 'weekly':
            next.setDate(next.getDate() + 7)
            break
          case 'monthly':
            next.setMonth(next.getMonth() + 1)
            break
        }

        const updatedRule = { ...rule, nextDate: next.toISOString().split('T')[0] }
        syncRecurringRule(updatedRule)
        rulesUpdated = true
        return updatedRule
      })

      if (rulesUpdated) {
        setRecurringRules(updatedRules)
      }
      if (newLocalExpenses.length > 0) {
        setExpenses((prev) => [...newLocalExpenses, ...prev])
      }
      if (newLocalIncomes.length > 0) {
        setIncomes((prev) => [...newLocalIncomes, ...prev])
      }
    },
    []
  )

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchUserData()
      if (data) {
        setUser(data.user)
        setExpenses(data.expenses)
        setBudgets(calculateBudgetSpent(data.expenses, data.budgets))
        setIncomes(data.incomes)
        setRecurringRules(data.recurringRules)
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories)
        }
      }
    } catch (err) {
      console.error('Failed to refresh user data', err)
    }
  }, [calculateBudgetSpent])

  // Load data from DB on mount
  useEffect(() => {
    refreshData().then(() => setIsLoading(false))
  }, [refreshData])

  // Recalculate budgets when expenses or budgets change
  useEffect(() => {
    if (isLoading) return
    setBudgets((currentBudgets) => calculateBudgetSpent(expenses, currentBudgets))
  }, [expenses, calculateBudgetSpent, isLoading])

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0)



  // Add expense
  const addExpense = useCallback(
    (expense: Omit<Expense, 'id'>) => {
      const newExpense: Expense = {
        ...expense,
        id: crypto.randomUUID(),
      }
      setExpenses((prev) => [newExpense, ...prev])
      syncExpense(newExpense) // Background sync

      // Create recurring rule if marked as recurring
      if (expense.isRecurring && expense.recurringFrequency) {
        const nextDate = new Date(expense.date)
        switch (expense.recurringFrequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1)
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7)
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1)
            break
        }
        const rule: RecurringRule = {
          id: crypto.randomUUID(),
          type: 'expense',
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          paymentMethod: expense.paymentMethod as PaymentMethod,
          frequency: expense.recurringFrequency,
          nextDate: nextDate.toISOString().split('T')[0],
          isActive: true,
        }
        setRecurringRules((prev) => [...prev, rule])
        syncRecurringRule(rule) // Background sync
      }
      return newExpense
    },
    []
  )

  // Update expense
  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => {
      const updated = prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
      const modified = updated.find((e) => e.id === id)
      if (modified) {
        queueMicrotask(() => syncExpense(modified))
      }
      return updated
    })
  }, [])

  // Delete expense
  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const expenseToDelete = prev.find((e) => e.id === id)
      if (expenseToDelete) {
        queueMicrotask(() => syncExpense(expenseToDelete, true))
      }
      return prev.filter((exp) => exp.id !== id)
    })
  }, [])

  // Update budget
  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
      const modified = updated.find((b) => b.id === id)
      if (modified) {
        queueMicrotask(() => syncBudget(modified))
      }
      return updated
    })
  }, [])

  // Add budget
  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      spent: 0,
    }
    setBudgets((prev) => [...prev, newBudget])
    syncBudget(newBudget)
  }, [])

  // Update user
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      queueMicrotask(() => {
        syncUserProfile({ name: updated.name, currency: updated.currency, monthlyBudget: updated.monthlyBudget })
      })
      return updated
    })
  }, [])

  // Add income
  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
    }
    setIncomes((prev) => [newIncome, ...prev])
    syncIncome(newIncome)

    // Create recurring rule if marked as recurring
    if (income.isRecurring && income.recurringFrequency) {
      const nextDate = new Date(income.date)
      switch (income.recurringFrequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1)
          break
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
      }
      const rule: RecurringRule = {
        id: crypto.randomUUID(),
        type: 'income',
        amount: income.amount,
        source: income.source,
        description: income.description || income.source,
        frequency: income.recurringFrequency,
        nextDate: nextDate.toISOString().split('T')[0],
        isActive: true,
      }
      setRecurringRules((prev) => [...prev, rule])
      syncRecurringRule(rule)
    }

    return newIncome
  }, [])

  // Delete income
  const deleteIncome = useCallback((id: string) => {
    setIncomes((prev) => {
      const incomeToDelete = prev.find((i) => i.id === id)
      if (incomeToDelete) {
        queueMicrotask(() => syncIncome(incomeToDelete, true))
      }
      return prev.filter((inc) => inc.id !== id)
    })
  }, [])

  // ──────────────────────────────────────────────────
  // Category management
  // ──────────────────────────────────────────────────

  const addCategory = useCallback((name: string) => {
    const normalized = name.toLowerCase().trim()
    if (!normalized) return null

    // Check if already exists
    if (categories.some((c) => c.name === normalized)) return null

    const newCategory: CategoryItem = {
      id: crypto.randomUUID(),
      name: normalized,
      isCustom: true,
    }
    setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
    syncCategoryAction(newCategory)
    return newCategory
  }, [categories])

  const removeCategory = useCallback((name: string) => {
    // Prevent deleting default categories
    if ((DEFAULT_CATEGORIES as string[]).includes(name)) return false

    setCategories((prev) => prev.filter((c) => c.name !== name))
    deleteCategoryAction(name)
    return true
  }, [])

  // Get expenses for a specific period
  const getExpensesByPeriod = useCallback(
    (period: 'today' | 'week' | 'month' | 'all') => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const dayStr = toDateStr(startOfDay)
      const weekStr = toDateStr(startOfWeek)
      const monthStr = toDateStr(startOfMonth)

      return expenses.filter((expense) => {
        switch (period) {
          case 'today':
            return expense.date === dayStr
          case 'week':
            return expense.date >= weekStr
          case 'month':
            return expense.date >= monthStr
          default:
            return true
        }
      })
    },
    [expenses]
  )

  // Get total spent
  const getTotalSpent = useCallback(
    (period: 'today' | 'week' | 'month' | 'all') => {
      return getExpensesByPeriod(period).reduce((sum, exp) => sum + exp.amount, 0)
    },
    [getExpensesByPeriod]
  )

  // Get total income for a period
  const getTotalIncome = useCallback(
    (period: 'today' | 'week' | 'month' | 'all') => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const dayStr = toDateStr(startOfDay)
      const weekStr = toDateStr(startOfWeek)
      const monthStr = toDateStr(startOfMonth)

      return incomes
        .filter((income) => {
          switch (period) {
            case 'today':
              return income.date === dayStr
            case 'week':
              return income.date >= weekStr
            case 'month':
              return income.date >= monthStr
            default:
              return true
          }
        })
        .reduce((sum, inc) => sum + inc.amount, 0)
    },
    [incomes]
  )

  // Get spending by category
  const getSpendingByCategory = useCallback(
    (period: 'today' | 'week' | 'month' | 'all') => {
      const periodExpenses = getExpensesByPeriod(period)
      const categoryMap: Record<string, number> = {}

      // Initialize with all known category names
      categories.forEach((cat) => {
        categoryMap[cat.name] = 0
      })

      periodExpenses.forEach((exp) => {
        const cat = exp.category.toLowerCase()
        if (categoryMap[cat] !== undefined) {
          categoryMap[cat] += exp.amount
        } else {
          // Unknown category — still collect
          categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount
        }
      })

      return Object.entries(categoryMap)
        .filter(([, amount]) => amount > 0)
        .map(([category, amount]) => ({ category: category as ExpenseCategory, amount }))
        .sort((a, b) => b.amount - a.amount)
    },
    [getExpensesByPeriod, categories]
  )

  // Export/Import stubs (kept local for the file exports instead of syncing immediately, syncing would happen on add)
  const exportToCSV = useCallback(() => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Recurring']
    const rows = expenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      exp.description,
      exp.category,
      exp.amount.toString(),
      exp.paymentMethod,
      exp.isRecurring ? 'Yes' : 'No',
    ])
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [expenses])

  const importFromCSV = useCallback(
    (csvText: string) => {
      const lines = csvText.trim().split('\n')
      if (lines.length < 2) return 0 // No data rows

      const imported: Expense[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim())
        if (cols.length < 4) continue
        const newExpense: Expense = {
          id: crypto.randomUUID(),
          date: new Date(cols[0]).toISOString().split('T')[0],
          description: cols[1] || 'Imported',
          category: (cols[2] as ExpenseCategory) || 'other',
          amount: parseFloat(cols[3]) || 0,
          paymentMethod: (cols[4] as any) || 'cash',
          isRecurring: cols[5]?.toLowerCase() === 'yes',
        }
        imported.push(newExpense)
        syncExpense(newExpense)
      }

      if (imported.length > 0) {
        setExpenses((prev) => [...imported, ...prev])
      }
      return imported.length
    },
    []
  )

  const exportToJSON = useCallback(() => {
    const data = { expenses, incomes, budgets, user, recurringRules }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spendwise_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [expenses, incomes, budgets, user, recurringRules])

  const importFromJSON = useCallback((jsonText: string) => {
    try {
      const data = JSON.parse(jsonText)
      if (data.expenses) {
        setExpenses(data.expenses)
        data.expenses.forEach((e: Expense) => syncExpense(e))
      }
      if (data.incomes) {
        setIncomes(data.incomes)
        data.incomes.forEach((i: Income) => syncIncome(i))
      }
      if (data.budgets) {
        setBudgets(data.budgets)
        data.budgets.forEach((b: Budget) => syncBudget(b))
      }
      if (data.recurringRules) {
        setRecurringRules(data.recurringRules)
        data.recurringRules.forEach((r: RecurringRule) => syncRecurringRule(r))
      }
      return true
    } catch {
      console.error('Failed to import JSON data')
      return false
    }
  }, [])

  return {
    expenses,
    budgets,
    totalBudgeted,
    user,
    incomes,
    recurringRules,
    categories,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudget,
    addBudget,
    updateUser,
    addIncome,
    deleteIncome,
    addCategory,
    removeCategory,
    getExpensesByPeriod,
    getTotalSpent,
    getTotalIncome,
    getSpendingByCategory,
    exportToCSV,
    importFromCSV,
    exportToJSON,
    importFromJSON,
    refreshData,
  }
}
