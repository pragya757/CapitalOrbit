'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedButton } from '@/components/auth/animated-button'
import { useSavings } from '@/components/savings/savings-provider'
import type { SavingsGoal } from '@/lib/actions/savings'

interface UpdateProgressDialogProps {
  goal: SavingsGoal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateProgressDialog({ goal, open, onOpenChange }: UpdateProgressDialogProps) {
  const { addProgress } = useSavings()
  const [amountToAdd, setAmountToAdd] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal || !amountToAdd) return

    await addProgress(goal.id, parseFloat(amountToAdd))

    setAmountToAdd('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) setAmountToAdd('')
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Savings — {goal?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="progress-amount">Amount to Contribute</Label>
            <Input
              id="progress-amount"
              type="number"
              placeholder="0.00"
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(e.target.value)}
              step="0.01"
              required
            />
          </div>
          
          <AnimatedButton type="submit" className="w-full">
            Update Progress
          </AnimatedButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
