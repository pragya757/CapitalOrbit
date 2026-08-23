'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { useExpenses } from '@/components/expense-provider'
import { formatCurrency } from '@/lib/format'
import type { FinancialForecastResult } from '@/lib/services/financial-forecast'
import { cn } from '@/lib/utils'

export function ForecastCard() {
  const { user } = useExpenses()
  const [data, setData] = useState<FinancialForecastResult | null>(null)
  const [loading, setLoading] = useState(true)
  const currency = user.currency || 'INR'

  useEffect(() => {
    async function fetchForecast() {
      try {
        const res = await fetch('/api/analytics/forecast')
        const json = await res.json()
        if (res.ok && json.success) {
          setData(json)
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false)
      }
    }
    fetchForecast()
  }, [])

  if (loading) {
    return (
      <Card className="border-sky-300 dark:border-sky-800/60 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#0A2E3B] dark:to-[#051C26] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-600" /> Calculating 30/60/90-Day Forecast...
        </div>
      </Card>
    )
  }

  if (!data) return null

  const horizons = [
    { label: '30-Day Horizon', forecast: data.forecasts.day30 },
    { label: '60-Day Horizon', forecast: data.forecasts.day60 },
    { label: '90-Day Horizon', forecast: data.forecasts.day90 },
  ]

  return (
    <Card className="border-sky-300 dark:border-sky-800/60 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#0A2E3B] dark:to-[#051C26] rounded-2xl shadow-sm">
      <CardHeader className="pb-3 border-b border-sky-200 dark:border-sky-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white font-bold shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-sky-950 dark:text-sky-100">30 / 60 / 90-Day Cash Flow Forecast</CardTitle>
              <CardDescription className="text-xs text-sky-800 dark:text-sky-300">
                Forward projection based on recorded income & obligations
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold uppercase border-sky-300 dark:border-sky-700 bg-white/80 dark:bg-sky-950/80 text-sky-900 dark:text-sky-100">
            Projected
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {horizons.map((item, idx) => {
            const f = item.forecast
            return (
              <div
                key={idx}
                className={cn(
                  'rounded-xl border p-3.5 space-y-2.5 transition-colors bg-white/80 dark:bg-[#051C26]/80 border-sky-200 dark:border-sky-900/60',
                  f.riskLevel === 'LOW' && 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40',
                  f.riskLevel === 'MODERATE' && 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40',
                  f.riskLevel === 'HIGH' && 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-950 dark:text-sky-100">{item.label}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-bold border-sky-300 dark:border-sky-700"
                  >
                    {f.riskLevel} RISK
                  </Badge>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-sky-800 dark:text-sky-300">Proj. Income:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(f.projectedIncome, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sky-800 dark:text-sky-300">Proj. Expenses:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(f.projectedExpenses, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-sky-200 dark:border-sky-900/60 pt-1 font-bold">
                    <span className="text-sky-950 dark:text-sky-100">Proj. Balance:</span>
                    <span className="text-sky-950 dark:text-sky-100 font-mono">{formatCurrency(f.projectedBalance, currency)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-sky-700 dark:text-sky-300 pt-1 border-t border-sky-200 dark:border-sky-900/40 italic">{f.statusNote}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
