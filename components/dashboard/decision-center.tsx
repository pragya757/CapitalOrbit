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
    <Card className="border-rose-300 dark:border-rose-800/60 bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-[#3B1417] dark:to-[#260A0C] rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-rose-200 dark:border-rose-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white font-bold shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif font-bold text-rose-950 dark:text-rose-100">
                Ask Before You Spend
              </CardTitle>
              <CardDescription className="text-xs text-rose-800 dark:text-rose-300">
                AI Financial Decision Engine & Scenario Simulator
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 bg-white/80 dark:bg-rose-950/80 font-bold text-xs gap-1">
            <Sparkles className="h-3 w-3 text-rose-600" /> Decision Engine
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
              className="h-11 rounded-xl bg-white/80 dark:bg-[#260A0C]/80 border-rose-200 dark:border-rose-900/60 text-xs focus-visible:ring-rose-500 text-rose-950 dark:text-rose-100"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <Button
              onClick={() => handleAnalyze()}
              disabled={analyzing || !query.trim()}
              className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-2 shrink-0 shadow-sm border border-rose-300/40"
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
            <span className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1 text-[11px]">
              <HelpCircle className="h-3 w-3 text-rose-600" /> Try asking:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(prompt)
                  handleAnalyze(prompt)
                }}
                className="rounded-lg bg-white/80 dark:bg-[#260A0C]/80 border border-rose-200 dark:border-rose-900/60 px-2.5 py-1 text-rose-950 dark:text-rose-100 hover:bg-white transition-colors font-bold text-[11px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Decision Result Card */}
        {result && (
          <div className="space-y-4 pt-2 border-t border-rose-200 dark:border-rose-900/60">
            <div
              className={cn(
                'rounded-xl p-4 border transition-all bg-white/90 dark:bg-[#260A0C]/90',
                result.decision === 'SAFE' && 'border-emerald-400 text-emerald-950',
                result.decision === 'CAUTION' && 'border-amber-400 text-amber-950',
                result.decision === 'NOT_RECOMMENDED' && 'border-rose-400 text-rose-950'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {result.decision === 'SAFE' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  {result.decision === 'CAUTION' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                  {result.decision === 'NOT_RECOMMENDED' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
                      <XCircle className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm uppercase tracking-wider text-rose-950 dark:text-rose-100">
                        {result.decision === 'SAFE'
                          ? 'SAFE TO PROCEED'
                          : result.decision === 'CAUTION'
                          ? 'PROCEED WITH CAUTION'
                          : 'NOT RECOMMENDED'}
                      </span>
                      <Badge variant="outline" className="uppercase font-bold text-[9px] border-rose-300 dark:border-rose-700">
                        {result.riskLevel} RISK
                      </Badge>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5 font-medium">{result.reason}</p>
                  </div>
                </div>

                <div className="text-xs text-rose-800 dark:text-rose-300 text-right shrink-0">
                  <span>Confidence: <strong>{Math.round(result.confidence * 100)}%</strong></span>
                  <div className="text-[10px]">{result.confidenceNote}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3">
                <div className="text-rose-800 dark:text-rose-300 font-bold">Safe-to-Spend Before</div>
                <div className="text-sm font-bold text-rose-950 dark:text-rose-100 mt-1 font-mono">
                  {formatCurrency(result.safeToSpend, currency)}
                </div>
              </div>

              {result.requestedAmount !== undefined && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3">
                  <div className="text-rose-800 dark:text-rose-300 font-bold">Requested Amount</div>
                  <div className="text-sm font-bold text-rose-950 dark:text-rose-100 mt-1 font-mono">
                    {formatCurrency(result.requestedAmount, currency)}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3">
                <div className="text-rose-800 dark:text-rose-300 font-bold">Remaining Safe-to-Spend</div>
                <div
                  className={cn(
                    'text-sm font-bold mt-1 font-mono',
                    result.remainingSafeToSpend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {formatCurrency(result.remainingSafeToSpend, currency)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
