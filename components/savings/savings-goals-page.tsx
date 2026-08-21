'use client'

import { useEffect, useState } from 'react'
import { useSavings } from '@/components/savings/savings-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Trash2, CalendarDays } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AddGoalDialog } from './add-goal-dialog'
import { UpdateProgressDialog } from './update-progress-dialog'
import { useExpenses } from '@/components/expense-provider'
import type { SavingsGoal } from '@/lib/actions/savings'

export function SavingsGoalsPage() {
  const { goals, isLoading, isInitialized, init, removeGoal } = useSavings()
  // Piggyback off the existing provider strictly to get the configured currency symbol globally safely
  const { user } = useExpenses()
  
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  
  // Isolated data fetching initialization hook
  useEffect(() => {
    init()
  }, [init])

  if (isLoading && !isInitialized) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-md" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  const currency = user?.currency || 'INR'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-violet-500" />
            Savings Goals
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track independent savings ambitions without affecting your active budgets
          </p>
        </div>
        <AddGoalDialog />
      </div>

      {goals.length === 0 ? (
        <Card className="h-64 border-dashed border-2 flex items-center justify-center bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold mb-1">No goals active</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Set a savings ambition to chart progress toward an unbudgeted major purchase.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {goals.map((goal, i) => {
              const progressPercentage = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
              const achieved = goal.savedAmount >= goal.targetAmount

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    "h-full rounded-2xl border bg-card/60 backdrop-blur transition-all",
                    achieved && "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold line-clamp-1">{goal.name}</CardTitle>
                          {goal.deadline && (
                            <CardDescription className="flex items-center gap-1 mt-1 text-xs font-medium">
                              <CalendarDays className="h-3 w-3" />
                              Deadline: {new Date(goal.deadline).toLocaleDateString()}
                            </CardDescription>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold">Saved</p>
                          <p className="text-2xl font-black text-foreground">
                            {formatCurrency(goal.savedAmount, currency)}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold">Target</p>
                          <p className="text-md font-bold text-muted-foreground">
                            {formatCurrency(goal.targetAmount, currency)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={achieved ? "text-emerald-500" : "text-violet-500"}>
                            {progressPercentage.toFixed(1)}%
                          </span>
                          {achieved && <span className="text-emerald-500">Goal Achieved! 🎉</span>}
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1, type: "spring" }}
                            className={cn(
                              "h-full rounded-full transition-colors duration-500 shadow-sm",
                              achieved ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-pink-500"
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        variant="secondary"
                        className="w-full mt-2 font-bold bg-foreground/5 hover:bg-foreground/10"
                        onClick={() => setSelectedGoal(goal)}
                        disabled={achieved}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Savings
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Progress Update Dialog linked centrally to reduce duplicate modals */}
      <UpdateProgressDialog 
        goal={selectedGoal} 
        open={!!selectedGoal} 
        onOpenChange={(open) => !open && setSelectedGoal(null)} 
      />
    </div>
  )
}
