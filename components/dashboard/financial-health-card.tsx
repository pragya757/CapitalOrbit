'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useExpenses } from '@/components/expense-provider'
import { formatCurrency } from '@/lib/format'
import type { FinancialHealthSummary } from '@/lib/types'
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  CalendarCheck,
} from 'lucide-react'

export function FinancialHealthCard() {
  const { user, expenses } = useExpenses()
  const [data, setData] = useState<FinancialHealthSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/financial-health')
      if (res.ok) {
        const body = await res.json()
        if (body.success) {
          setData(body.financialHealth)
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [expenses])

  if (loading) {
    return (
      <Card className="border-[#E2DCD2] dark:border-[#4D364D] bg-white dark:bg-[#2D1E2D] rounded-2xl p-6 shadow-md animate-pulse">
        <div className="flex items-center justify-center gap-2 text-[#756E72] text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-[#3B1F3A]" /> Analyzing financial orbit...
        </div>
      </Card>
    )
  }

  if (!data) return null

  const currency = user.currency || 'INR'

  const getOrbitalColor = () => {
    if (data.isOverCommitted) return '#E9785B' // Coral
    if (data.riskLevel === 'moderate') return '#D8A84E' // Gold
    return '#72B8A5' // Mint
  }

  const orbitalColor = getOrbitalColor()

  return (
    <Card className="border-[#E8DFD5] dark:border-[#4A354A] bg-[#FAF5F0] dark:bg-[#281B28] rounded-2xl shadow-md overflow-hidden transition-all p-5 sm:p-7">
      {/* Top Greeting & Health Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DCD2]/60 dark:border-[#4D364D]/60 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
            Good evening, {user.name || 'Pragya'}
          </h3>
          <p className="text-xs sm:text-sm text-[#756E72] dark:text-[#B5AAB3] mt-0.5 font-medium">
            {data.isOverCommitted
              ? 'Your financial orbit is currently over-committed. Discretionary cuts recommended.'
              : data.riskLevel === 'moderate'
              ? 'Your financial orbit is stable, but liquidity margins are tight.'
              : 'Your financial orbit is healthy.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="border-[#3B1F3A]/20 dark:border-white/20 text-[#3B1F3A] dark:text-[#F7F4ED] bg-[#F5F2EA] dark:bg-[#1C141C] text-xs font-bold px-3 py-1.5 rounded-xl gap-1.5"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: orbitalColor }} />
            Health Score: {data.healthScore} / 100
          </Badge>
          <Button variant="ghost" size="icon" onClick={fetchHealth} title="Refresh financial orbit" className="h-8 w-8 text-[#756E72]">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Hero Safe-to-Spend Centerpiece (Tight & Prominent) */}
      <div className="py-4 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold tracking-[0.2em] text-[#756E72] uppercase">
          Safe to Spend
        </span>

        {data.isOverCommitted ? (
          <div className="mt-1 space-y-1">
            <div className="text-4xl sm:text-6xl font-serif font-extrabold text-[#E9785B] tracking-tight">
              -₹{data.shortfall.toLocaleString()}
            </div>
            <Badge variant="outline" className="border-[#E9785B] text-[#E9785B] bg-[#E9785B]/10 text-xs font-bold">
              Over-Committed Shortfall
            </Badge>
          </div>
        ) : (
          <div className="mt-1 text-5xl sm:text-6xl font-serif font-extrabold tracking-tight text-[#3B1F3A] dark:text-[#F7F4ED]">
            {formatCurrency(data.safeToSpend, currency)}
          </div>
        )}

        <p className="text-xs text-[#756E72] dark:text-[#B5AAB3] max-w-md mx-auto mt-1 leading-relaxed">
          {data.confidenceNote}
        </p>
      </div>

      {/* Sleek Horizontal Divider */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E2DCD2] dark:border-[#4D364D]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-[#2D1E2D] px-3 text-[#756E72] text-[10px] font-bold tracking-widest">
            FINANCIAL CAPACITY BREAKDOWN
          </span>
        </div>
      </div>

      {/* Integrated 4-Metric Grid (Larger Numbers & Clean Labels) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="rounded-xl bg-[#F5F2EA]/80 dark:bg-[#1C141C]/80 border border-[#E2DCD2] dark:border-[#4D364D] p-4 text-center space-y-1">
          <div className="font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED] text-lg sm:text-xl">
            {formatCurrency(data.estimatedAvailableBalance, currency)}
          </div>
          <span className="text-[11px] font-bold text-[#756E72] uppercase tracking-wider block">Balance</span>
          <span className="text-[10px] text-[#756E72]/80 block">Net liquid cash</span>
        </div>

        <div className="rounded-xl bg-[#F5F2EA]/80 dark:bg-[#1C141C]/80 border border-[#E2DCD2] dark:border-[#4D364D] p-4 text-center space-y-1">
          <div className="font-serif font-bold text-[#D8A84E] text-lg sm:text-xl">
            -{formatCurrency(data.upcomingObligations, currency)}
          </div>
          <span className="text-[11px] font-bold text-[#756E72] uppercase tracking-wider block">Bills</span>
          <span className="text-[10px] text-[#756E72]/80 block">Protected fixed bills</span>
        </div>

        <div className="rounded-xl bg-[#F5F2EA]/80 dark:bg-[#1C141C]/80 border border-[#E2DCD2] dark:border-[#4D364D] p-4 text-center space-y-1">
          <div className="font-serif font-bold text-[#70536F] text-lg sm:text-xl">
            -{formatCurrency(data.goalCommitments, currency)}
          </div>
          <span className="text-[11px] font-bold text-[#756E72] uppercase tracking-wider block">Goals</span>
          <span className="text-[10px] text-[#756E72]/80 block">Monthly goal allocation</span>
        </div>

        <div className="rounded-xl bg-[#F5F2EA]/80 dark:bg-[#1C141C]/80 border border-[#E2DCD2] dark:border-[#4D364D] p-4 text-center space-y-1">
          <div className="font-serif font-bold text-[#72B8A5] text-lg sm:text-xl">
            -{formatCurrency(data.safetyReserve, currency)}
          </div>
          <span className="text-[11px] font-bold text-[#756E72] uppercase tracking-wider block">Reserve</span>
          <span className="text-[10px] text-[#756E72]/80 block">1 mo. emergency buffer</span>
        </div>
      </div>

      {/* Expandable Health Score & Breakdown Details */}
      <div className="pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-xs text-[#756E72] hover:text-[#3B1F3A] dark:hover:text-[#F7F4ED] justify-between h-9 font-semibold"
        >
          <span>{showDetails ? 'Hide Detailed Breakdown' : 'Show Score Factors & Obligations'}</span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showDetails && (
          <div className="mt-3 space-y-4 pt-3 border-t border-[#E2DCD2]/70 dark:border-[#4D364D]/70 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <h4 className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED] flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#E9785B]" /> Score Factors
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#756E72]">
                      <span>Cash Coverage (30%)</span>
                      <span className="font-bold text-[#3B1F3A]">{data.scoreBreakdown.cashCoverage}/100</span>
                    </div>
                    <Progress value={data.scoreBreakdown.cashCoverage} className="h-1.5 bg-[#E2DCD2]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#756E72]">
                      <span>Spending Stability (25%)</span>
                      <span className="font-bold text-[#3B1F3A]">{data.scoreBreakdown.spendingStability}/100</span>
                    </div>
                    <Progress value={data.scoreBreakdown.spendingStability} className="h-1.5 bg-[#E2DCD2]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#756E72]">
                      <span>Goal Affordability (25%)</span>
                      <span className="font-bold text-[#3B1F3A]">{data.scoreBreakdown.goalAffordability}/100</span>
                    </div>
                    <Progress value={data.scoreBreakdown.goalAffordability} className="h-1.5 bg-[#E2DCD2]" />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-[#3B1F3A] dark:text-[#F7F4ED] flex items-center gap-1.5 text-xs">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#D8A84E]" /> Protected Obligations
                </h4>
                {data.obligationsBreakdown.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {data.obligationsBreakdown.map((ob, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#F5F2EA] dark:bg-[#1C141C] p-2 rounded-lg border border-[#E2DCD2]/60">
                        <span className="font-medium text-[#3B1F3A] dark:text-[#F7F4ED]">{ob.name}</span>
                        <span className="font-bold text-[#D8A84E]">-{formatCurrency(ob.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#756E72] text-xs italic">No upcoming recurring obligations detected.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
