import type { FinancialDecisionRequest, DecisionType } from '../types'

/**
 * Natural language intent and entity parser.
 * Robustly extracts decision type, monetary amounts (e.g. ₹20,000, 20000, 15k, 1.5L),
 * item descriptions, percentages, and deadlines.
 */
export function parseNaturalLanguageQuery(query: string): FinancialDecisionRequest {
  if (!query || typeof query !== 'string') {
    return {
      type: 'PURCHASE',
      amount: undefined,
      description: 'Purchase',
      rawQuery: '',
    }
  }

  const cleanQuery = query.trim()
  const lower = cleanQuery.toLowerCase()

  // 1. Extract Amounts (Support ₹20,000, 20000, 15k, 1.5L, 1 lakh, etc.)
  let amount: number | undefined

  // Lakh match: 1.5L or 1.5 lakh or 2 lakh
  const lakhMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|l\b)/i)
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1])
    if (!isNaN(val) && val > 0) {
      amount = Math.round(val * 100000)
    }
  }

  // K match: 20k, 15k, 5k
  if (!amount) {
    const kMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b/i)
    if (kMatch) {
      const val = parseFloat(kMatch[1])
      if (!isNaN(val) && val > 0) {
        amount = Math.round(val * 1000)
      }
    }
  }

  // Standard numeric match with optional currency symbol or commas: ₹20,000 / 20000 / ₹15,000 / 50000 / ₹50,000
  if (!amount) {
    const numMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,7})/i)
    if (numMatch) {
      const parsedVal = parseFloat(numMatch[1].replace(/,/g, ''))
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal
      }
    }
  }

  // Fallback regex for simple digits in query (e.g., 20000)
  if (!amount) {
    const simpleDigitMatch = lower.match(/([0-9]+)/)
    if (simpleDigitMatch) {
      const parsedVal = parseFloat(simpleDigitMatch[1])
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal
      }
    }
  }

  // 2. Extract Percentage Change (e.g. 20%)
  let percentageChange: number | undefined
  const percentMatch = lower.match(/([0-9]+(?:\.[0-9]+)?)\s*%/i)
  if (percentMatch) {
    const pVal = parseFloat(percentMatch[1])
    if (!isNaN(pVal)) {
      percentageChange = pVal
    }
  }

  // 3. Extract Deadline (e.g. 6 months, 8 months)
  let deadline: string | undefined
  const deadlineMatch = lower.match(/in\s*([0-9]+)\s*(month|year|week)s?/i)
  if (deadlineMatch) {
    deadline = `${deadlineMatch[1]} ${deadlineMatch[2]}s`
  }

  // 4. Extract Description / Item Name
  let description = 'Purchase'

  // Pattern A: "on a phone", "for a laptop", "on laptop", "for phone"
  const onForMatch = lower.match(/(?:on|for)\s+(?:a|an|the)?\s*([a-z0-9\s]+?)(?:\?|\.|$)/i)
  if (onForMatch && onForMatch[1]) {
    const candidate = onForMatch[1].trim()
    if (candidate && !/^[0-9,₹\s]+$/.test(candidate) && !['in', 'for', 'on', 'months', 'month'].includes(candidate)) {
      description = candidate
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  }

  // Pattern B: "a ₹50,000 laptop" or "₹20,000 laptop" or "20000 laptop"
  if (description === 'Purchase') {
    const afterAmountNoun = lower.match(/(?:₹|rs\.?|inr)?\s*[0-9,k\.]+\s+(?:a|an|the)?\s*([a-z0-9]+)/i)
    if (afterAmountNoun && afterAmountNoun[1]) {
      const candidate = afterAmountNoun[1].trim()
      if (candidate && !['in', 'for', 'on', 'months', 'month', 'years', 'year', 'percent', '%', 'laptop', 'phone'].includes(candidate)) {
        description = candidate.charAt(0).toUpperCase() + candidate.slice(1)
      } else if (candidate === 'laptop' || candidate === 'phone') {
        description = candidate.charAt(0).toUpperCase() + candidate.slice(1)
      }
    }
  }

  // Pattern C: "afford a ₹50,000 laptop"
  if (description === 'Purchase') {
    const buyMatch = lower.match(/(?:buy|purchase|afford|spend)\s+(?:a|an|the)?\s*(?:₹|rs\.?|inr)?\s*[0-9,k\.]*\s*([a-z0-9]+)/i)
    if (buyMatch && buyMatch[1]) {
      const candidate = buyMatch[1].trim()
      if (candidate && !['can', 'i', 'spend', 'buy', 'afford', 'a', 'an', 'the', 'my', 'me', 'how', 'much'].includes(candidate) && !/^[0-9,₹\s]+$/.test(candidate)) {
        description = candidate.charAt(0).toUpperCase() + candidate.slice(1)
      }
    }
  }

  // Sanitize description if it accidentally contains digits or currency symbols
  if (!description || /^[0-9,₹\s]+$/.test(description)) {
    description = 'Purchase'
  }

  // 5. Determine Decision Intent Type
  let type: DecisionType = 'PURCHASE'

  if (lower.includes('income') && (lower.includes('fall') || lower.includes('drop') || lower.includes('reduce') || lower.includes('cut') || lower.includes('shock') || percentageChange !== undefined)) {
    type = 'INCOME_SHOCK'
    if (!percentageChange) percentageChange = 20
  } else if (lower.includes('expense') && (lower.includes('increase') || lower.includes('rise') || lower.includes('extra') || lower.includes('add') || lower.includes('grow'))) {
    type = 'EXPENSE_SHOCK'
  } else if (lower.includes('goal') || lower.includes('target') || (lower.includes('reach') && deadline)) {
    type = 'GOAL_DEADLINE'
  } else if (lower.includes('what if') || lower.includes('what happens')) {
    type = 'SCENARIO'
  } else if (lower.includes('afford')) {
    type = 'AFFORDABILITY'
  }

  return {
    type,
    amount,
    targetAmount: amount,
    description,
    percentageChange,
    deadline,
    rawQuery: cleanQuery,
  }
}
