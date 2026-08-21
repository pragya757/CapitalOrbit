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
import { Badge } from '@/components/ui/badge'
import { FileText, Printer, Download, Sparkles, Loader2 } from 'lucide-react'
import { useExpenses } from '@/components/expense-provider'
import { formatCurrency } from '@/lib/format'
import { generateFinancialReport, type FinancialReportData } from '@/lib/services/financial-report'
import { toast } from 'sonner'

export function FinancialReportDialog() {
  const { user } = useExpenses()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<FinancialReportData | null>(null)
  const currency = user.currency || 'INR'

  const handleGenerate = async () => {
    setLoading(true)
    try {
      // Generate financial report summary from current data
      const res = await fetch('/api/analytics/cash-flow') // verify API reachable
      if (!res.ok) throw new Error('API unavailable')

      // Use actual user ID and name
      const data = await generateFinancialReport(user.id || 'demo-user-id', user.name || 'User')
      setReport(data)
      setOpen(true)
      toast.success('Financial report compiled successfully!')
    } catch (err: any) {
      toast.error('Failed to compile financial report.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="outline"
        className="gap-2 font-semibold text-xs border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 shadow-sm"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />}
        {loading ? 'Compiling Report...' : 'Generate Financial Report'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">CapitalOrbit Financial Intelligence Report</DialogTitle>
                  <DialogDescription className="text-xs">
                    Generated for {report?.userName} on {report?.generatedAt}
                  </DialogDescription>
                </div>
              </div>

              <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold print:hidden">
                <Printer className="h-3.5 w-3.5" /> Print / Save PDF
              </Button>
            </div>
          </DialogHeader>

          {report && (
            <div className="space-y-6 py-2 text-xs">
              {/* Executive Health Summary */}
              <div className="rounded-xl bg-violet-500/10 border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">Executive Financial Health Summary</span>
                  <Badge variant="outline" className="uppercase font-semibold text-xs">
                    Health Score: {report.healthSummary.healthScore} / 100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
                  <div className="rounded-lg bg-background p-2 border">
                    <div className="text-muted-foreground text-[10px]">Available Balance</div>
                    <div className="font-bold text-foreground mt-0.5">{formatCurrency(report.healthSummary.estimatedAvailableBalance, currency)}</div>
                  </div>

                  <div className="rounded-lg bg-background p-2 border">
                    <div className="text-muted-foreground text-[10px]">Upcoming Bills</div>
                    <div className="font-bold text-amber-600 mt-0.5">{formatCurrency(report.healthSummary.upcomingObligations, currency)}</div>
                  </div>

                  <div className="rounded-lg bg-background p-2 border">
                    <div className="text-muted-foreground text-[10px]">Safety Reserve</div>
                    <div className="font-bold text-blue-600 mt-0.5">{formatCurrency(report.healthSummary.safetyReserve, currency)}</div>
                  </div>

                  <div className="rounded-lg bg-background p-2 border">
                    <div className="text-muted-foreground text-[10px]">Safe-to-Spend</div>
                    <div className="font-bold text-emerald-600 mt-0.5">{formatCurrency(report.healthSummary.safeToSpend, currency)}</div>
                  </div>
                </div>
              </div>

              {/* Cash Flow & Savings Summary */}
              <div className="space-y-2">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">Cash Flow & Savings Rate</span>
                <div className="grid grid-cols-3 gap-3 border rounded-xl p-3 bg-card">
                  <div>
                    <div className="text-muted-foreground">Total Recorded Income</div>
                    <div className="font-bold text-emerald-600 text-sm mt-0.5">{formatCurrency(report.cashFlowSummary.totalIncome, currency)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Recorded Expenses</div>
                    <div className="font-bold text-red-600 text-sm mt-0.5">{formatCurrency(report.cashFlowSummary.totalExpenses, currency)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Savings Rate</div>
                    <div className="font-bold text-violet-600 text-sm mt-0.5">{report.cashFlowSummary.savingsRate}%</div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">Top Spending Categories</span>
                <div className="space-y-1.5">
                  {report.spendingSummary.categories.slice(0, 4).map((c: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                      <span className="capitalize font-medium">{c.category}</span>
                      <span className="font-mono font-bold">{formatCurrency(c.amount, currency)} ({c.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              <div className="space-y-2">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">Key Actionable Insights</span>
                <div className="space-y-1.5">
                  {report.insightsSummary.slice(0, 3).map((ins: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg border bg-card space-y-0.5">
                      <div className="font-bold text-foreground">{ins.title}</div>
                      <p className="text-muted-foreground text-[11px]">{ins.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
