'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useExpenseStore } from '@/hooks/use-expense-store'

type ExpenseContextType = ReturnType<typeof useExpenseStore>

const ExpenseContext = createContext<ExpenseContextType | null>(null)

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const store = useExpenseStore()
  return (
    <ExpenseContext.Provider value={store}>
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpenses() {
  const context = useContext(ExpenseContext)
  if (!context) {
    throw new Error('useExpenses must be used within ExpenseProvider')
  }
  return context
}
