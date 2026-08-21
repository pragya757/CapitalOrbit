import { ReceiptScanner } from '@/components/scan/receipt-scanner'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Scan Receipt | CapitalOrbit',
  description: 'Auto-extract expense details magically via OCR.',
}

export default async function ScanRoute() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Receipt Scanner</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload an image of your receipt and we'll automatically extract the amount, date, and category.
        </p>
      </div>
      <ReceiptScanner />
    </div>
  )
}
