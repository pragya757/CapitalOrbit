import type { FinancialDecisionRequest, DecisionType } from '../types'

/**
 * Natural language intent and entity parser.
 * Extracts decision type, monetary amounts, descriptions, percentages, and deadlines.
 */
export function parseNaturalLanguageQuery(query: string): FinancialDecisionRequest {
  if (!query || typeof query !== 'string') {
    return {
      type: 'PURCHASE',
      amount: 0,
      description: 'Unspecified Item',
      rawQuery: '',
    }
  }

  const cleanQuery = query.trim()
  const lower = cleanQuery.toLowerCase()

  // 1. Extract Amounts (Support ₹20,000, 20k, 1.5L, 1 lakh, etc.)
  let amount: number | undefined

  // Lakh match: 1.5L or 1 lakh
  const lakhMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|l\b)/i)
  if (lakhMatch) {
    amount = Math.round(parseFloat(lakhMatch[1]) * 100000)
  }

  // K match: 20k, 5k
  if (!amount) {
    const kMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b/i)
    if (kMatch) {
      amount = Math.round(parseFloat(kMatch[1]) * 1000)
    }
  }

  // Standard numeric match: ₹20,000 or ₹1,20,000 or 20000
  if (!amount) {
    const numMatch = lower.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,7})/i)
    if (numMatch) {
      amount = parseFloat(numMatch[1].replace(/,/g, ''))
    }
  }

  // 2. Extract Percentage Change (e.g. 20%)
  let percentageChange: number | undefined
  const percentMatch = lower.match(/([0-9]+(?:\.[0-9]+)?)\s*%/i)
  if (percentMatch) {
    percentageChange = parseFloat(percentMatch[1])
  }

  // 3. Extract Deadline (e.g. 6 months, 8 months)
  let deadline: string | undefined
  const deadlineMatch = lower.match(/in\s*([0-9]+)\s*(month|year|week)s?/i)
  if (deadlineMatch) {
    deadline = `${deadlineMatch[1]} ${deadlineMatch[2]}s`
  }

  // 4. Extract Description / Item Name
  let description = 'Expense Purchase'
  const forOnMatch = lower.match(/(?:on|for|buy|purchase|afford|a|an)\s+([a-z0-9\s]+?)(?:\?|\.|$|in\s|for\s|with\s)/i)
  if (forOnMatch && forOnMatch[1]) {
    const candidate = forOnMatch[1]
      .replace(/\b(can|i|spend|buy|afford|a|an|the|this|my|me)\b/gi, '')
      .trim()
    if (candidate.length > 1) {
      description = candidate
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  }

  // Fallback: match noun immediately after amount (e.g. ₹15,000 phone -> Phone)
  if (description === 'Expense Purchase' || description === '') {
    const afterAmountMatch = lower.match(/(?:[0-9,]+|k|lakh)\s+([a-z0-9]+)/i)
    if (afterAmountMatch && afterAmountMatch[1] && !['in', 'for', 'on', 'months', 'month', 'years', 'year', 'percent', '%'].includes(afterAmountMatch[1])) {
      description = afterAmountMatch[1].charAt(0).toUpperCase() + afterAmountMatch[1].slice(1)
    }
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
