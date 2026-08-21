import Tesseract from 'tesseract.js'
import { detectCategory } from '@/lib/constants'

export interface ParsedReceipt {
  amount: number | null
  date: string | null
  merchantName: string
  category: string
  rawText: string
}

export async function processReceiptImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<ParsedReceipt> {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress * 100)
      }
    },
  })

  // Extract Text
  const { data: { text } } = await worker.recognize(imageFile)
  await worker.terminate()

  return parseReceiptData(text)
}

export function parseReceiptData(text: string): ParsedReceipt {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  let amount: number | null = null
  let date: string | null = null
  let merchantName = 'Unknown Merchant'

  // If we have lines, assume the first non-empty prominent line might be the merchant
  if (lines.length > 0) {
    // Avoid picking up dates or times as merchant names
    const potentialMerchants = lines.filter(l => 
      l.length > 2 && 
      !l.match(/^\d/) && 
      !l.toLowerCase().includes('total') &&
      !l.toLowerCase().includes('tax')
    )
    if (potentialMerchants.length > 0) {
      // Simplify to first line that looks like a name
      merchantName = potentialMerchants[0]
    }
  }

  // Find Total Amount
  // Look for "Total", "Amount", "Balance" followed by $ and numbers, or just extreme numbers at the bottom
  const amountRegex = /(?:total|amount|due|balance|pay)[^\d]*?\$?\s*?(\d+[\.,]\d{2})/i
  const amountMatch = text.match(amountRegex)
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(',', '.'))
  } else {
    // Fallback: look for the largest currency-like number
    const allAmounts = [...text.matchAll(/\$?\s*?(\d+[\.,]\d{2})/g)]
    if (allAmounts.length > 0) {
      const parsedAmounts = allAmounts.map(m => parseFloat(m[1].replace(',', '.')))
      amount = Math.max(...parsedAmounts)
    }
  }

  // Find Date
  // Looking for common date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const dateRegex = /(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/
  const dateMatch = text.match(dateRegex)
  if (dateMatch && dateMatch[1]) {
    // Attempt to format it safely to YYYY-MM-DD
    const rawDate = dateMatch[1].replace(/\./g, '-')
    const parsedDate = new Date(rawDate)
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate.toISOString().split('T')[0]
    }
  }

  // If no date found, default to today
  if (!date) {
    date = new Date().toISOString().split('T')[0]
  }

  // Attempt auto-categorization based on the raw text
  const category = detectCategory(merchantName + ' ' + text)

  return {
    amount,
    date,
    merchantName,
    category,
    rawText: text,
  }
}
