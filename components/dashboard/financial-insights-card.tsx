'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, Info, RefreshCw } from 'lucide-react'
import type { FinancialInsightsResult, FinancialInsightItem } from '@/lib/services/financial-insights'
import { cn } from '@/lib/utils'

export function FinancialInsightsCard() {
  const [data, setData] = useState<FinancialInsightsResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/analytics/insights')
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
    fetchInsights()
  }, [])

  if (loading) {
    return (
      <Card className="border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-[#FFFDF0] to-[#FEF9C3] dark:from-[#3B2E0A] dark:to-[#261E05] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-700" /> Generating Financial Insights...
        </div>
      </Card>
    )
  }

  if (!data || data.insights.length === 0) return null

  return (
    <Card className="border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-[#FFFDF0] to-[#FEF9C3] dark:from-[#3B2E0A] dark:to-[#261E05] rounded-2xl shadow-sm">
      <CardHeader className="pb-3 border-b border-amber-200 dark:border-amber-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-sm">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-amber-950 dark:text-amber-100">Financial Insights & Recommendations</CardTitle>
              <CardDescription className="text-xs text-amber-800 dark:text-amber-300">
                Explainable intelligence derived from your cash flow
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold uppercase gap-1 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-100 bg-white/80 dark:bg-amber-950/80">
            <Sparkles className="h-3 w-3 text-amber-600" /> CapitalOrbit AI
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.insights.map((ins: FinancialInsightItem) => (
            <div
              key={ins.id}
              className={cn(
                'rounded-xl border p-3.5 space-y-2 transition-colors bg-white/80 dark:bg-[#261E05]/80 border-amber-200 dark:border-amber-900/60',
                ins.severity === 'CRITICAL' && 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40',
                ins.severity === 'WARNING' && 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40',
                ins.severity === 'POSITIVE' && 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
                  {ins.severity === 'CRITICAL' && <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />}
                  {ins.severity === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
                  {ins.severity === 'POSITIVE' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  {ins.severity === 'INFO' && <Info className="h-4 w-4 text-amber-800 shrink-0" />}
                  <span>{ins.title}</span>
                </div>

                <Badge variant="outline" className="font-mono text-[10px] shrink-0 font-bold border-amber-300 dark:border-amber-700">
                  {ins.metric}
                </Badge>
              </div>

              <p className="text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">{ins.explanation}</p>

              {ins.recommendedAction && (
                <p className="text-amber-950 dark:text-amber-100 font-semibold text-[10px] pt-1 border-t border-amber-200 dark:border-amber-900/60">
                  💡 <strong>Action:</strong> {ins.recommendedAction}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
