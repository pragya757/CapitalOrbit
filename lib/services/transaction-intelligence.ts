import { PrismaClient } from '@prisma/client'
import type { Expense, CategorizationResult } from '../types'
import { getCategoryLabel } from '../constants'

const prisma = new PrismaClient()

/**
 * Extracts and cleans raw merchant names from transaction descriptions or metadata.
 * Example: "order_8472 SWIGGY PAYMENT PVT LTD" -> "Swiggy"
 */
export function extractMerchantName(description: string, rawPayment?: any): string {
  if (!description && !rawPayment) return 'Unknown Merchant'

  let text = description || rawPayment?.description || rawPayment?.notes?.merchant || ''

  // If description has order_... prefix or pay_... prefix, strip it
  text = text.replace(/order_[a-zA-Z0-9_-]+/gi, '').replace(/pay_[a-zA-Z0-9_-]+/gi, '')
  text = text.replace(/(UPI|POS|NEFT|IMPS|RTGS)\/[0-9]+\//gi, '')

  // Remove common noisy corporate suffixes
  text = text
    .replace(/\b(PVT LTD|PRIVATE LIMITED|LIMITED|LTD|ONLINE|PAYMENT|BILLDESK|GATEWAY|STORE)\b/gi, '')
    .trim()

  // Clean up extra spaces or punctuation (including slashes)
  text = text.replace(/^[/\s.:;,-]+|[/\s.:;,-]+$/g, '').trim()

  if (!text) {
    if (rawPayment?.notes?.merchant) return rawPayment.notes.merchant
    return 'Unknown Merchant'
  }

  // Capitalize title-case
  return text
    .split(/\s+/)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Deterministic rules dictionary mapping normalized merchant/description keywords to categories.
 */
const DETERMINISTIC_PATTERNS: Array<{
  keywords: string[]
  category: string
  label: string
  confidence: number
  reason: string
}> = [
  {
    keywords: ['swiggy', 'zomato', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'subway', 'pizza', 'burger', 'restaurant', 'cafe', 'diner', 'food'],
    category: 'food',
    label: 'Food & Dining',
    confidence: 0.96,
    reason: "Matched food & dining merchant pattern",
  },
  {
    keywords: ['blinkit', 'zepto', 'bigbasket', 'dmart', 'grofers', 'grocery', 'groceries', 'supermarket', 'instamart'],
    category: 'groceries',
    label: 'Groceries',
    confidence: 0.94,
    reason: "Matched grocery merchant pattern",
  },
  {
    keywords: ['uber', 'ola', 'rapido', 'metro', 'irctc', 'redbus', 'petrol', 'diesel', 'fuel', 'cab', 'taxi', 'hpcl', 'bpcl', 'iocl'],
    category: 'transport',
    label: 'Transport',
    confidence: 0.94,
    reason: "Matched transport merchant pattern",
  },
  {
    keywords: ['flight', 'indigo', 'air india', 'spicejet', 'akasa', 'make my trip', 'makemytrip', 'goibibo', 'cleartrip', 'hotel', 'airbnb'],
    category: 'travel',
    label: 'Travel',
    confidence: 0.94,
    reason: "Matched travel/airline merchant pattern",
  },
  {
    keywords: ['amazon', 'flipkart', 'myntra', 'meesho', 'nykaa', 'ajio', 'zara', 'h&m', 'shopping', 'mall'],
    category: 'shopping',
    label: 'Shopping',
    confidence: 0.92,
    reason: "Matched shopping merchant pattern",
  },
  {
    keywords: ['croma', 'reliance digital', 'apple', 'samsung', 'electronics', 'gadget', 'laptop', 'headphone'],
    category: 'electronics',
    label: 'Electronics',
    confidence: 0.92,
    reason: "Matched electronics merchant pattern",
  },
  {
    keywords: ['coursera', 'udemy', 'edx', 'skillshare', 'unacademy', 'byjus', 'tuition', 'school', 'college', 'university', 'books', 'exam'],
    category: 'education',
    label: 'Education',
    confidence: 0.95,
    reason: "Matched education provider pattern",
  },
  {
    keywords: ['netflix', 'spotify', 'youtube', 'prime video', 'hotstar', 'hbo', 'disney', 'apple music', 'saavn', 'gaana'],
    category: 'subscriptions',
    label: 'Subscriptions',
    confidence: 0.96,
    reason: "Matched recurring digital subscription pattern",
  },
  {
    keywords: ['movie', 'cinema', 'bookmyshow', 'game', 'gaming', 'steam', 'playstation', 'xbox', 'concert'],
    category: 'entertainment',
    label: 'Entertainment',
    confidence: 0.93,
    reason: "Matched entertainment venue/platform pattern",
  },
  {
    keywords: ['apollo', 'pharmacy', '1mg', 'practo', 'hospital', 'doctor', 'clinic', 'medplus', 'health', 'medicine'],
    category: 'health',
    label: 'Healthcare',
    confidence: 0.94,
    reason: "Matched healthcare provider pattern",
  },
  {
    keywords: ['airtel', 'jio', 'vi', 'vodafone', 'bescom', 'tata play', 'electricity', 'broadband', 'wifi', 'utility', 'recharge'],
    category: 'utilities',
    label: 'Bills & Utilities',
    confidence: 0.94,
    reason: "Matched utility provider pattern",
  },
  {
    keywords: ['salon', 'spa', 'barber', 'makeup', 'skincare', 'dermat', 'grooming'],
    category: 'personal_care',
    label: 'Personal Care',
    confidence: 0.91,
    reason: "Matched personal care merchant pattern",
  },
  // Business patterns
  {
    keywords: ['aws', 'gcp', 'azure', 'github', 'vercel', 'slack', 'notion', 'figma', 'google workspace', 'zoom', 'openai', 'anthropic', 'saas'],
    category: 'software',
    label: 'Software & SaaS',
    confidence: 0.95,
    reason: "Matched software & SaaS service pattern",
  },
  {
    keywords: ['google ads', 'facebook ads', 'meta ads', 'linkedin ads', 'marketing', 'agency', 'adwords'],
    category: 'marketing',
    label: 'Marketing',
    confidence: 0.95,
    reason: "Matched marketing/advertising provider pattern",
  },
  {
    keywords: ['delhivery', 'shiprocket', 'bluedart', 'fedex', 'dhl', 'logistics', 'courier', 'freight'],
    category: 'logistics',
    label: 'Logistics',
    confidence: 0.93,
    reason: "Matched logistics/shipping provider pattern",
  },
  {
    keywords: ['payroll', 'salary', 'stipend', 'wages'],
    category: 'salaries',
    label: 'Salaries',
    confidence: 0.92,
    reason: "Matched salary/payroll pattern",
  },
]

/**
 * 3-Layer Hybrid Intelligence Classifier
 * 
 * Layer 1: Learned user merchant preferences (memory map)
 * Layer 2: Deterministic keyword rules & patterns
 * Layer 3: Heuristic / AI contextual provider fallback
 */
export function categorizeTransaction(
  expense: Partial<Expense>,
  learnedPreferences?: Record<string, string>
): CategorizationResult {
  const description = expense.description || ''
  const merchantName = expense.merchantName || extractMerchantName(description)
  const lowerMerchant = merchantName.toLowerCase()
  const lowerDesc = description.toLowerCase()

  // Layer 1: Check User Learned Preferences (Highest Priority: 0.98 confidence)
  if (learnedPreferences) {
    const matchedPrefKey = Object.keys(learnedPreferences).find(
      (m) => m.toLowerCase() === lowerMerchant || lowerDesc.includes(m.toLowerCase())
    )

    if (matchedPrefKey) {
      const learnedCategory = learnedPreferences[matchedPrefKey]
      return {
        category: learnedCategory,
        merchantName,
        cleanDescription: description,
        confidence: 0.98,
        confidenceTier: 'high',
        source: 'learned',
        reason: `Matched learned preference for '${matchedPrefKey}' (${getCategoryLabel(learnedCategory)})`,
      }
    }
  }

  // Layer 2: Deterministic Rules & Merchant Patterns
  for (const pattern of DETERMINISTIC_PATTERNS) {
    const hasMatch = pattern.keywords.some(
      (kw) => lowerMerchant.includes(kw) || lowerDesc.includes(kw)
    )

    if (hasMatch) {
      const confidenceTier = pattern.confidence >= 0.85 ? 'high' : pattern.confidence >= 0.6 ? 'medium' : 'low'
      return {
        category: pattern.category,
        merchantName,
        cleanDescription: description,
        confidence: pattern.confidence,
        confidenceTier,
        source: 'rule',
        reason: `${pattern.reason} for '${merchantName}'`,
      }
    }
  }

  // Layer 3: AI / Heuristic Contextual Provider Fallback
  if (expense.amount && expense.amount > 50000) {
    return {
      category: 'electronics',
      merchantName,
      cleanDescription: description,
      confidence: 0.65,
      confidenceTier: 'medium',
      source: 'ai',
      reason: "High transaction amount heuristic inferred electronics or high-value purchase",
    }
  }

  // Low confidence fallback for ambiguous transactions
  return {
    category: 'Uncategorized',
    merchantName,
    cleanDescription: description,
    confidence: 0.45,
    confidenceTier: 'low',
    source: 'ai',
    reason: "Uncertain pattern match — Needs Review",
  }
}

/**
 * Persists a user's category correction into UserMerchantPreference for future sync learning.
 */
export async function saveUserMerchantPreference(
  userId: string,
  merchantName: string,
  category: string
): Promise<void> {
  const normalizedMerchant = merchantName.trim()
  if (!normalizedMerchant || normalizedMerchant === 'Unknown Merchant') return

  await prisma.userMerchantPreference.upsert({
    where: {
      userId_merchantName: {
        userId,
        merchantName: normalizedMerchant,
      },
    },
    update: {
      category,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      userId,
      merchantName: normalizedMerchant,
      category,
    },
  })
}

/**
 * Fetches all learned merchant preferences for a given user into a key-value record map.
 */
export async function getUserMerchantPreferencesMap(userId: string): Promise<Record<string, string>> {
  const preferences = await prisma.userMerchantPreference.findMany({
    where: { userId },
  })

  const map: Record<string, string> = {}
  for (const pref of preferences) {
    map[pref.merchantName] = pref.category
  }
  return map
}
