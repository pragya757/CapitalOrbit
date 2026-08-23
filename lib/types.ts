export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  description: string
  date: string
  paymentMethod: PaymentMethod | string
  isRecurring: boolean
  recurringFrequency?: RecurringFrequency
  source?: 'manual' | 'razorpay' | string
  status?: 'captured' | 'authorized' | 'failed' | 'refunded' | string
  razorpayPaymentId?: string
  razorpayOrderId?: string
  email?: string
  contact?: string
  merchantName?: string
  categorySource?: 'rule' | 'ai' | 'learned' | 'manual' | string
  categoryConfidence?: number
  categoryReason?: string
}

export interface CategorizationResult {
  category: string
  merchantName: string
  cleanDescription: string
  confidence: number
  confidenceTier: 'high' | 'medium' | 'low'
  source: 'rule' | 'ai' | 'learned' | 'manual'
  reason: string
}

export interface Income {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  isRecurring: boolean
  recurringFrequency?: RecurringFrequency
}

export interface RecurringRule {
  id: string
  type: 'expense' | 'income'
  amount: number
  category?: ExpenseCategory
  source?: string
  description: string
  paymentMethod?: PaymentMethod
  frequency: RecurringFrequency
  nextDate: string
  isActive: boolean
}

export type DefaultCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'education'
  | 'health'
  | 'other'

// Allows both default and custom category strings
export type ExpenseCategory = DefaultCategory | (string & {})

export interface CategoryItem {
  id: string
  name: string
  isCustom: boolean
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly'

export interface Budget {
  id: string
  category: ExpenseCategory
  limit: number
  spent: number
  period: 'weekly' | 'monthly'
}

export interface User {
  id: string
  name: string
  email: string
  monthlyBudget: number
  currency: string
}

// Razorpay Integration Types & Data Models
export type RazorpayPaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'failed' | (string & {})

export interface RazorpayRefundInfo {
  id: string
  amount: number
  currency?: string
  paymentId: string
  status: string
  createdAt: number
}

export interface RazorpayPayment {
  id: string // Razorpay payment ID (e.g. pay_...)
  entity?: 'payment'
  orderId?: string // Razorpay order ID (e.g. order_...)
  amount: number // Amount in smallest currency unit (e.g. paise) or main unit
  currency: string
  status: RazorpayPaymentStatus
  method: string // e.g. 'card', 'upi', 'netbanking', 'wallet'
  description?: string
  createdAt: number // Unix timestamp
  email?: string // Customer email where safely available
  contact?: string // Customer phone where safely available
  notes?: Record<string, any>
  fee?: number
  tax?: number
  errorCode?: string
  errorDescription?: string
  refundStatus?: 'null' | 'partial' | 'full' | string
  amountRefunded?: number
  refunds?: RazorpayRefundInfo[]
}

export interface RazorpayOrder {
  id: string // Razorpay order ID (e.g. order_...)
  entity?: 'order'
  amount: number
  amountPaid: number
  amountDue: number
  currency: string
  receipt?: string
  status: 'created' | 'attempted' | 'paid' | (string & {})
  attempts: number
  notes?: Record<string, any>
  createdAt: number
}

export interface RazorpayStatusResponse {
  configured: boolean
  mode: 'test'
  provider: 'razorpay'
  keyId?: string // Safe indicator (e.g., rzp_test_****)
  error?: string
}

export interface ObligationBreakdownItem {
  name: string
  amount: number
  type: 'known' | 'estimated'
  frequency?: string
}

export interface GoalBreakdownItem {
  goalId: string
  name: string
  targetAmount: number
  savedAmount: number
  deadline?: string
  requiredMonthlyContribution: number
}

export interface ScoreBreakdown {
  cashCoverage: number
  spendingStability: number
  goalAffordability: number
  safetyReserveCoverage: number
}

export interface FinancialHealthSummary {
  estimatedAvailableBalance: number
  monthlyIncome: number
  monthlySpending: number
  monthlyEssentialExpenses: number
  upcomingObligations: number
  goalCommitments: number
  safetyReserve: number
  safeToSpend: number
  isOverCommitted: boolean
  shortfall: number
  healthScore: number
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  savingsRate: number
  dataConfidence: 'high' | 'medium' | 'low'
  confidenceNote: string
  scoreBreakdown: ScoreBreakdown
  obligationsBreakdown: ObligationBreakdownItem[]
  goalBreakdown: GoalBreakdownItem[]
  hasSufficientData: boolean
}

// AI Financial Decision Engine Types
export type DecisionType =
  | 'PURCHASE'
  | 'GOAL'
  | 'AFFORDABILITY'
  | 'SCENARIO'
  | 'INCOME_SHOCK'
  | 'EXPENSE_SHOCK'
  | 'GOAL_DEADLINE'

export interface FinancialDecisionRequest {
  type: DecisionType
  amount?: number
  description?: string
  goalId?: string
  targetAmount?: number
  deadline?: string
  percentageChange?: number
  rawQuery?: string
}

export interface DecisionAlternative {
  title: string
  optionType: 'WAIT' | 'LOWER_COST' | 'SAVE_MORE' | 'ADJUST_GOAL'
  description: string
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH'
  financialImpactNote: string
  calculatedSavingsOrDelay: string
}

export interface GoalImpactDetails {
  affected: boolean
  goalName?: string
  daysDelayed?: number
  previousCompletionMonths?: number
  newCompletionMonths?: number
  previousRequiredMonthlyContribution?: number
  newRequiredMonthlyContribution?: number
  note?: string
}

export interface FinancialDecisionResult {
  id?: string
  decision: 'SAFE' | 'CAUTION' | 'NOT_RECOMMENDED'
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  requestedAmount?: number
  description?: string
  safeToSpend: number
  remainingSafeToSpend: number
  goalImpact?: GoalImpactDetails
  obligationImpact?: {
    affected: boolean
    reserveViolation: boolean
    notes?: string
  }
  reason: string
  explanation: string
  keyFactors: string[]
  alternatives: DecisionAlternative[]
  confidence: number
  dataConfidence: 'high' | 'medium' | 'low'
  confidenceNote: string
  createdAt?: string
}

// CapitalOrbit AI Merchant Copilot Types
export type CopilotIntent =
  | 'PAYMENT_FAILURES'
  | 'REVENUE_RISK'
  | 'FAILURE_SPIKE'
  | 'PAYMENT_METHOD_ANALYSIS'
  | 'FINANCIAL_HEALTH'
  | 'SPENDING_ANALYSIS'
  | 'CASH_FLOW'
  | 'FORECAST'
  | 'FINANCIAL_DECISION'
  | 'GOAL_ANALYSIS'
  | 'FINANCIAL_SUMMARY'
  | 'REVENUE_RECOVERY'
  | 'UNKNOWN'

export interface CopilotMetricItem {
  label: string
  value: string
}

export interface CopilotEvidenceItem {
  label: string
  value: string
  source: string
}

export interface CopilotResponse {
  success: boolean
  intent: CopilotIntent
  answer: string
  confidence: number
  metrics?: CopilotMetricItem[]
  evidence?: CopilotEvidenceItem[]
  recommendations?: string[]
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  disclaimer?: string
}


