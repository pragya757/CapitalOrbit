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
      <Card className="border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26] rounded-2xl p-6">
        <div className="flex items-center gap-2 text-[#756E72] text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-[#3B1F3A]" /> Generating Financial Insights...
        </div>
      </Card>
    )
  }

  if (!data || data.insights.length === 0) return null

  return (
    <Card className="border-[#C6E7DE] dark:border-[#2E4D45] bg-[#F0F9F6] dark:bg-[#1A2824] rounded-2xl shadow-md">
      <CardHeader className="pb-3 border-b border-[#E4DED5]/60 dark:border-[#3D2D3D]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
              <Lightbulb className="h-4 w-4 text-[#D8A84E]" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">Financial Insights & Recommendations</CardTitle>
              <CardDescription className="text-xs text-[#756E72]">
                Explainable intelligence derived from your cash flow
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold uppercase gap-1 border-[#3B1F3A]/20">
            <Sparkles className="h-3 w-3 text-[#E9785B]" /> CapitalOrbit AI
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.insights.map((ins: FinancialInsightItem) => (
            <div
              key={ins.id}
              className={cn(
                'rounded-xl border p-3.5 space-y-2 transition-colors',
                ins.severity === 'CRITICAL'
                  ? 'bg-[#E9785B]/10 border-[#E9785B]/30'
                  : ins.severity === 'WARNING'
                  ? 'bg-[#D8A84E]/10 border-[#D8A84E]/30'
                  : ins.severity === 'POSITIVE'
                  ? 'bg-[#72B8A5]/10 border-[#72B8A5]/30'
                  : 'bg-[#F7F4ED]/60 border-[#E4DED5]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                  {ins.severity === 'CRITICAL' && <ShieldAlert className="h-4 w-4 text-[#E9785B] shrink-0" />}
                  {ins.severity === 'WARNING' && <AlertTriangle className="h-4 w-4 text-[#D8A84E] shrink-0" />}
                  {ins.severity === 'POSITIVE' && <CheckCircle2 className="h-4 w-4 text-[#72B8A5] shrink-0" />}
                  {ins.severity === 'INFO' && <Info className="h-4 w-4 text-[#3B1F3A] shrink-0" />}
                  <span>{ins.title}</span>
                </div>

                <Badge variant="outline" className="font-mono text-[10px] shrink-0 font-semibold border-[#3B1F3A]/20">
                  {ins.metric}
                </Badge>
              </div>

              <p className="text-[#756E72] dark:text-[#A89FA6] text-[11px] leading-relaxed">{ins.explanation}</p>

              {ins.recommendedAction && (
                <p className="text-[#3B1F3A] dark:text-[#F7F4ED] font-semibold text-[10px] pt-1 border-t border-[#E4DED5]/40">
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
