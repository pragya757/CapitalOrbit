'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { SavingsGoal } from '@/lib/actions/savings'
import {
  fetchSavingsGoals,
  createSavingsGoal as _create,
  updateSavingsProgress as _updateProgress,
  deleteSavingsGoal as _delete,
} from '@/lib/actions/savings'
import { toast } from 'sonner'

interface SavingsContextType {
  goals: SavingsGoal[]
  isLoading: boolean
  isInitialized: boolean
  init: () => Promise<void>
  addGoal: (goal: { name: string; targetAmount: number; deadline?: string | null }) => Promise<void>
  addProgress: (id: string, amount: number) => Promise<void>
  removeGoal: (id: string) => Promise<void>
}

const SavingsContext = createContext<SavingsContextType | null>(null)

export function SavingsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const init = useCallback(async () => {
    if (isInitialized) return
    setIsLoading(true)
    try {
      const data = await fetchSavingsGoals()
      setGoals(data)
      setIsInitialized(true)
    } catch (e) {
      console.error('Failed to init savings goals', e)
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  const addGoal = async (goal: { name: string; targetAmount: number; deadline?: string | null }) => {
    try {
      const newGoal = await _create(goal)
      setGoals((prev) => [newGoal, ...prev])
      toast.success('Savings goal created!')
    } catch (err: any) {
      toast.error('Failed to create goal', { description: err.message })
    }
  }

  const addProgress = async (id: string, amountToAdd: number) => {
    try {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, savedAmount: g.savedAmount + amountToAdd } : g
        )
      )
      await _updateProgress(id, amountToAdd)
      toast.success('Progress updated!')
    } catch (err: any) {
      init() // revert optimism
      toast.error('Failed to update progress', { description: err.message })
    }
  }

  const removeGoal = async (id: string) => {
    try {
      setGoals((prev) => prev.filter((g) => g.id !== id))
      await _delete(id)
      toast.success('Goal removed')
    } catch (err: any) {
      init() // revert optimism
      toast.error('Failed to delete goal', { description: err.message })
    }
  }

  return (
    <SavingsContext.Provider
      value={{ goals, isLoading, isInitialized, init, addGoal, addProgress, removeGoal }}
    >
      {children}
    </SavingsContext.Provider>
  )
}

export function useSavings() {
  const context = useContext(SavingsContext)
  if (!context) {
    throw new Error('useSavings must be used within a SavingsProvider')
  }
  return context
}
