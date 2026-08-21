'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Database, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, Wallet, Target, Receipt } from 'lucide-react'
import { useExpenses } from '@/components/expense-provider'
import { loadDemoDataAction } from '@/lib/actions/demo-data'
import { toast } from 'sonner'

export function DemoDataButton() {
  const { refreshData } = useExpenses()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLoadDemo = async () => {
    setLoading(true)
    try {
      const res = await loadDemoDataAction()
      if (res.success) {
        toast.success('Demo profile loaded! Financial Health & Decisions updated.')
        await refreshData()
        setOpen(false)
      } else {
        const errorMsg = 'error' in res ? res.error : 'Failed to load demo profile.'
        toast.error(errorMsg)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error loading demo profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-semibold text-xs border-[#E4DED5] dark:border-[#3D2D3D] text-[#3B1F3A] dark:text-[#F7F4ED] bg-[#F7F4ED] dark:bg-[#1C141C] hover:bg-[#EAE3D7] shadow-sm">
          <Database className="h-3.5 w-3.5 text-[#3B1F3A] dark:text-[#F7F4ED]" />
          Load Demo Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
              <Sparkles className="h-4 w-4 text-[#E9785B]" />
            </div>
            <div>
              <DialogTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Load Demo Financial Profile</DialogTitle>
              <DialogDescription className="text-xs text-[#756E72]">
                Populate realistic demo income, expenses, budgets, goals, and obligations
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-xl bg-[#72B8A5]/10 p-3 text-[#3B1F3A] dark:text-[#F7F4ED] flex items-start gap-2 border border-[#72B8A5]/30">
            <ShieldCheck className="h-4 w-4 text-[#72B8A5] mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Safe & Non-Destructive</p>
              <p className="text-[11px] text-[#756E72] mt-0.5">
                Existing real Razorpay test payments and manual entries remain untouched. Running this multiple times is idempotent.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Profile Overview to Seed:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] p-2.5 bg-[#F7F4ED]/60 space-y-0.5">
                <div className="font-bold text-[#3B1F3A] flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-[#72B8A5]" /> Monthly Income
                </div>
                <div className="font-mono font-bold text-[#72B8A5]">₹50,000 / mo</div>
              </div>

              <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] p-2.5 bg-[#F7F4ED]/60 space-y-0.5">
                <div className="font-bold text-[#3B1F3A] flex items-center gap-1">
                  <Target className="h-3 w-3 text-[#3B1F3A]" /> Savings Goal
                </div>
                <div className="font-mono font-bold text-[#3B1F3A]">New Bike (₹1.2L)</div>
              </div>

              <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] p-2.5 bg-[#F7F4ED]/60 space-y-0.5">
                <div className="font-bold text-[#3B1F3A] flex items-center gap-1">
                  <Receipt className="h-3 w-3 text-[#D8A84E]" /> Expenses & Budgets
                </div>
                <div className="text-[#756E72]">Swiggy, Rent, Uber, Movies</div>
              </div>

              <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] p-2.5 bg-[#F7F4ED]/60 space-y-0.5">
                <div className="font-bold text-[#3B1F3A] flex items-center gap-1">
                  <Database className="h-3 w-3 text-[#70536F]" /> Obligations
                </div>
                <div className="font-mono text-[#756E72]">Rent, Electricity, Wifi</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLoadDemo}
            disabled={loading}
            className="w-full h-11 bg-[#3B1F3A] hover:bg-[#3B1F3A]/90 text-white font-bold gap-2 text-xs shadow-sm mt-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {loading ? 'Seeding Profile...' : 'Confirm & Load Demo Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
