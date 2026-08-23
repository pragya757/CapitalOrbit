'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertOctagon,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { useExpenses } from '@/components/expense-provider'
import type {
  TransactionFailureIntelligenceResult,
  RecoveryEligibility,
  FailureSeverity,
} from '@/lib/services/transaction-failure-intelligence'
import { cn } from '@/lib/utils'

export function TransactionFailureCard() {
  const { user, expenses } = useExpenses()
  const [data, setData] = useState<TransactionFailureIntelligenceResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchIntelligence = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/transaction-failures')
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

  useEffect(() => {
    fetchIntelligence()
  }, [expenses])

  if (loading) {
    return (
      <Card className="border-rose-300 dark:border-rose-800/60 bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-[#3B1417] dark:to-[#260A0C] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-rose-600" /> Analyzing Transaction Failures & Revenue at Risk...
        </div>
      </Card>
    )
  }

  if (!data) return null

  const currency = user.currency || 'INR'
  const summary = data.summary
  const hasFailures = summary.failedPayments > 0

  const getRecoveryBadge = (eligibility: RecoveryEligibility) => {
    switch (eligibility) {
      case 'RECOVERABLE':
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-[10px] font-bold gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Recoverable
          </Badge>
        )
      case 'POSSIBLY_RECOVERABLE':
        return (
          <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 text-[10px] font-bold gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Possibly Recoverable
          </Badge>
        )
      case 'NOT_RECOVERABLE':
        return (
          <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 text-[10px] font-bold gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Not Recoverable
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 text-[10px] font-bold gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Unknown
          </Badge>
        )
    }
  }

  const getSeverityBadge = (severity: FailureSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-500 text-white text-[9px] font-extrabold uppercase">Critical</Badge>
      case 'HIGH':
        return <Badge className="bg-rose-600 text-white text-[9px] font-bold uppercase">High</Badge>
      case 'MEDIUM':
        return <Badge className="bg-amber-500 text-white text-[9px] font-bold uppercase">Medium</Badge>
      default:
        return <Badge className="bg-slate-400 text-white text-[9px] font-bold uppercase">Low</Badge>
    }
  }

  return (
    <Card className="border-rose-300 dark:border-rose-800/60 bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] dark:from-[#3B1417] dark:to-[#260A0C] rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-rose-200 dark:border-rose-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm font-bold">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-serif font-bold text-rose-950 dark:text-rose-100">
                Transaction Failure Intelligence
              </CardTitle>
              <CardDescription className="text-xs text-rose-800 dark:text-rose-300">
                Deterministic root-cause analysis & revenue at risk
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 bg-white/80 dark:bg-rose-950/80 font-bold text-[10px]">
              {summary.failedPayments} Failed ({summary.failureRate}%)
            </Badge>
            <Button variant="ghost" size="icon" onClick={fetchIntelligence} title="Refresh failure analysis" className="h-7 w-7 text-rose-800 dark:text-rose-300">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-xs">
        {/* Payment Health Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Failed Payments</span>
            <div className="text-lg font-serif font-bold text-rose-700 dark:text-rose-200 font-mono">{summary.failedPayments}</div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">Out of {summary.totalPayments} total</span>
          </div>

          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Failure Rate</span>
            <div className="text-lg font-serif font-bold text-rose-950 dark:text-rose-100 font-mono">
              {summary.failureRate}%
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 truncate block">{summary.failureRateVs7DayAvg.spikeNote}</span>
          </div>

          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Revenue at Risk</span>
            <div className="text-lg font-serif font-bold text-rose-700 dark:text-rose-200 font-mono">
              {formatCurrency(summary.totalFailedAmount, currency)}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">Potentially at risk</span>
          </div>

          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Potentially Recoverable</span>
            <div className="text-lg font-serif font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(summary.potentiallyRecoverableAmount, currency)}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">Eligible for recovery</span>
          </div>
        </div>

        {/* Failure Category Breakdown Badges */}
        {data.categories.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="font-bold text-rose-950 dark:text-rose-100 text-[11px]">Failure Reason Breakdown:</span>
            <div className="flex flex-wrap gap-2">
              {data.categories.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-[#260A0C]/80 px-2.5 py-1 text-[11px]"
                >
                  <span className="font-bold text-rose-950 dark:text-rose-100">{c.category.replace(/_/g, ' ')}</span>
                  <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-rose-100 text-rose-700">
                    {c.count} ({formatCurrency(c.amount, currency)})
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Failed Transactions List */}
        {!hasFailures ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-center text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="font-bold text-xs">All Payments Healthy</p>
            <p className="text-[11px] opacity-80 mt-0.5">No failed Razorpay transactions detected in your history.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="font-bold text-rose-950 dark:text-rose-100 text-[11px]">Failed Transactions & Evidence:</span>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.transactions.map((tx) => {
                const isExpanded = expandedId === tx.paymentId
                return (
                  <div
                    key={tx.paymentId}
                    className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/90 dark:bg-[#260A0C]/90 p-3 space-y-2 transition-all hover:border-rose-400"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer gap-2"
                      onClick={() => setExpandedId(isExpanded ? null : tx.paymentId)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
                        <span className="font-mono font-bold text-rose-950 dark:text-rose-100 truncate">{tx.paymentId}</span>
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold">({tx.paymentMethod})</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-serif font-bold text-rose-950 dark:text-rose-100 font-mono">
                          {formatCurrency(tx.amount, currency)}
                        </span>
                        {getSeverityBadge(tx.severity)}
                        {getRecoveryBadge(tx.recoveryEligibility)}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-rose-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="text-[11px] text-rose-800 dark:text-rose-300 flex justify-between items-center font-medium">
                      <span className="truncate">Reason: {tx.failureReason}</span>
                      <span className="text-[10px] font-mono">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Expanded Detail View & Evidence */}
                    {isExpanded && (
                      <div className="mt-2 pt-2.5 border-t border-rose-200 dark:border-rose-900/60 space-y-2 text-[11px]">
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                          <div>
                            <span className="text-rose-700 dark:text-rose-300">Order ID: </span>
                            <span className="font-bold text-rose-950 dark:text-rose-100">{tx.orderId || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-rose-700 dark:text-rose-300">Category: </span>
                            <span className="font-bold text-rose-600">{tx.category}</span>
                          </div>
                          <div>
                            <span className="text-rose-700 dark:text-rose-300">Failure Code: </span>
                            <span className="font-bold text-rose-950 dark:text-rose-100">{tx.failureCode || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-rose-700 dark:text-rose-300">Failure Source: </span>
                            <span className="font-bold text-rose-950 dark:text-rose-100">{tx.failureSource || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Evidence Box */}
                        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 border border-rose-200 dark:border-rose-900/60 text-[11px] space-y-1">
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" /> Deterministic Evidence Reasoning
                          </span>
                          <p className="text-rose-950 dark:text-rose-100 leading-relaxed font-medium">{tx.evidence}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
