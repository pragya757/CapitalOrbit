'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, DownloadCloud, Sparkles } from 'lucide-react'
import type { RazorpayStatusResponse } from '@/lib/types'
import { useExpenses } from '@/components/expense-provider'
import { toast } from 'sonner'
import { RazorpayCheckoutDialog } from './razorpay-checkout-dialog'

export function RazorpayStatusCard() {
  const { refreshData } = useExpenses()
  const [status, setStatus] = useState<RazorpayStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    fetched: number
    imported: number
    skipped: number
  } | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<{
    processed: number
    categorized: number
    needsReview: number
  } | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/razorpay/status')
      if (res.ok) {
        const data: RazorpayStatusResponse = await res.json()
        setStatus(data)
      } else {
        setStatus({
          configured: false,
          mode: 'test',
          provider: 'razorpay',
          error: 'Failed to connect to status endpoint',
        })
      }
    } catch {
      setStatus({
        configured: false,
        mode: 'test',
        provider: 'razorpay',
        error: 'Network error checking status',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/razorpay/sync', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.success) {
        setSyncResult({
          fetched: data.fetched,
          imported: data.imported,
          skipped: data.skipped,
        })
        toast.success(`Razorpay Sync Complete: ${data.imported} imported, ${data.skipped} already existed.`)
        await refreshData()
      } else {
        toast.error(data.error || 'Failed to sync Razorpay transactions')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Network error syncing Razorpay transactions')
    } finally {
      setSyncing(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalyzeResult(null)
    try {
      const res = await fetch('/api/transactions/categorize', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.success) {
        setAnalyzeResult({
          processed: data.processed,
          categorized: data.categorized,
          needsReview: data.needsReview,
        })
        toast.success(`Transaction Intelligence: ${data.categorized} categorized, ${data.needsReview} need review.`)
        await refreshData()
      } else {
        toast.error(data.error || 'Failed to analyze transactions')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Network error analyzing transactions')
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <Card className="border-sky-300 dark:border-sky-800/60 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#0A2E3B] dark:to-[#051C26] rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Razorpay Integration & Intelligence</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStatus}
            disabled={loading || syncing || analyzing}
            title="Refresh status"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Payment gateway test mode configuration, ingestion, and AI transaction intelligence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {loading ? (
              <Badge variant="outline" className="animate-pulse">
                Checking...
              </Badge>
            ) : status?.configured ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Not Connected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mode:</span>
            <Badge variant="outline" className="uppercase tracking-wider font-semibold text-xs">
              Test Mode
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Provider:</span>
            <span className="text-sm font-semibold text-foreground">Razorpay</span>
          </div>
        </div>

        {status?.configured ? (
          <div className="space-y-3">
            <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Razorpay Test Mode & Transaction Intelligence Active</p>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Backend client is initialized for transaction ingestion and AI categorization.
                  {status.keyId && ` (Key ID: ${status.keyId})`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <RazorpayCheckoutDialog buttonText="Test Standard Checkout" defaultAmount={500} defaultDescription="Swiggy Food Order" />

              <Button
                onClick={handleSync}
                disabled={syncing || analyzing}
                variant="outline"
                className="gap-2 justify-start"
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4" />
                )}
                {syncing ? 'Syncing Transactions...' : 'Sync Razorpay Transactions'}
              </Button>

              <Button
                onClick={handleAnalyze}
                disabled={syncing || analyzing}
                variant="outline"
                className="gap-2 justify-start border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/50"
              >
                {analyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-violet-600" />
                ) : (
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                )}
                {analyzing ? 'Analyzing your transactions...' : 'Analyze Transactions'}
              </Button>

              {syncResult && (
                <p className="text-xs text-muted-foreground w-full">
                  <strong className="text-foreground">{syncResult.imported}</strong> new transactions imported,{' '}
                  <strong className="text-foreground">{syncResult.skipped}</strong> already existed.
                </p>
              )}

              {analyzeResult && (
                <p className="text-xs text-muted-foreground w-full">
                  Intelligence Run: <strong className="text-emerald-600 dark:text-emerald-400">{analyzeResult.categorized}</strong> categorized,{' '}
                  <strong className="text-amber-600 dark:text-amber-400">{analyzeResult.needsReview}</strong> need review.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Credentials Missing or Default Placeholder</p>
            <p className="mt-1">
              Add <code className="font-mono bg-background px-1 py-0.5 rounded">RAZORPAY_KEY_ID</code> and{' '}
              <code className="font-mono bg-background px-1 py-0.5 rounded">RAZORPAY_KEY_SECRET</code> to your{' '}
              <code className="font-mono bg-background px-1 py-0.5 rounded">.env</code> file to enable Test Mode transaction sync and intelligence.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
