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
      <Card className="border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl p-6">
        <div className="flex items-center gap-2 text-[#756E72] text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-[#3B1F3A]" /> Calculating 30/60/90-Day Forecast...
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
    <Card className="border-[#DCE2ED] dark:border-[#384357] bg-[#F4F7FA] dark:bg-[#1D222E] rounded-2xl shadow-md">
      <CardHeader className="pb-3 border-b border-[#E4DED5]/60 dark:border-[#3D2D3D]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
              <TrendingUp className="h-4 w-4 text-[#72B8A5]" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">30 / 60 / 90-Day Cash Flow Forecast</CardTitle>
              <CardDescription className="text-xs text-[#756E72]">
                Forward projection based on recorded income & obligations
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold uppercase border-[#3B1F3A]/20">
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
                  'rounded-xl border p-3.5 space-y-2.5 transition-colors',
                  f.riskLevel === 'LOW'
                    ? 'bg-[#72B8A5]/10 border-[#72B8A5]/30'
                    : f.riskLevel === 'MODERATE'
                    ? 'bg-[#D8A84E]/10 border-[#D8A84E]/30'
                    : 'bg-[#E9785B]/10 border-[#E9785B]/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">{item.label}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-semibold border-[#3B1F3A]/20"
                  >
                    {f.riskLevel} RISK
                  </Badge>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#756E72]">Proj. Income:</span>
                    <span className="font-semibold text-[#72B8A5]">
                      +{formatCurrency(f.projectedIncome, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#756E72]">Proj. Expenses:</span>
                    <span className="font-semibold text-[#E9785B]">
                      -{formatCurrency(f.projectedExpenses, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#E4DED5]/60 pt-1 font-bold">
                    <span className="text-[#3B1F3A] dark:text-[#F7F4ED]">Proj. Balance:</span>
                    <span className="text-[#3B1F3A] dark:text-[#F7F4ED]">{formatCurrency(f.projectedBalance, currency)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#756E72] pt-1 border-t border-[#E4DED5]/40 italic">{f.statusNote}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
