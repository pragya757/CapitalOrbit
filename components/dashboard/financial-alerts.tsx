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
    <Card className="border-[#F3E2B8] dark:border-[#54442A] bg-[#FEFAF0] dark:bg-[#2D251A] rounded-2xl shadow-md">
      <CardHeader className="pb-3 border-b border-[#E4DED5]/60 dark:border-[#3D2D3D]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
              <BellRing className="h-4 w-4 text-[#D8A84E]" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Alert Center</CardTitle>
              <CardDescription className="text-xs text-[#756E72]">Live budget caps & shortfall warnings</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold uppercase border-[#3B1F3A]/20">
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-4 text-xs">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'flex items-start justify-between gap-3 p-3 rounded-xl border transition-colors',
              alert.severity === 'CRITICAL'
                ? 'bg-[#E9785B]/10 border-[#E9785B]/30'
                : alert.severity === 'WARNING'
                ? 'bg-[#D8A84E]/10 border-[#D8A84E]/30'
                : alert.severity === 'POSITIVE'
                ? 'bg-[#72B8A5]/10 border-[#72B8A5]/30'
                : 'bg-[#F7F4ED]/60 border-[#E4DED5]'
            )}
          >
            <div className="flex items-start gap-2.5">
              {alert.severity === 'CRITICAL' && <ShieldAlert className="h-4 w-4 text-[#E9785B] mt-0.5 shrink-0" />}
              {alert.severity === 'WARNING' && <AlertTriangle className="h-4 w-4 text-[#D8A84E] mt-0.5 shrink-0" />}
              {alert.severity === 'POSITIVE' && <CheckCircle2 className="h-4 w-4 text-[#72B8A5] mt-0.5 shrink-0" />}
              {alert.severity === 'INFO' && <Info className="h-4 w-4 text-[#3B1F3A] mt-0.5 shrink-0" />}

              <div>
                <span className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">{alert.title}</span>
                <p className="text-[#756E72] dark:text-[#A89FA6] mt-0.5 text-[11px] leading-relaxed">{alert.message}</p>
              </div>
            </div>

            {alert.metric && (
              <Badge variant="outline" className="font-mono text-[10px] shrink-0 font-semibold border-[#3B1F3A]/20">
                {alert.metric}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
