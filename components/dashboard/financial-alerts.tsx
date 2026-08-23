'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, BellRing } from 'lucide-react'
import { useExpenses } from '@/components/expense-provider'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface FinancialAlertItem {
  id: string
  title: string
  severity: 'CRITICAL' | 'WARNING' | 'POSITIVE' | 'INFO'
  message: string
  metric?: string
}

export function FinancialAlerts() {
  const { expenses, budgets, user } = useExpenses()
  const [alerts, setAlerts] = useState<FinancialAlertItem[]>([])
  const currency = user.currency || 'INR'

  useEffect(() => {
    const generated: FinancialAlertItem[] = []

    budgets.forEach((b) => {
      const categoryExpenses = expenses.filter(
        (e) => (e.category || '').toLowerCase() === b.category.toLowerCase() && e.status !== 'failed' && e.status !== 'refunded'
      )
      const spent = categoryExpenses.reduce((acc, e) => acc + e.amount, 0)
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0

      if (pct >= 100) {
        generated.push({
          id: `alert_budget_exceeded_${b.category}`,
          title: `Budget Exceeded: ${b.category}`,
          severity: 'CRITICAL',
          message: `${b.category.charAt(0).toUpperCase() + b.category.slice(1)} spending has reached ${pct.toFixed(0)}% of its ${formatCurrency(b.limit, currency)} monthly budget.`,
          metric: `${formatCurrency(spent, currency)} / ${formatCurrency(b.limit, currency)}`,
        })
      } else if (pct >= 80) {
        generated.push({
          id: `alert_budget_warning_${b.category}`,
          title: `Budget Approaching Cap: ${b.category}`,
          severity: 'WARNING',
          message: `${b.category.charAt(0).toUpperCase() + b.category.slice(1)} has reached ${pct.toFixed(0)}% of its ${formatCurrency(b.limit, currency)} budget limit.`,
          metric: `${pct.toFixed(0)}% used`,
        })
      }
    })

    const highExpense = expenses.find((e) => e.amount >= 10000 && e.status !== 'failed')
    if (highExpense) {
      generated.push({
        id: `alert_large_txn_${highExpense.id}`,
        title: 'Large Single Transaction Recorded',
        severity: 'INFO',
        message: `Single purchase of ${formatCurrency(highExpense.amount, currency)} recorded for '${highExpense.description}'.`,
        metric: formatCurrency(highExpense.amount, currency),
      })
    }

    if (generated.length === 0) {
      generated.push({
        id: 'alert_all_clear',
        title: 'All Budgets & Alerts Clear',
        severity: 'POSITIVE',
        message: 'No critical budget overruns or shortfalls detected.',
      })
    }

    setAlerts(generated)
  }, [expenses, budgets, currency])

  return (
    <Card className="border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-[#FFFDF0] to-[#FEF9C3] dark:from-[#3B2E0A] dark:to-[#261E05] rounded-2xl shadow-sm">
      <CardHeader className="pb-3 border-b border-amber-200 dark:border-amber-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-sm">
              <BellRing className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-amber-950 dark:text-amber-100">Alert Center</CardTitle>
              <CardDescription className="text-xs text-amber-800 dark:text-amber-300">Live budget caps & shortfall warnings</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold uppercase border-amber-300 dark:border-amber-700 bg-white/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-100">
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-4 text-xs">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'flex items-start justify-between gap-3 p-3 rounded-xl border transition-colors bg-white/80 dark:bg-[#261E05]/80 border-amber-200 dark:border-amber-900/60',
              alert.severity === 'CRITICAL' && 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40',
              alert.severity === 'WARNING' && 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40',
              alert.severity === 'POSITIVE' && 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
            )}
          >
            <div className="flex items-start gap-2.5">
              {alert.severity === 'CRITICAL' && <ShieldAlert className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />}
              {alert.severity === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />}
              {alert.severity === 'POSITIVE' && <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />}
              {alert.severity === 'INFO' && <Info className="h-4 w-4 text-amber-800 mt-0.5 shrink-0" />}

              <div>
                <span className="font-bold text-amber-950 dark:text-amber-100">{alert.title}</span>
                <p className="text-amber-900 dark:text-amber-200 mt-0.5 text-[11px] leading-relaxed">{alert.message}</p>
              </div>
            </div>

            {alert.metric && (
              <Badge variant="outline" className="font-mono text-[10px] shrink-0 font-bold border-amber-300 dark:border-amber-700">
                {alert.metric}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
