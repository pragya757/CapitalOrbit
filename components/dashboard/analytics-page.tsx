'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryLabel, CHART_COLORS, ALL_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  ShieldAlert,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCcw,
  Info,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, isWithinInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TransactionFailureIntelligenceResult, FailureSeverity } from '@/lib/services/transaction-failure-intelligence'
import type {
  RevenueRecoveryAnalysisResult,
  SingleSimulationResponse,
  BatchSimulationResult,
  RecoveryPriority,
  RecoveryCampaignResult,
} from '@/lib/services/revenue-recovery'

export function AnalyticsPage() {
  const { expenses, getTotalSpent, getSpendingByCategory, user, totalBudgeted } = useExpenses()
  const [activeTab, setActiveTab] = useState<'spending' | 'payment-intelligence' | 'revenue-recovery'>('revenue-recovery')
  const [failureIntel, setFailureIntel] = useState<TransactionFailureIntelligenceResult | null>(null)
  const [recoveryIntel, setRecoveryIntel] = useState<RevenueRecoveryAnalysisResult | null>(null)
  const [loadingIntel, setLoadingIntel] = useState(false)
  const [simulatingPaymentId, setSimulatingPaymentId] = useState<string | null>(null)
  const [simulatingBatch, setSimulatingBatch] = useState(false)
  const [lastSingleResult, setLastSingleResult] = useState<SingleSimulationResponse | null>(null)
  const [lastBatchResult, setLastBatchResult] = useState<BatchSimulationResult | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')

  // Step 13 Campaign Simulator State
  const [campaignPriority, setCampaignPriority] = useState<string>('ALL')
  const [campaignCategory, setCampaignCategory] = useState<string>('ALL')
  const [campaignMethod, setCampaignMethod] = useState<string>('ALL')
  const [campaignAction, setCampaignAction] = useState<string>('ALL')
  const [campaignMaxTx, setCampaignMaxTx] = useState<number>(0)
  const [campaignResult, setCampaignResult] = useState<RecoveryCampaignResult | null>(null)
  const [isSimulatingCampaign, setIsSimulatingCampaign] = useState(false)
  const [showExceptions, setShowExceptions] = useState(false)

  // Fetch Payment Intelligence data
  useEffect(() => {
    async function fetchFailureIntel() {
      try {
        setLoadingIntel(true)
        const res = await fetch('/api/analytics/transaction-failures')
        if (res.ok) {
          const data: TransactionFailureIntelligenceResult = await res.json()
          setFailureIntel(data)
        }
      } catch (err) {
        console.error('Failed to load transaction failure intelligence', err)
      } finally {
        setLoadingIntel(false)
      }
    }
    fetchFailureIntel()
  }, [])

  // Fetch Revenue Recovery data
  const fetchRecoveryIntel = async () => {
    try {
      setLoadingIntel(true)
      const res = await fetch('/api/analytics/revenue-recovery')
      if (res.ok) {
        const data: RevenueRecoveryAnalysisResult = await res.json()
        setRecoveryIntel(data)
      }
    } catch (err) {
      console.error('Failed to load revenue recovery intelligence', err)
    } finally {
      setLoadingIntel(false)
    }
  }

  useEffect(() => {
    fetchRecoveryIntel()
  }, [])

  // Handle Single Recovery Simulation
  const handleSimulateSingle = async (paymentId: string) => {
    try {
      setSimulatingPaymentId(paymentId)
      setLastBatchResult(null)
      const res = await fetch('/api/analytics/revenue-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_single', paymentId }),
      })
      const data = await res.json()
      if (data.success && data.result) {
        setLastSingleResult(data.result)
        await fetchRecoveryIntel()
      }
    } catch (err) {
      console.error('Failed to simulate single recovery', err)
    } finally {
      setSimulatingPaymentId(null)
    }
  }

  // Handle Batch Recovery Simulation
  const handleSimulateBatch = async () => {
    try {
      setSimulatingBatch(true)
      setLastSingleResult(null)
      const res = await fetch('/api/analytics/revenue-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_batch' }),
      })
      const data = await res.json()
      if (data.success && data.result) {
        setLastBatchResult(data.result)
        await fetchRecoveryIntel()
      }
    } catch (err) {
      console.error('Failed to simulate batch recovery', err)
    } finally {
      setSimulatingBatch(false)
    }
  }

  // Step 13 Campaign Simulation Handler
  const handleRunCampaignSimulation = async () => {
    try {
      setIsSimulatingCampaign(true)
      const res = await fetch('/api/analytics/revenue-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_campaign',
          priority: campaignPriority,
          failureCategory: campaignCategory,
          paymentMethod: campaignMethod,
          maxTransactions: campaignMaxTx,
          recoveryAction: campaignAction,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCampaignResult(data.result)
        await fetchRecoveryIntel()
      }
    } catch (err) {
      console.error('Failed to run campaign simulation', err)
    } finally {
      setIsSimulatingCampaign(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'revenue-recovery' && recoveryIntel && !campaignResult) {
      handleRunCampaignSimulation()
    }
  }, [activeTab, recoveryIntel])

  // Financial Analytics Memoized Calculations
  const dailySpending = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    })

    return days.map((day) => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)

      const total = expenses
        .filter((exp) => {
          const expDate = new Date(exp.date)
          return isWithinInterval(expDate, { start: dayStart, end: dayEnd }) && exp.status !== 'failed' && exp.status !== 'refunded'
        })
        .reduce((sum, exp) => sum + exp.amount, 0)

      return {
        day: format(day, 'EEE'),
        amount: total,
        fullDate: format(day, 'MMM d'),
      }
    })
  }, [expenses])

  const weeklySpending = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd })

    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart)

      const total = expenses
        .filter((exp) => {
          const expDate = new Date(exp.date)
          return (
            isWithinInterval(expDate, {
              start: weekStart,
              end: weekEnd > monthEnd ? monthEnd : weekEnd,
            }) &&
            exp.status !== 'failed' &&
            exp.status !== 'refunded'
          )
        })
        .reduce((sum, exp) => sum + exp.amount, 0)

      return {
        week: `Week ${index + 1}`,
        amount: total,
      }
    })
  }, [expenses])

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = { cash: 0, card: 0, upi: 0, wallet: 0 }
    const monthExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date)
      const monthStart = startOfMonth(new Date())
      return expDate >= monthStart && exp.status !== 'failed' && exp.status !== 'refunded'
    })
    monthExpenses.forEach((exp) => {
      const m = (exp.paymentMethod || 'cash').toLowerCase()
      if (methods[m] !== undefined) {
        methods[m] += exp.amount
      } else {
        methods.cash += exp.amount
      }
    })
    return Object.entries(methods)
      .filter(([, amount]) => amount > 0)
      .map(([method, amount]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: amount,
      }))
  }, [expenses])

  const topCategories = getSpendingByCategory('month').slice(0, 5)

  const monthlySpent = getTotalSpent('month')
  const weeklySpent = getTotalSpent('week')
  const lastWeekStart = subDays(startOfWeek(new Date()), 7)
  const lastWeekEnd = subDays(endOfWeek(new Date()), 7)
  const lastWeekSpent = expenses
    .filter((exp) => {
      const expDate = new Date(exp.date)
      return isWithinInterval(expDate, { start: lastWeekStart, end: lastWeekEnd }) && exp.status !== 'failed' && exp.status !== 'refunded'
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  const weeklyChange = lastWeekSpent > 0 ? ((weeklySpent - lastWeekSpent) / lastWeekSpent) * 100 : 0
  const avgDailySpend = monthlySpent / (new Date().getDate() || 1)
  const projectedMonthly = avgDailySpend * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const currencySymbol = user?.currency || 'INR'

  // Payment Intelligence Metrics
  const summary = failureIntel?.summary
  const categories = failureIntel?.categories || []
  const paymentMethods = failureIntel?.paymentMethods || []

  const totalPayments = summary?.totalPayments || 0
  const failedPayments = summary?.failedPayments || 0
  const successfulPayments = summary?.successfulPayments || 0
  const successRate = totalPayments > 0 ? Number(((successfulPayments / totalPayments) * 100).toFixed(1)) : 100
  const failureRate = summary?.failureRate || 0

  const totalFailedAmount = summary?.totalFailedAmount || 0
  const potentiallyRecoverableAmount = summary?.potentiallyRecoverableAmount || 0
  const nonRecoverableAmount = summary?.nonRecoverableAmount || 0
  const recoveryOpportunityPercent = totalFailedAmount > 0 ? Number(((potentiallyRecoverableAmount / totalFailedAmount) * 100).toFixed(1)) : 0

  const spikeInfo = summary?.failureRateVs7DayAvg
  const hasSufficientDataForAnomaly = totalPayments >= 3

  let anomalySeverity: FailureSeverity = 'LOW'
  if (hasSufficientDataForAnomaly && spikeInfo) {
    if (spikeInfo.ratio >= 2.5 || failureRate >= 40) anomalySeverity = 'CRITICAL'
    else if (spikeInfo.ratio >= 1.8 || failureRate >= 25) anomalySeverity = 'HIGH'
    else if (spikeInfo.ratio >= 1.3 || failureRate >= 15) anomalySeverity = 'MEDIUM'
  }

  const highestRiskMethod = paymentMethods.find((m) => m.totalCount >= 2 && m.failureRate > 0) || paymentMethods[0]

  // Revenue Recovery Data
  const recSummary = recoveryIntel?.summary
  const priorityQueue = recoveryIntel?.priorityQueue || []
  const auditTrail = recoveryIntel?.auditTrail || []

  const filteredPriorityQueue = useMemo(() => {
    if (priorityFilter === 'ALL') return priorityQueue
    return priorityQueue.filter((t) => t.priority === priorityFilter)
  }, [priorityQueue, priorityFilter])

  const getPriorityBadge = (priority: RecoveryPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge className="bg-red-500 text-white font-extrabold text-[9px] uppercase">Critical</Badge>
      case 'HIGH':
        return <Badge className="bg-[#E9785B] text-white font-bold text-[9px] uppercase">High</Badge>
      case 'MEDIUM':
        return <Badge className="bg-[#D8A84E] text-white font-bold text-[9px] uppercase">Medium</Badge>
      default:
        return <Badge className="bg-[#72B8A5] text-white font-bold text-[9px] uppercase">Low</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 sm:p-2">
      {/* Header & Sub-Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden p-4 rounded-2xl bg-gradient-to-r from-[#0B192C] to-[#1E293B] text-white shadow-md border border-[#38BDF8]/30">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight text-[#F8FAFC]">
            Analytics & Intelligence Console
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] font-medium">
            360° Fintech Insights, Razorpay Payment Failure Diagnosis, and Automated Revenue Recovery Operations
          </p>
        </div>

        {/* 3-Tab Sub-Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#0B192C]/80 border border-[#38BDF8]/30 rounded-xl shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('revenue-recovery')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0',
              activeTab === 'revenue-recovery'
                ? 'bg-[#38BDF8] text-[#0B192C] shadow-md font-extrabold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Revenue Recovery ⚡</span>
          </button>

          <button
            onClick={() => setActiveTab('payment-intelligence')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0',
              activeTab === 'payment-intelligence'
                ? 'bg-[#D8A84E] text-[#0B192C] shadow-md font-extrabold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Payment Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab('spending')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0',
              activeTab === 'spending'
                ? 'bg-[#72B8A5] text-[#0B192C] shadow-md font-extrabold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Financial Analytics</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 3: REVENUE RECOVERY (DISTINCT COLOR CARDS)                           */}
      {/* ========================================================================= */}
      {activeTab === 'revenue-recovery' && (
        <div className="space-y-6">
          {/* Recovery Overview Cards with Distinct Background Colors */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Card 1: Revenue at Risk (Rose/Red Gradient Tint) */}
            <Card className="border-rose-300 dark:border-rose-800/60 bg-gradient-to-br from-[#FFF5F5] to-[#FFE8E8] dark:from-[#3B1219] dark:to-[#2A0C12] rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Revenue at Risk</p>
                <p className="text-xl font-serif font-extrabold text-rose-700 dark:text-rose-200 mt-1 font-mono">
                  {formatCurrency(recSummary?.totalRevenueAtRisk || 0, currencySymbol)}
                </p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">{recSummary?.totalOpportunitiesCount || 0} failed payments</p>
              </CardContent>
            </Card>

            {/* Card 2: Potentially Recoverable (Amber/Gold Gradient Tint) */}
            <Card className="border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-[#FFFDF0] to-[#FEF9C3] dark:from-[#3B2E0A] dark:to-[#261E05] rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Potentially Recoverable</p>
                <p className="text-xl font-serif font-extrabold text-amber-700 dark:text-amber-200 mt-1 font-mono">
                  {formatCurrency(recSummary?.potentiallyRecoverableRevenue || 0, currencySymbol)}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{recSummary?.eligibleOpportunitiesCount || 0} eligible queues</p>
              </CardContent>
            </Card>

            {/* Card 3: Opportunity % (Emerald/Green Gradient Tint) */}
            <Card className="border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0A3B1E] dark:to-[#052613] rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Opportunity %</p>
                <p className="text-xl font-serif font-extrabold text-emerald-700 dark:text-emerald-200 mt-1 font-mono">
                  {recSummary?.recoveryOpportunityPercent || 0}%
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Recovery yield ratio</p>
              </CardContent>
            </Card>

            {/* Card 4: Simulated Recovered (Sky/Cyan Gradient Tint) */}
            <Card className="border-sky-300 dark:border-sky-800/60 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#0A2E3B] dark:to-[#051C26] rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">Simulated Recovered</p>
                <p className="text-xl font-serif font-extrabold text-sky-700 dark:text-sky-200 mt-1 font-mono">
                  {formatCurrency(recSummary?.simulatedRecoveredAmount || 0, currencySymbol)}
                </p>
                <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">Test mode simulation</p>
              </CardContent>
            </Card>

            {/* Card 5: Non-Recoverable Loss (Slate Tint) */}
            <Card className="border-slate-300 dark:border-slate-700/60 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] dark:from-[#1E293B] dark:to-[#0F172A] rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Non-Recoverable Loss</p>
                <p className="text-xl font-serif font-extrabold text-slate-800 dark:text-slate-200 mt-1 font-mono">
                  {formatCurrency(recSummary?.nonRecoverableAmount || 0, currencySymbol)}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{recSummary?.nonRecoverableCount || 0} permanent declines</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Header & Batch Simulator Trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E293B] to-[#0B192C] text-white shadow-md border border-[#38BDF8]/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-[#F8FAFC]">Recovery Operations Console (Test Simulation Mode)</h3>
                <p className="text-[11px] text-[#94A3B8]">
                  Evaluate deterministic recovery rules and simulate batch workflows without triggering live payment charges.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSimulateBatch}
              disabled={simulatingBatch || (recSummary?.eligibleOpportunitiesCount || 0) === 0}
              className="bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0B192C] font-bold text-xs rounded-xl px-4 h-9 gap-1.5 shrink-0 shadow-md"
            >
              {simulatingBatch ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>Simulate Recovery Batch</span>
            </Button>
          </div>

          {/* ========================================================================= */}
          {/* RECOVERY CAMPAIGN & OUTCOME SIMULATOR (STEP 13)                            */}
          {/* ========================================================================= */}
          <Card className="border-indigo-300 dark:border-indigo-800/60 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] dark:from-[#171E3B] dark:to-[#0E1328] rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-indigo-200 dark:border-indigo-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-sm">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-serif font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                      Recovery Campaign Simulator ⚡
                    </CardTitle>
                    <CardDescription className="text-xs text-indigo-800 dark:text-indigo-300">
                      Simulate batch recovery campaigns with deterministic probability assumptions
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-white/90 text-indigo-900 border border-indigo-300 text-[10px] font-bold">
                    Simulation Engine Active
                  </Badge>
                  <Button
                    onClick={handleRunCampaignSimulation}
                    disabled={isSimulatingCampaign}
                    size="sm"
                    className="h-8 px-3.5 text-[11px] font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl gap-1.5 shadow-sm"
                  >
                    {isSimulatingCampaign ? (
                      <RefreshCcw className="h-3.5 w-3.5 animate-spin text-cyan-300" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-cyan-300 fill-cyan-300" />
                    )}
                    <span>{isSimulatingCampaign ? 'Simulating...' : 'Run Campaign Simulator'}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Campaign Controls */}
              <div className="p-4 rounded-xl bg-white/80 dark:bg-[#171E3B]/80 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-100 uppercase tracking-wider block">
                  Campaign Builder Controls
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  {/* Priority Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 block mb-1">Priority</label>
                    <select
                      value={campaignPriority}
                      onChange={(e) => {
                        setCampaignPriority(e.target.value)
                        handleRunCampaignSimulation()
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#0E1328] text-indigo-950 dark:text-indigo-100 text-xs font-bold"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>

                  {/* Failure Category */}
                  <div>
                    <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 block mb-1">Failure Type</label>
                    <select
                      value={campaignCategory}
                      onChange={(e) => {
                        setCampaignCategory(e.target.value)
                        handleRunCampaignSimulation()
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#0E1328] text-indigo-950 dark:text-indigo-100 text-xs font-bold"
                    >
                      <option value="ALL">All Failure Types</option>
                      <option value="NETWORK_FAILURE">Network Failure (85% prob)</option>
                      <option value="TIMEOUT">Timeout (80% prob)</option>
                      <option value="PAYMENT_GATEWAY_FAILURE">Gateway Failure (75% prob)</option>
                      <option value="AUTHENTICATION_FAILURE">Auth / OTP (50% prob)</option>
                      <option value="INSUFFICIENT_FUNDS">Insufficient Funds (35% prob)</option>
                      <option value="BANK_DECLINE">Bank Decline (15% prob)</option>
                      <option value="CUSTOMER_CANCELLED">Customer Cancelled (0% prob)</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 block mb-1">Payment Method</label>
                    <select
                      value={campaignMethod}
                      onChange={(e) => {
                        setCampaignMethod(e.target.value)
                        handleRunCampaignSimulation()
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#0E1328] text-indigo-950 dark:text-indigo-100 text-xs font-bold"
                    >
                      <option value="ALL">All Methods</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Netbanking</option>
                      <option value="wallet">Wallet</option>
                    </select>
                  </div>

                  {/* Recovery Action */}
                  <div>
                    <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 block mb-1">Action Strategy</label>
                    <select
                      value={campaignAction}
                      onChange={(e) => {
                        setCampaignAction(e.target.value)
                        handleRunCampaignSimulation()
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#0E1328] text-indigo-950 dark:text-indigo-100 text-xs font-bold"
                    >
                      <option value="ALL">All Strategies</option>
                      <option value="RETRY_PAYMENT">Retry Payment</option>
                      <option value="RETRY_LATER">Retry Later</option>
                      <option value="ASK_CUSTOMER_TO_RETRY">Ask Customer to Retry</option>
                      <option value="VERIFY_PAYMENT_METHOD">Verify Instrument</option>
                    </select>
                  </div>

                  {/* Max Tx Count Limit */}
                  <div>
                    <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 block mb-1">Max Transactions</label>
                    <select
                      value={campaignMaxTx}
                      onChange={(e) => {
                        setCampaignMaxTx(Number(e.target.value))
                        handleRunCampaignSimulation()
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#0E1328] text-indigo-950 dark:text-indigo-100 text-xs font-bold"
                    >
                      <option value={0}>Unlimited</option>
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Before vs After Visualization */}
              {campaignResult && (
                <>
                  <div className="p-4 rounded-xl bg-[#0B192C] text-white border border-[#38BDF8]/40 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F8FAFC] tracking-wider uppercase flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-[#38BDF8]" /> Revenue Impact Comparison (Before vs After)
                      </span>
                      <Badge className="bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 text-[9px] font-bold">
                        PROJECTION FLOW
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                      {/* Step 1: Before */}
                      <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">1. Before Recovery</span>
                        <div className="text-xl font-serif font-extrabold text-[#E9785B] font-mono">
                          {formatCurrency(campaignResult.beforeRecovery.revenueAtRisk, currencySymbol)}
                        </div>
                        <span className="text-[10px] text-[#94A3B8] block">Total Revenue at Risk</span>
                      </div>

                      {/* Step 2: Simulated Recovery */}
                      <div className="p-3.5 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/40 space-y-1 relative">
                        <span className="text-[10px] text-[#38BDF8] font-bold uppercase tracking-wider block">2. Simulated Recovery ⚡</span>
                        <div className="text-xl font-serif font-extrabold text-[#72B8A5] font-mono">
                          +{formatCurrency(campaignResult.simulatedRecovery.expectedRecovery, currencySymbol)}
                        </div>
                        <span className="text-[10px] text-[#38BDF8] font-bold block">
                          {campaignResult.expectedRecoveryRate}% Expected Recovery Rate
                        </span>
                      </div>

                      {/* Step 3: After */}
                      <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">3. After Recovery</span>
                        <div className="text-xl font-serif font-extrabold text-[#F8FAFC] font-mono">
                          {formatCurrency(campaignResult.afterRecovery.remainingRisk, currencySymbol)}
                        </div>
                        <span className="text-[10px] text-[#94A3B8] block">Remaining Revenue Risk</span>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Metrics & Results Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#171E3B]/80 border border-indigo-200 dark:border-indigo-900/60">
                      <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase block">Evaluated</span>
                      <div className="text-lg font-serif font-bold text-indigo-950 dark:text-indigo-100 font-mono">
                        {campaignResult.transactionsEvaluated}
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Total failed transactions</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#171E3B]/80 border border-indigo-200 dark:border-indigo-900/60">
                      <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase block">Selected</span>
                      <div className="text-lg font-serif font-bold text-indigo-950 dark:text-indigo-100 font-mono">
                        {campaignResult.transactionsSelectedCount}
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Matched campaign filters</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#171E3B]/80 border border-indigo-200 dark:border-indigo-900/60">
                      <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase block">Expected Recovery</span>
                      <div className="text-lg font-serif font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(campaignResult.expectedRecoveredRevenue, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Deterministic forecast</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#171E3B]/80 border border-indigo-200 dark:border-indigo-900/60">
                      <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase block">Non-Recoverable</span>
                      <div className="text-lg font-serif font-bold text-rose-600 dark:text-rose-400 font-mono">
                        {formatCurrency(campaignResult.nonRecoverableAmount, currencySymbol)}
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Protected / Excluded</span>
                    </div>
                  </div>

                  {/* Data-Grounded Campaign Explanation */}
                  <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#171E3B]/90 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-100">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span>{campaignResult.explanation.title}</span>
                    </div>
                    <p className="text-indigo-900 dark:text-indigo-200 text-[11px] leading-relaxed">
                      {campaignResult.explanation.summary}
                    </p>
                    <p className="text-indigo-800 dark:text-indigo-300 text-[10px] pt-1 border-t border-indigo-100 dark:border-indigo-900/40 italic">
                      💡 {campaignResult.explanation.reasoning}
                    </p>
                  </div>

                  {/* Disclaimer Banner */}
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>{campaignResult.disclaimer}</span>
                  </div>

                  {/* Exception List Section */}
                  {campaignResult.exceptions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-indigo-200 dark:border-indigo-900/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 dark:text-indigo-100 text-[11px]">
                          Excluded Transactions ({campaignResult.exceptions.length} Excluded):
                        </span>
                        <button
                          onClick={() => setShowExceptions(!showExceptions)}
                          className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-950"
                        >
                          {showExceptions ? 'Hide Excluded List' : 'Show Excluded List'}
                        </button>
                      </div>

                      {showExceptions && (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {campaignResult.exceptions.map((ex, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-white/70 dark:bg-[#0E1328]/70 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono font-bold text-indigo-950 dark:text-indigo-100 truncate">{ex.paymentId}</span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{ex.reason}</span>
                              </div>
                              <span className="font-mono font-bold text-indigo-950 dark:text-indigo-100">
                                {formatCurrency(ex.amount, currencySymbol)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Single Simulation Result Banner */}
          {lastSingleResult && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <Badge className="bg-[#D8A84E] text-white text-[9px] font-bold">TEST / SIMULATION RESULT</Badge>
                  Single Recovery Simulation for {lastSingleResult.paymentId}
                </span>
                <Badge variant="outline" className="text-[9px] font-bold">{lastSingleResult.status}</Badge>
              </div>
              <p className="text-amber-800 dark:text-amber-300">{lastSingleResult.auditEntry.reason}</p>
              <div className="flex gap-4 font-mono pt-1 text-[11px]">
                <span>Action: <b>{lastSingleResult.attemptedAction}</b></span>
                <span>Amount Recovered: <b>{formatCurrency(lastSingleResult.amountRecovered, currencySymbol)}</b></span>
                <span>Remaining Risk: <b>{formatCurrency(lastSingleResult.remainingRiskAmount, currencySymbol)}</b></span>
              </div>
            </div>
          )}

          {/* Batch Simulation Result Banner */}
          {lastBatchResult && (
            <div className="p-4 rounded-2xl bg-[#0B192C] text-white border border-[#38BDF8]/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <Badge className="bg-[#38BDF8] text-[#0B192C] text-[9px] font-bold">BATCH SIMULATION REPORT</Badge>
                  Evaluated {lastBatchResult.totalEvaluated} Failed Transactions
                </span>
                <span className="font-mono text-[11px] text-[#38BDF8]">Recovered: {formatCurrency(lastBatchResult.recoveredAmount, currencySymbol)}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center font-mono pt-1">
                <div className="p-2 rounded-lg bg-white/10">
                  <span className="text-[9px] text-[#94A3B8] block">Attempted</span>
                  <span className="font-bold text-sm">{lastBatchResult.attemptedCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/10">
                  <span className="text-[9px] text-[#94A3B8] block">Successful</span>
                  <span className="font-bold text-sm text-[#72B8A5]">{lastBatchResult.successfulCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/10">
                  <span className="text-[9px] text-[#94A3B8] block">Failed</span>
                  <span className="font-bold text-sm text-[#E9785B]">{lastBatchResult.failedCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/10">
                  <span className="text-[9px] text-[#94A3B8] block">Remaining Risk</span>
                  <span className="font-bold text-sm">{formatCurrency(lastBatchResult.remainingRiskAmount, currencySymbol)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recovery Priority Queue (Purple Gradient Tint Card) */}
          <Card className="border-purple-300 dark:border-purple-800/60 bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] dark:from-[#1C1426] dark:to-[#120B1A] rounded-2xl shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-serif font-bold text-purple-950 dark:text-purple-100">
                  Recovery Priority Queue
                </CardTitle>
                <CardDescription className="text-xs text-purple-700 dark:text-purple-300">
                  Ranked by financial value, recency, severity, and deterministic recovery eligibility
                </CardDescription>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 text-xs pt-2 sm:pt-0">
                <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300">Priority:</span>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold transition-all',
                      priorityFilter === p
                        ? 'bg-purple-900 text-white shadow-sm'
                        : 'bg-white/80 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:text-purple-950'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {filteredPriorityQueue.length === 0 ? (
                <p className="text-center text-purple-700 dark:text-purple-300 py-8 text-xs">No failed transactions match selected priority filter.</p>
              ) : (
                filteredPriorityQueue.map((tx) => (
                  <div
                    key={tx.paymentId}
                    className="p-3.5 rounded-xl bg-white/90 dark:bg-[#120B1A]/80 border border-purple-200 dark:border-purple-900/60 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-950 dark:text-purple-100 font-mono">{tx.paymentId}</span>
                        {getPriorityBadge(tx.priority)}
                        <Badge variant="outline" className="text-[9px] font-bold uppercase border-purple-300 dark:border-purple-700">
                          {tx.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-serif font-extrabold text-purple-950 dark:text-purple-100 font-mono">
                          {formatCurrency(tx.amount, currencySymbol)}
                        </span>

                        <Button
                          onClick={() => handleSimulateSingle(tx.paymentId)}
                          disabled={!tx.isEligibleForSimulation || simulatingPaymentId === tx.paymentId}
                          size="sm"
                          className="h-8 px-3 text-[11px] font-bold bg-[#0B192C] hover:bg-[#1E293B] text-white rounded-lg gap-1 border border-[#38BDF8]/40 shrink-0"
                        >
                          {simulatingPaymentId === tx.paymentId ? (
                            <RefreshCcw className="h-3 w-3 animate-spin text-[#38BDF8]" />
                          ) : (
                            <RotateCcw className="h-3 w-3 text-[#38BDF8]" />
                          )}
                          <span>{tx.isEligibleForSimulation ? 'Simulate Recovery' : tx.recoveryStatus.replace(/_/g, ' ')}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-purple-700 dark:text-purple-300 pt-1 border-t border-purple-100 dark:border-purple-900/40">
                      <span>Action: <b className="text-purple-950 dark:text-purple-100">{tx.recommendedAction.replace(/_/g, ' ')}</b> — {tx.actionExplanation}</span>
                      <span className="font-mono">Attempts: {tx.attemptCount}/2</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Stopping Rules & Audit Trail */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stopping Rules (Orange Tint Card) */}
            <Card className="border-orange-300 dark:border-orange-800/60 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] dark:from-[#2D1B0D] dark:to-[#1C0F07] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-orange-950 dark:text-orange-100">
                  Stopping Rules & Safety Control
                </CardTitle>
                <CardDescription className="text-xs text-orange-700 dark:text-orange-300">
                  Enforced safeguards preventing unauthorized retries or indefinite processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-orange-800 dark:text-orange-300">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-[#1C0F07]/80 border border-orange-200 dark:border-orange-900/60">
                  <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-orange-950 dark:text-orange-100 block">Max Retry Cap (2 Attempts)</span>
                    Transactions are capped at a maximum of 2 simulated recovery attempts before status escalates to MAX_ATTEMPTS_EXCEEDED.
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-[#1C0F07]/80 border border-orange-200 dark:border-orange-900/60">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-orange-950 dark:text-orange-100 block">Non-Recoverable Protection</span>
                    Permanent bank declines, card theft, and customer cancellations are strictly barred from re-attempts.
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-[#1C0F07]/80 border border-orange-200 dark:border-orange-900/60">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-orange-950 dark:text-orange-100 block">Zero Live Execution</span>
                    All actions execute in test/simulation mode. No live Razorpay charge or refund endpoints are called.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail (Teal Tint Card) */}
            <Card className="border-teal-300 dark:border-teal-800/60 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] dark:from-[#0B2524] dark:to-[#061817] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-teal-950 dark:text-teal-100">
                  Recovery Audit Trail Log
                </CardTitle>
                <CardDescription className="text-xs text-teal-700 dark:text-teal-300">
                  Timestamped history of recovery evaluation decisions and simulation results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {auditTrail.length === 0 ? (
                  <p className="text-center text-teal-700 dark:text-teal-300 py-6">No recovery simulation logs recorded yet.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {auditTrail.map((log) => (
                      <div key={log.id} className="p-2 rounded-lg bg-white/80 dark:bg-[#061817]/80 border border-teal-200 dark:border-teal-900/60 space-y-0.5 text-[11px]">
                        <div className="flex justify-between font-mono font-bold text-teal-950 dark:text-teal-100">
                          <span>{log.paymentId}</span>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                        </div>
                        <p className="text-teal-800 dark:text-teal-300">{log.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PAYMENT INTELLIGENCE CENTER (DISTINCT COLOR CARDS)                */}
      {/* ========================================================================= */}
      {activeTab === 'payment-intelligence' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Success Rate: Emerald Tint */}
            <Card className="border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0A3B1E] dark:to-[#052613] rounded-2xl shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Payment Success Rate</p>
                    <p className="text-2xl font-serif font-extrabold text-emerald-700 dark:text-emerald-200 mt-1 font-mono">{successRate}%</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{successfulPayments} of {totalPayments} captured</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Failure Rate: Rose Tint */}
            <Card className="border-rose-300 dark:border-rose-800/60 bg-gradient-to-br from-[#FFF5F5] to-[#FFE8E8] dark:from-[#3B1219] dark:to-[#2A0C12] rounded-2xl shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Failure Rate</p>
                    <p className="text-2xl font-serif font-extrabold text-rose-700 dark:text-rose-200 mt-1 font-mono">{failureRate}%</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">{failedPayments} failed attempts</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-200/60 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                    <XCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue at Risk: Amber Tint */}
            <Card className="border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-[#FFFDF0] to-[#FEF9C3] dark:from-[#3B2E0A] dark:to-[#261E05] rounded-2xl shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Revenue at Risk</p>
                    <p className="text-2xl font-serif font-extrabold text-amber-700 dark:text-amber-200 mt-1 font-mono">
                      {formatCurrency(totalFailedAmount, currencySymbol)}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">From failed transactions</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200/60 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Potentially Recoverable: Sky Tint */}
            <Card className="border-sky-300 dark:border-sky-800/60 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#0A2E3B] dark:to-[#051C26] rounded-2xl shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">Potentially Recoverable</p>
                    <p className="text-2xl font-serif font-extrabold text-sky-700 dark:text-sky-200 mt-1 font-mono">
                      {formatCurrency(potentiallyRecoverableAmount, currencySymbol)}
                    </p>
                    <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">{recoveryOpportunityPercent}% opportunity</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-200/60 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                    <RefreshCcw className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Engine: Red Tint */}
          <Card className="border-red-300 dark:border-red-800/60 bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] dark:from-[#2D1216] dark:to-[#1F0A0E] rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-red-200 dark:border-red-900/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <CardTitle className="text-base font-serif font-bold text-red-950 dark:text-red-100">
                    Anomaly & Spike Detection Engine
                  </CardTitle>
                  <CardDescription className="text-xs text-red-700 dark:text-red-300">
                    Evaluates recent 24h failure rate against 7-day historical baseline
                  </CardDescription>
                </div>
              </div>

              {hasSufficientDataForAnomaly && (
                <Badge
                  className={cn(
                    'text-[10px] font-extrabold uppercase px-3 py-1',
                    anomalySeverity === 'CRITICAL' && 'bg-red-600 text-white',
                    anomalySeverity === 'HIGH' && 'bg-[#E9785B] text-white',
                    anomalySeverity === 'MEDIUM' && 'bg-[#D8A84E] text-white',
                    anomalySeverity === 'LOW' && 'bg-[#72B8A5] text-white'
                  )}
                >
                  {anomalySeverity} Severity Alert
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {!hasSufficientDataForAnomaly ? (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/80 dark:bg-[#1F0A0E]/80 border border-red-200 dark:border-red-900/60 text-xs">
                  <Info className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-red-950 dark:text-red-100">Insufficient Baseline Data</p>
                    <p className="text-red-800 dark:text-red-300 mt-0.5">
                      Minimum 3 recorded transactions required to calculate statistical anomaly baselines. Currently evaluated on {totalPayments} transaction(s).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#1F0A0E]/80 border border-red-200 dark:border-red-900/60">
                    <p className="font-bold text-red-950 dark:text-red-100 text-sm mb-1">{spikeInfo?.spikeNote}</p>
                    <div className="grid grid-cols-3 gap-3 pt-2 font-mono text-center">
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200">
                        <span className="text-[10px] text-red-700 dark:text-red-300 block">Recent 24h Rate</span>
                        <span className="font-bold text-red-950 dark:text-red-100 text-sm block">{spikeInfo?.recentFailureRate}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200">
                        <span className="text-[10px] text-red-700 dark:text-red-300 block">7-Day Avg Rate</span>
                        <span className="font-bold text-red-950 dark:text-red-100 text-sm block">{spikeInfo?.sevenDayAvgFailureRate}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200">
                        <span className="text-[10px] text-red-700 dark:text-red-300 block">Comparison Ratio</span>
                        <span className="font-bold text-red-600 dark:text-red-400 text-sm block">{spikeInfo?.ratio}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Impact & Recovery: Fuchsia Tint */}
            <Card className="border-fuchsia-300 dark:border-fuchsia-800/60 bg-gradient-to-br from-[#FDF4FF] to-[#FAE8FF] dark:from-[#2D143B] dark:to-[#1D0A28] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-fuchsia-950 dark:text-fuchsia-100">
                  Revenue Impact & Recovery Analysis
                </CardTitle>
                <CardDescription className="text-xs text-fuchsia-700 dark:text-fuchsia-300">
                  Breakdown of revenue loss and recoverable recovery opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-fuchsia-800 dark:text-fuchsia-300">Potentially Recoverable Revenue</span>
                    <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrency(potentiallyRecoverableAmount, currencySymbol)}</span>
                  </div>
                  <div className="h-2 w-full bg-fuchsia-200/60 dark:bg-fuchsia-950/60 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${recoveryOpportunityPercent}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-fuchsia-800 dark:text-fuchsia-300">Non-Recoverable Loss</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-rose-400">{formatCurrency(nonRecoverableAmount, currencySymbol)}</span>
                  </div>
                  <div className="h-2 w-full bg-fuchsia-200/60 dark:bg-fuchsia-950/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${totalFailedAmount > 0 ? ((nonRecoverableAmount / totalFailedAmount) * 100).toFixed(1) : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Risk: Blue Tint */}
            <Card className="border-blue-300 dark:border-blue-800/60 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-[#0F2942] dark:to-[#0A1A2B] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-blue-950 dark:text-blue-100">
                  Payment Method Risk Intelligence
                </CardTitle>
                <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
                  Failure distribution and risk identification by payment channel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {paymentMethods.length === 0 ? (
                  <p className="text-center text-blue-700 dark:text-blue-300 py-8">No payment method failure data recorded.</p>
                ) : (
                  paymentMethods.map((m) => (
                    <div key={m.method} className="p-3 rounded-xl bg-white/80 dark:bg-[#0A1A2B]/80 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-950 dark:text-blue-100">{m.method}</span>
                          {highestRiskMethod?.method === m.method && m.failureRate > 0 && (
                            <Badge className="bg-rose-500 text-white text-[9px] font-bold">Highest Risk</Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300">
                          {m.failedCount} failed out of {m.totalCount} attempts
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm font-mono text-blue-950 dark:text-blue-100 block">
                          {m.failureRate}%
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">Failure Rate</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: SPENDING & FINANCIAL ANALYTICS (DISTINCT COLOR CARDS)             */}
      {/* ========================================================================= */}
      {activeTab === 'spending' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Avg Daily Spend: Indigo Tint */}
            <Card className="border-indigo-300 dark:border-indigo-800/60 bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] dark:from-[#171E3B] dark:to-[#0E1328] rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Avg. Daily Spend</p>
                    <p className="text-2xl font-serif font-extrabold text-indigo-950 dark:text-indigo-100 mt-1 font-mono">{formatCurrency(avgDailySpend, currencySymbol)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardContent>
            </Card>

            {/* Week vs Last Week: Pink Tint */}
            <Card className="border-pink-300 dark:border-pink-800/60 bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3] dark:from-[#3B1428] dark:to-[#260B19] rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-pink-800 dark:text-pink-300 uppercase tracking-wider">Week vs Last Week</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-2xl font-serif font-extrabold text-pink-950 dark:text-pink-100 font-mono">{formatCurrency(weeklySpent, currencySymbol)}</p>
                      <span className={cn('flex items-center text-xs font-bold', weeklyChange > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                        {weeklyChange > 0 ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                        {Math.abs(weeklyChange).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projected Monthly: Teal Tint */}
            <Card className="border-teal-300 dark:border-teal-800/60 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] dark:from-[#0B2524] dark:to-[#061817] rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Projected Monthly</p>
                    <p className="text-2xl font-serif font-extrabold text-teal-950 dark:text-teal-100 mt-1 font-mono">
                      {formatCurrency(projectedMonthly, currencySymbol)}
                    </p>
                  </div>
                  {projectedMonthly > totalBudgeted ? (
                    <TrendingUp className="h-8 w-8 text-rose-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-emerald-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Transactions: Slate Tint */}
            <Card className="border-slate-300 dark:border-slate-700/60 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] dark:from-[#1E293B] dark:to-[#0F172A] rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total Transactions</p>
                    <p className="text-2xl font-serif font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono">{expenses.length}</p>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    This month: {expenses.filter((exp) => new Date(exp.date) >= startOfMonth(new Date())).length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Spending Chart: Amber Tint */}
            <Card className="border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#2B230A] dark:to-[#1C1605] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-amber-950 dark:text-amber-100">Daily Spending (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySpending}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-amber-200 dark:stroke-amber-900/40" />
                      <XAxis dataKey="day" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-lg border bg-card p-3 shadow-md">
                                <p className="text-sm font-medium">{data.fullDate}</p>
                                <p className="text-lg font-bold font-mono">{formatCurrency(data.amount, currencySymbol)}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="amount" fill="#D8A84E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Spending Trend: Emerald Tint */}
            <Card className="border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] dark:from-[#0B2B1B] dark:to-[#061C11] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-emerald-950 dark:text-emerald-100">Weekly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklySpending}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-emerald-200 dark:stroke-emerald-900/40" />
                      <XAxis dataKey="week" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-lg border bg-card p-3 shadow-md">
                                <p className="text-sm font-medium">{data.week}</p>
                                <p className="text-lg font-bold font-mono">{formatCurrency(data.amount, currencySymbol)}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#72B8A5" strokeWidth={2.5} dot={{ fill: '#72B8A5' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
