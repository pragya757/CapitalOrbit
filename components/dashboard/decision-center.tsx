'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useExpenses } from '@/components/expense-provider'
import type { FinancialDecisionResult } from '@/lib/types'
import {
  Sparkles,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFinancialDecisionHistory } from '@/lib/actions/financial-decision'
import { toast } from 'sonner'

const QUICK_PROMPTS = [
  'Can I spend ₹20,000 on a laptop?',
  'Can I afford a ₹15,000 phone?',
  'What if my income drops 20%?',
  'What if my expenses increase by ₹5,000?',
]

export function DecisionCenter() {
  const { user } = useExpenses()
  const [query, setQuery] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<FinancialDecisionResult | null>(null)
  const [history, setHistory] = useState<FinancialDecisionResult[]>([])

  const currency = user.currency || 'INR'

  const fetchHistory = async () => {
    const res = await getFinancialDecisionHistory()
    if (res.success) {
      setHistory(res.history)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleAnalyze = async (searchQuery?: string) => {
    const activeQuery = searchQuery || query
    if (!activeQuery.trim()) return

    setAnalyzing(true)
    try {
      const res = await fetch('/api/financial-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setResult(data)
        toast.success('Decision evaluated cleanly against your financial position!')
        fetchHistory()
      } else {
        toast.error(data.error || 'Failed to evaluate financial decision')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Network error evaluating decision')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Card className="border-[#F4C7BB] dark:border-[#5A3338] bg-[#FDF5F2] dark:bg-[#2E1E24] rounded-2xl shadow-md overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#E4DED5]/60 dark:border-[#3D2D3D]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
              <Sparkles className="h-4 w-4 text-[#E9785B]" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                Ask Before You Spend
              </CardTitle>
              <CardDescription className="text-xs text-[#756E72] dark:text-[#A89FA6]">
                AI Financial Decision Engine & Scenario Simulator
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-[#3B1F3A]/20 dark:border-white/20 text-[#3B1F3A] dark:text-[#F7F4ED] bg-[#F7F4ED] dark:bg-[#1C141C] font-semibold text-xs gap-1">
            <Sparkles className="h-3 w-3 text-[#E9785B]" /> Decision Engine
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Natural Language Query Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Can I spend ₹20,000 on a laptop?"
              className="h-11 rounded-xl bg-[#F7F4ED] dark:bg-[#1C141C] border-[#E4DED5] dark:border-[#3D2D3D] text-xs focus-visible:ring-[#3B1F3A]"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <Button
              onClick={() => handleAnalyze()}
              disabled={analyzing || !query.trim()}
              className="h-11 px-6 rounded-xl bg-[#3B1F3A] hover:bg-[#3B1F3A]/90 text-white font-semibold text-xs gap-2 shrink-0 shadow-sm"
            >
              {analyzing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {analyzing ? 'Evaluating...' : 'Analyze'}
            </Button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#756E72] font-medium flex items-center gap-1 text-[11px]">
              <HelpCircle className="h-3 w-3 text-[#3B1F3A]" /> Try asking:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(prompt)
                  handleAnalyze(prompt)
                }}
                className="rounded-lg bg-[#F7F4ED] dark:bg-[#1C141C] border border-[#E4DED5] dark:border-[#3D2D3D] px-2.5 py-1 text-[#3B1F3A] dark:text-[#F7F4ED] hover:bg-[#EAE3D7] transition-colors font-medium text-[11px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Decision Result Card */}
        {result && (
          <div className="space-y-4 pt-2 border-t border-[#E4DED5]/60 dark:border-[#3D2D3D]/60">
            {/* Top Decision Header Banner */}
            <div
              className={cn(
                'rounded-xl p-4 border transition-all',
                result.decision === 'SAFE'
                  ? 'bg-[#72B8A5]/10 border-[#72B8A5]/40'
                  : result.decision === 'CAUTION'
                  ? 'bg-[#D8A84E]/10 border-[#D8A84E]/40'
                  : 'bg-[#E9785B]/10 border-[#E9785B]/40'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {result.decision === 'SAFE' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#72B8A5] text-white font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  {result.decision === 'CAUTION' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D8A84E] text-white font-bold">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                  {result.decision === 'NOT_RECOMMENDED' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E9785B] text-white font-bold">
                      <XCircle className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm uppercase tracking-wider text-[#3B1F3A] dark:text-[#F7F4ED]">
                        {result.decision === 'SAFE'
                          ? 'SAFE TO PROCEED'
                          : result.decision === 'CAUTION'
                          ? 'PROCEED WITH CAUTION'
                          : 'NOT RECOMMENDED'}
                      </span>
                      <Badge variant="outline" className="uppercase font-semibold text-[9px] border-[#3B1F3A]/20">
                        {result.riskLevel} RISK
                      </Badge>
                    </div>
                    <p className="text-xs text-[#756E72] dark:text-[#A89FA6] mt-0.5">{result.reason}</p>
                  </div>
                </div>

                <div className="text-xs text-[#756E72] text-right shrink-0">
                  <span>Confidence: <strong>{Math.round(result.confidence * 100)}%</strong></span>
                  <div className="text-[10px]">{result.confidenceNote}</div>
                </div>
              </div>
            </div>

            {/* Impact Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] bg-[#F7F4ED]/80 dark:bg-[#1C141C]/80 p-3">
                <div className="text-[#756E72] font-medium">Safe-to-Spend Before</div>
                <div className="text-sm font-bold text-[#3B1F3A] dark:text-[#F7F4ED] mt-1">
                  {formatCurrency(result.safeToSpend, currency)}
                </div>
              </div>

              {result.requestedAmount !== undefined && (
                <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] bg-[#F7F4ED]/80 dark:bg-[#1C141C]/80 p-3">
                  <div className="text-[#756E72] font-medium">Requested Amount</div>
                  <div className="text-sm font-bold text-[#3B1F3A] dark:text-[#F7F4ED] mt-1">
                    {formatCurrency(result.requestedAmount, currency)}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] bg-[#F7F4ED]/80 dark:bg-[#1C141C]/80 p-3">
                <div className="text-[#756E72] font-medium">Remaining Safe-to-Spend</div>
                <div
                  className={cn(
                    'text-sm font-bold mt-1',
                    result.remainingSafeToSpend >= 0 ? 'text-[#72B8A5]' : 'text-[#E9785B]'
                  )}
                >
                  {formatCurrency(result.remainingSafeToSpend, currency)}
                </div>
              </div>
            </div>

            {/* Goal Delay / Impact Box */}
            {result.goalImpact && result.goalImpact.affected && (
              <div className="rounded-xl bg-[#D8A84E]/10 border border-[#D8A84E]/40 p-3 text-xs flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-[#D8A84E] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#3B1F3A] dark:text-[#F7F4ED]">
                    Goal Impact Detected: {result.goalImpact.goalName}
                  </p>
                  <p className="text-[#756E72] dark:text-[#A89FA6] mt-0.5">
                    {result.goalImpact.note || `This action reduces future monthly savings capacity, delaying '${result.goalImpact.goalName}' by approx. ${result.goalImpact.daysDelayed} days.`}
                  </p>
                </div>
              </div>
            )}

            {/* Safer Options / Calculated Alternatives */}
            {result.alternatives.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E4DED5]/60 text-xs">
                <span className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#E9785B]" /> Safer Calculated Alternatives:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.alternatives.map((alt, idx) => (
                    <div key={idx} className="rounded-xl border border-[#E4DED5] dark:border-[#3D2D3D] bg-[#F7F4ED]/60 dark:bg-[#1C141C]/60 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">{alt.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-semibold border-[#3B1F3A]/20">
                          {alt.calculatedSavingsOrDelay}
                        </Badge>
                      </div>
                      <p className="text-[#756E72] dark:text-[#A89FA6] text-[11px]">{alt.description}</p>
                      <p className="text-[#72B8A5] text-[10px] font-semibold pt-1">
                        ✓ {alt.financialImpactNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
