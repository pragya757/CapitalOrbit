'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard, ShoppingBag, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useExpenses } from '@/components/expense-provider'
import { toast } from 'sonner'

interface RazorpayCheckoutDialogProps {
  defaultAmount?: number
  defaultDescription?: string
  buttonText?: string
  variant?: 'default' | 'outline' | 'secondary'
}

declare global {
  interface Window {
    Razorpay: any
  }
}

/**
 * Loads the official Razorpay Checkout SDK script dynamically.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function RazorpayCheckoutDialog({
  defaultAmount = 500,
  defaultDescription = 'Test Payment',
  buttonText = 'Pay via Razorpay',
  variant = 'default',
}: RazorpayCheckoutDialogProps) {
  const { refreshData, user } = useExpenses()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [description, setDescription] = useState(defaultDescription)
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount < 1) {
      toast.error('Minimum payment amount is ₹1 (100 paise)')
      return
    }

    setLoading(true)

    try {
      // 1. Ensure Razorpay Checkout SDK is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Failed to load Razorpay Checkout SDK. Please check your network connection.')
        setLoading(false)
        return
      }

      // 2. Call backend /api/create-order
      const amountInPaise = Math.round(numericAmount * 100)
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          description,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to create Razorpay payment order.')
        setLoading(false)
        return
      }

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.keyId || '',
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'CapitalOrbit',
        description: description || 'CapitalOrbit Standard Checkout Payment',
        image: '/icon.png',
        order_id: data.order_id,
        prefill: {
          name: user.name || 'CapitalOrbit User',
          email: user.email || 'user@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#7c3aed',
        },
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) {
          // 4. Send signature to backend /api/verify-payment
          toast.loading('Verifying payment signature...')
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                description,
                amount: numericAmount,
              }),
            })

            const verifyData = await verifyRes.json()

            if (verifyRes.ok && verifyData.success) {
              toast.dismiss()
              toast.success(`Payment Success! ID: ${response.razorpay_payment_id}`)
              await refreshData()
              setOpen(false)
            } else {
              toast.dismiss()
              toast.error(verifyData.error || 'Signature verification failed! Payment not recorded.')
            }
          } catch (err: any) {
            toast.dismiss()
            toast.error(err?.message || 'Network error verifying payment signature.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment window closed by user.')
            setLoading(false)
          },
        },
      }

      // 5. Open Razorpay Checkout modal
      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment Failed: ${response.error?.description || 'Transaction declined'}`)
        setLoading(false)
      })

      rzp.open()
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred launching checkout.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-2 font-semibold">
          <CreditCard className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Razorpay Standard Checkout</DialogTitle>
              <DialogDescription className="text-xs">
                Test mode instant payment & signature verification
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Razorpay Test Mode Active</p>
              <p className="text-[11px] mt-0.5 opacity-90">
                Payments are verified with HMAC-SHA256 signatures and automatically recorded as transactions in CapitalOrbit.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Amount (₹)</label>
            <Input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description / Merchant</label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Swiggy Food Order or Electronics Purchase"
              className="h-10 text-sm"
            />
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading || !amount || parseFloat(amount) < 1}
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 text-sm shadow-md mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {loading ? 'Opening Checkout...' : `Pay ₹${amount || 0} via Razorpay`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
