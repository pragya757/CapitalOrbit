# 💸 CapitalOrbit — Financial Intelligence & Expense Tracker

**CapitalOrbit** is a high-energy, personality-driven expense management platform designed for the aesthetic-obsessed and budget-conscious. It transforms the boring task of expense logging into a witty, animated, and interactive experience.

![CapitalOrbit App Screenshot](/api/placeholder/800/400)

## ✨ Core Features

### 🧠 Smart Reactions (The Sass Engine)
Not your average "Transaction Added" toast. SpendWise uses a context-aware reaction engine that gives you witty feedback based on:
- **Category**: Specific roasts or cheers for Food, Shopping, Transport, etc.
- **Amount**: Reacts differently to a ₹50 snack vs. a ₹5,000 "treat yourself" spree.
- **Streaks**: An AI-like escalation system that gets sassier the more you overspend in a row.

### 🛡️ Two-Layer Budgeting System
A bulletproof financial architecture to keep your savings safe:
- **Global Monthly Cap**: Set your ultimate spending goal for the month.
- **Category Allocations**: Assign specific sub-budgets for categories like Food or Entertainment.
- **Strict Validation**: The system prevents over-allocation with real-time warnings and "Safe-Locks" on savings.

### 📊 Aesthetic Analytics
Beautiful, high-refresh-rate charts colored precisely by your expense categories. 
- **Spending by Category**: Pie charts with category-locked persistent colors.
- **Daily & Weekly Trends**: Bar and Line graphs with `oklch` color accuracy (Tailwind 4).
- **Projections**: Smart estimates of your month-end total based on current daily averages.

### 🔐 Secure & Persistent Auth
- **JWT-Based Security**: Robust authentication for your financial data.
- **"Keep me signed in"**: 30-day session persistence so you don't have to re-login every morning.
- **Animated Auth UI**: A premium, motion-heavy login/signup flow with glassmorphism effects.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Database**: [Prisma ORM](https://www.prisma.io/) (SQLite/PostgreSQL)
- **Charts**: [Recharts](https://recharts.org/)
- **Components**: [Radix UI](https://www.radix-ui.com/) + Custom Glassmorphism System
- **Notifications**: [Sonner](https://sonner.stevenly.me/) (Adaptive Witty Toasts)

## 🚀 Getting Started

### 1. Prerequisite
- Node.js 18+
- A PostgreSQL database (or stay on SQLite for local development)

### 2. Installation
```bash
git clone https://github.com/your-repo/spendwise.git
cd spendwise
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db" # Or your Postgres URL
JWT_SECRET="your_ultra_secret_key"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run it!
```bash
npm run dev
```
The app will be live at `http://localhost:3000`.

---

## 💳 Razorpay Test Mode Integration Foundation

SpendWise includes an isolated server-side foundation for **Razorpay Test Mode** integration as a future automated payment/transaction data source.

### Overview of Implementation
- **Server Service**: `lib/razorpay.ts` provides a secure backend wrapper for Razorpay Node SDK to fetch payments and orders.
- **Data Models**: `lib/types.ts` defines TypeScript models for `RazorpayPayment`, `RazorpayOrder`, and `RazorpayRefundInfo`.
- **Status Endpoint**: `GET /api/razorpay/status` safely returns the current configuration status without exposing credentials.
- **Status UI**: Integrated status card in the Settings page (`/settings`) showing connection state.

### 1. How to Obtain Razorpay Test Mode API Keys
1. Sign up or log into your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Test Mode** using the mode toggle on the top navigation bar.
3. Navigate to **Account & Settings** → **API Keys** under Payment Gateway settings.
4. Click **Generate Test Key**.
5. Copy your **Key ID** (`rzp_test_...`) and **Key Secret**.

### 2. Environment Variables
Add the following to your `.env` file (refer to `.env.example`):
```env
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key"
```

> ⚠️ **Security Note**: `RAZORPAY_KEY_SECRET` is strictly used on the server side (`lib/razorpay.ts`) and is **never** exposed to the client or sent over API endpoints.

### 3. How to Start the Backend
Start the Next.js development server:
```bash
npm run dev
```

### 4. How to Verify & Synchronize Transactions
- **API Status Check**: Visit `http://localhost:3000/api/razorpay/status` or run `curl http://localhost:3000/api/razorpay/status`.
- **Transaction Sync Endpoint**:
  ```bash
  curl -X POST http://localhost:3000/api/razorpay/sync
  ```
  Expected Response:
  ```json
  {
    "success": true,
    "fetched": 25,
    "imported": 18,
    "skipped": 7
  }
  ```
- **Sync via UI**:
  1. Navigate to **Settings** (`http://localhost:3000/settings`).
  2. Click **Sync Razorpay Transactions**.
  3. SpendWise fetches payments from Razorpay Test Mode, normalizes them (converting paise to rupees, mapping status and payment method), and inserts new records into the `Expense` table.
  4. Deduplication is handled automatically via `@unique razorpayPaymentId`. Running sync multiple times skips existing transactions without creating duplicates.
  5. Open the **Expenses** page (`/expenses`) to view imported transactions marked with a `Source: Razorpay` badge.

---

## 🧠 AI Transaction Intelligence & Categorization

SpendWise features a **3-Layer Hybrid Intelligence Engine** that automatically extracts merchant names, classifies transactions into financial categories, assigns confidence scores, and continuously learns from user category edits.

### 3-Layer Categorization Architecture (`lib/services/transaction-intelligence.ts`)
1. **Layer 1 — User Learned Preferences (Highest Priority: 98% Confidence)**:
   - When a user manually edits a transaction category (e.g. changing `"Shopping"` to `"Education"` for merchant `"Amazon"`), SpendWise persists this preference in the `UserMerchantPreference` table.
   - Future syncs automatically apply the learned preference for that merchant.
2. **Layer 2 — Deterministic Pattern Matching (High Confidence: 85-96%)**:
   - Pattern matching for known merchant keywords (e.g., Swiggy/Zomato → Food & Dining, Uber/Ola → Transport, Netflix/Spotify → Subscriptions, Coursera/Udemy → Education, Amazon/Flipkart → Shopping, AWS/GitHub → Software & SaaS).
3. **Layer 3 — AI / Heuristic Provider Abstraction (Fallback)**:
   - Evaluates contextual signals (description tokens, payment method, high-value transaction heuristics).
   - Pluggable provider architecture allowing external LLM swap without code rewrites.

### Confidence Tiers
- **High Confidence (`≥ 85%`)**: Displayed with an emerald badge (e.g. `96% confidence`).
- **Medium Confidence (`60–84%`)**: Displayed with an amber badge (e.g. `70% confidence`).
- **Low Confidence (`< 60%`)**: Displayed with a red warning badge (`⚠ Needs Review`).

### Categorization API (`POST /api/transactions/categorize`)
- **Endpoint**:
  ```bash
  curl -X POST http://localhost:3000/api/transactions/categorize
  ```
- **Response**:
  ```json
  {
    "success": true,
    "processed": 25,
    "categorized": 21,
    "needsReview": 4
  }
  ```

---

## 🛡️ Financial Health & Safe-to-Spend Engine

SpendWise includes a transparent financial liquidity calculation engine (`lib/services/financial-health.ts`) that determines how much money a user can safely spend without risking upcoming obligations or active savings goals.

### Safe-to-Spend Baseline Formula
$$\text{Safe-to-Spend} = \text{Estimated Available Balance} - \text{Upcoming Obligations} - \text{Goal Commitments} - \text{Safety Reserve}$$

- **Estimated Available Balance**: Net balance calculated strictly from recorded income and captured expenses. Failed and refunded Razorpay payments are excluded.
- **Upcoming Obligations**: Computed from active recurring rules (`RecurringRule`) and historical recurring bills.
- **Goal Commitments**: Monthly contribution required to reach active savings goal targets (`(targetAmount - savedAmount) / remainingMonths`).
- **Safety Reserve**: Dynamic reserve buffer (default: 1 month of essential expenses or 15% fallback).
- **Over-Commitment Detection**: If `Safe-to-Spend < 0`, SpendWise displays 🔴 **You are currently over-committed** with the exact Shortfall amount and contributor breakdown.

### Deterministic Financial Health Score (0-100)
- **Cash Coverage (30%)**: Available balance vs target required liquidity.
- **Spending Stability (25%)**: Savings rate (`(Income - Expenses) / Income`).
- **Goal Affordability (25%)**: Discretionary cash flow vs required goal contributions.
- **Safety Reserve Coverage (20%)**: Liquid buffer vs target safety reserve.

### Financial Health API (`GET /api/financial-health`)
- **Endpoint**:
  ```bash
  curl http://localhost:3000/api/financial-health
  ```
- **Response**:
  ```json
  {
    "success": true,
    "financialHealth": {
      "estimatedAvailableBalance": 50000,
      "upcomingObligations": 6000,
      "goalCommitments": 5000,
      "safetyReserve": 7000,
      "safeToSpend": 32000,
      "isOverCommitted": false,
      "shortfall": 0,
      "monthlyIncome": 20000,
      "monthlySpending": 12000,
      "savingsRate": 40,
      "healthScore": 78,
      "riskLevel": "low",
      "dataConfidence": "medium",
      "confidenceNote": "Based on 1-2 months of transaction data"
    }
  }
  ```

> *Disclaimer*: SpendWise is a personal financial tracking tool, not regulated financial advice.

---

## 🚀 AI Financial Decision Engine ("Ask Before You Spend")

SpendWise features a **Deterministic Financial Decision Engine** (`lib/services/decision-engine.ts`) paired with natural-language parsing (`lib/services/decision-parser.ts`) to shift financial management from passive recording to active, cash-flow-aware decision intelligence.

### Deterministic Architecture (Not an LLM Chatbot)
All monetary calculations, goal delays, scenario simulations, and alternative recommendations are computed by **deterministic backend code** using actual SpendWise data. The AI/NLP layer parses intent and formats natural language synthesis, running 100% deterministically with heuristic regex fallbacks if no LLM key is configured.

```text
User Request ("Can I spend ₹20,000 on a laptop?")
                     ↓
  Intent & Entity Parser (extracts amount = 20000, description = 'laptop')
                     ↓
  Deterministic Decision Engine (evaluates against Safe-to-Spend & Goals)
                     ↓
  Scenario Simulation Engine (non-mutating DB state checks)
                     ↓
  Alternative Generator (Option A: Wait, Option B: Safe Limit, Option C: Save incrementally)
                     ↓
  Structured Response + Visual Decision Center UI
```

### Supported Decision Types
- **`PURCHASE`**: *"Can I spend ₹20,000 on a laptop?"*
- **`GOAL`**: *"Can I reach my ₹1,20,000 bike goal in 8 months?"*
- **`AFFORDABILITY`**: *"Can I afford a ₹50,000 purchase?"*
- **`SCENARIO`**: *"What happens if I spend ₹20,000 this month?"*
- **`INCOME_SHOCK`**: *"What if my income falls 20%?"*
- **`EXPENSE_SHOCK`**: *"What if my expenses increase by ₹5,000?"*
- **`GOAL_DEADLINE`**: *"I need ₹1 lakh in 6 months. Can I do it?"*

### Honest Alternatives & Financially Correct Goal Impact
- **Honest Thresholds**: Does not invent imaginary lower-cost products. Calculates exact upper budget limits: *"Consider a purchase under ₹X (your Safe-to-Spend limit)"*.
- **Financially Correct Goal Impact**: Purchases do not subtract from money already saved in a goal (`savedAmount`). Instead, the engine calculates how the purchase reduces **future monthly savings capacity**, showing how the required monthly contribution increases or how many days the completion date is delayed.

### Decision API (`POST /api/financial-decision`)
- **Endpoint**:
  ```bash
  curl -X POST http://localhost:3000/api/financial-decision \
    -H "Content-Type: application/json" \
    -d '{"query": "Can I spend ₹20,000 on a laptop?"}'
  ```
- **Response**:
  ```json
  {
    "success": true,
    "decision": "CAUTION",
    "riskLevel": "MODERATE",
    "requestedAmount": 20000,
    "safeToSpend": 32000,
    "remainingSafeToSpend": 12000,
    "goalImpact": {
      "affected": true,
      "goalName": "New Bike",
      "daysDelayed": 18
    },
    "reason": "The ₹20,000 purchase for 'Laptop' is technically possible, but tightens your liquidity margin.",
    "alternatives": [
      {
        "title": "Wait for Next Income Cycle",
        "optionType": "WAIT",
        "calculatedSavingsOrDelay": "Wait ~18 days"
      },
      {
        "title": "Limit Purchase to Safe-to-Spend Threshold",
        "optionType": "LOWER_COST",
        "calculatedSavingsOrDelay": "Max budget: ₹32,000"
      }
    ],
    "confidence": 0.95
  }
  ```

---

## ⚡ Transaction Failure Intelligence

CapitalOrbit features a **Deterministic Transaction Failure Intelligence Engine** (`lib/services/transaction-failure-intelligence.ts`) that analyzes failed Razorpay transactions to determine why payments failed, calculate revenue at risk, assess recovery eligibility, and identify failure patterns without requiring external LLM API calls.

### Architectural Flow (Deterministic Rule Engine)
```text
Razorpay Failed Payment Metadata (failureCode, failureReason, failureSource)
                               ↓
        Deterministic Failure Classification & Evidence Generator
                               ↓
         Severity & Recovery Eligibility Assessment Engine
                               ↓
   Revenue-at-Risk Calculation & Failure Pattern Aggregator
                               ↓
Structured JSON Endpoint (GET /api/analytics/transaction-failures) & UI Card
```

### Why Deterministic Classification is Used Instead of LLM
1. **Guaranteed Reliability**: Payment gateway error codes (e.g. `BAD_REQUEST_PAYMENT_ACCOUNT_INSUFFICIENT_BALANCE`) map strictly to standard financial categories without hallucination risk.
2. **Offline & Zero-Dependency Execution**: Works 100% reliably even if no OpenAI/Gemini API key is configured.
3. **100% Testability**: Deterministic rules allow exact unit test assertions across all failure scenarios.

### Failure Categories
- **`BANK_DECLINE`**: Transaction declined by the issuing bank (e.g. card block, do-not-honor).
- **`INSUFFICIENT_FUNDS`**: Customer account/card had insufficient balance.
- **`AUTHENTICATION_FAILURE`**: 3D-Secure or OTP verification failed.
- **`NETWORK_FAILURE`**: Connectivity drop between client and gateway servers.
- **`TIMEOUT`**: Payment session timed out before gateway confirmation.
- **`PAYMENT_GATEWAY_FAILURE`**: Upstream acquiring server internal processing error.
- **`CUSTOMER_CANCELLED`**: Customer explicitly closed checkout modal.
- **`UNKNOWN`**: Insufficient Razorpay metadata provided.

### Severity & Recovery Eligibility Matrix
| Failure Category | Severity | Recovery Eligibility | Evidence Reasoning |
| :--- | :--- | :--- | :--- |
| `INSUFFICIENT_FUNDS` | `MEDIUM` | `POSSIBLY_RECOVERABLE` | Customer can retry after adding funds. |
| `NETWORK_FAILURE` / `TIMEOUT` | `MEDIUM` | `RECOVERABLE` | Transient connection error; high retry success. |
| `AUTHENTICATION_FAILURE` | `LOW` | `POSSIBLY_RECOVERABLE` | Customer can re-authenticate with correct OTP. |
| `CUSTOMER_CANCELLED` | `LOW` | `POSSIBLY_RECOVERABLE` | Customer explicitly abandoned checkout. |
| `BANK_DECLINE` | `HIGH` | `POSSIBLY_RECOVERABLE` | Declined by issuing bank; issuer contact needed. |
| `BANK_DECLINE` (Expired/Stolen) | `HIGH` | `NOT_RECOVERABLE` | Instrument invalid; retry prohibited. |
| `PAYMENT_GATEWAY_FAILURE` | `HIGH` | `RECOVERABLE` | Internal gateway error; safe to retry. |
| Multiple Failed Attempts (`≥ 3`) | `CRITICAL` | `NOT_RECOVERABLE` | Repeated failure pattern on same order ID. |

### Failure Intelligence API (`GET /api/analytics/transaction-failures`)
- **Endpoint**: `GET /api/analytics/transaction-failures`
- **Response Example**:
  ```json
  {
    "success": true,
    "summary": {
      "failedPayments": 3,
      "successfulPayments": 6,
      "totalPayments": 9,
      "failureRate": 33.3,
      "totalFailedAmount": 21950,
      "potentiallyRecoverableAmount": 21950,
      "nonRecoverableAmount": 0,
      "unknownAmount": 0,
      "failureRateVs7DayAvg": {
        "recentFailureRate": 33.3,
        "sevenDayAvgFailureRate": 33.3,
        "ratio": 1.0,
        "spikeNote": "Recent failure rate (33.3%) is within normal range."
      }
    },
    "categories": [
      { "category": "TIMEOUT", "count": 1, "amount": 12000 },
      { "category": "BANK_DECLINE", "count": 1, "amount": 8500 },
      { "category": "INSUFFICIENT_FUNDS", "count": 1, "amount": 1450 }
    ],
    "transactions": [
      {
        "paymentId": "pay_fail_demo_101",
        "orderId": "order_fail_demo_101",
        "amount": 12000,
        "category": "TIMEOUT",
        "severity": "MEDIUM",
        "recoveryEligibility": "RECOVERABLE",
        "amountAtRisk": 12000,
        "failureReason": "Payment timed out before gateway confirmation",
        "evidence": "Payment session timed out before confirmation from payment gateway."
      }
    ]
  }
  ```

### Security Boundaries
- **Session-Derived Authorization**: Strictly queries `userId` from authenticated session (`getSession()`).
- **No Credentials Exposed**: Razorpay secrets, API credentials, and internal stack traces are never exposed in API responses.
- **ReadOnly Intelligence**: This endpoint only analyzes and classifies data; it never executes retries, refunds, or payment state mutations.

---

## 🤖 CapitalOrbit AI Merchant Copilot

CapitalOrbit features a **Data-Grounded AI Merchant Copilot** (`lib/services/merchant-copilot.ts`) that answers natural language queries about money, payments, revenue at risk, failure spikes, financial health, spending allocations, cash flow, 30/60/90-day forecasts, purchase affordability, and savings goals.

### Data-Grounded Architecture (Zero Fabrication)
All monetary calculations, failure rates, Safe-to-Spend limits, and forecasts are generated exclusively by **deterministic backend services**. The AI layer handles intent routing, context assembly, and natural language synthesis.

```text
User Query ("Why did payments fail today?")
                     ↓
        Intent Router (CopilotIntent)
                     ↓
  Deterministic Engine (Transaction Failure Intelligence / Health / Forecast / Decision)
                     ↓
        Structured Evidence Object
                     ↓
Copilot Chat UI (Answer + Metrics + Evidence Drawer + Recommendations)
```

### Supported Intent Routing
| Intent | Example User Query | Backend Service Routed |
| :--- | :--- | :--- |
| `PAYMENT_FAILURES` | *"Why did payments fail today?"* | `transaction-failure-intelligence.ts` |
| `REVENUE_RISK` | *"How much revenue is at risk?"* | `transaction-failure-intelligence.ts` |
| `FAILURE_SPIKE` | *"Is there an unusual failure spike?"* | `transaction-failure-intelligence.ts` |
| `PAYMENT_METHOD_ANALYSIS` | *"Which payment method has highest failure rate?"* | `transaction-failure-intelligence.ts` |
| `FINANCIAL_HEALTH` | *"How is my financial health?"* | `financial-health.ts` |
| `SPENDING_ANALYSIS` | *"Where am I spending the most?"* | `spending-analytics.ts` |
| `CASH_FLOW` | *"What's my cash flow?"* | `cash-flow-analytics.ts` |
| `FORECAST` | *"What will my balance look like in 90 days?"* | `financial-forecast.ts` |
| `FINANCIAL_DECISION` | *"Can I afford ₹20,000?"* | `decision-engine.ts` |
| `GOAL_ANALYSIS` | *"Can I reach my bike goal?"* | `financial-health.ts` + `decision-engine.ts` |
| `FINANCIAL_SUMMARY` | *"Give me a complete financial summary."* | 360° Multi-Engine Aggregator |
| `UNKNOWN` | *"What is the weather?"* | Guided Helpful Fallback |

### Copilot API (`POST /api/copilot`)
- **Endpoint**: `POST /api/copilot`
- **Request Body**: `{ "query": "Why did payments fail today?" }`
- **Response**:
  ```json
  {
    "success": true,
    "intent": "PAYMENT_FAILURES",
    "answer": "Recorded 3 failed payments (33.3% failure rate) totaling ₹21,950. Primary failure cause: TIMEOUT.",
    "confidence": 0.96,
    "metrics": [
      { "label": "Failed Payments", "value": "3" },
      { "label": "Failure Rate", "value": "33.3%" },
      { "label": "Amount at Risk", "value": "₹21,950" },
      { "label": "Potentially Recoverable", "value": "₹21,950" }
    ],
    "evidence": [
      {
        "label": "pay_fail_demo_101 (TIMEOUT)",
        "value": "Payment session timed out before confirmation from payment gateway.",
        "source": "Transaction Failure Intelligence Engine"
      }
    ],
    "recommendations": [
      "Investigate primary failure reason: TIMEOUT (1 occurrences)."
    ],
    "severity": "MEDIUM",
    "disclaimer": "Disclaimer: CapitalOrbit Copilot provides data-grounded decision intelligence based on recorded transactions, not regulated financial or tax advice."
  }
  ```

---

## 💳 Payment Intelligence Center (Step 11)

CapitalOrbit features a dedicated **Payment Intelligence Center** embedded directly inside the **Analytics** section (`components/dashboard/analytics-page.tsx`). It connects directly to the underlying `analyzeFailedTransactions` deterministic engine to provide a 360° fintech intelligence dashboard for merchant payment operations.

### Architecture & Copilot Unification
```text
                       Database (Prisma / Expenses)
                                    ↓
            Deterministic Engine (transaction-failure-intelligence.ts)
                                    ↓
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
   Payment Intelligence Center              CapitalOrbit AI Copilot
   (Analytics Page Tab View)                (Floating Assistant)
```

### Core Features
1. **Payment Health Cards**: Success Rate %, Failure Rate %, Failed Transactions, Amount at Risk, Potentially Recoverable Revenue, Non-Recoverable Loss.
2. **Failure Reason Breakdown**: Visual distribution across all 8 deterministic failure categories (`BANK_DECLINE`, `INSUFFICIENT_FUNDS`, `AUTHENTICATION_FAILURE`, `NETWORK_FAILURE`, `TIMEOUT`, `PAYMENT_GATEWAY_FAILURE`, `CUSTOMER_CANCELLED`, `UNKNOWN`).
3. **Payment Method Risk Intelligence**: Compares failure rates across payment channels (Card, UPI, Netbanking, Wallet) and flags the highest-risk method.
4. **Revenue Impact & Recovery Analysis**: Computes recovery opportunity percentage (`potentiallyRecoverableAmount / totalFailedAmount * 100`) and merchant cash flow impact explanations.
5. **Anomaly & Spike Detection**: Compares recent 24h failure rate against 7-day historical baseline with severity alerts (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), accompanied by an **insufficient-data safeguard** (`totalPayments < 3`).
6. **Unified Intelligence**: Shares the exact same deterministic backend data layer with the AI Merchant Copilot.

---

## ⚡ AI Revenue Recovery Console (Step 12)

CapitalOrbit includes a deterministic **Revenue Recovery Engine** (`lib/services/revenue-recovery.ts`) accessible via the **Revenue Recovery ⚡** tab inside the **Analytics** page (`components/dashboard/analytics-page.tsx`).

### Architecture & Workflow
```text
                     Transaction Failure Intelligence
                                    ↓
                     Revenue Recovery Engine (revenue-recovery.ts)
                                    ↓
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
Priority Queue Ranking     Test-Mode Workflow         Audit Trail & Safety
(CRITICAL/HIGH/MED/LOW)   (Single & Batch Simulator)   (Max 2 retries / Guarded)
```

### Deterministic Recovery Rules
- **Eligibility Classification**:
  - `RECOVERABLE`: Network failure, Timeout, Gateway internal error.
  - `POSSIBLY_RECOVERABLE`: Authentication / OTP failure, temporary bank issue.
  - `NOT_RECOVERABLE`: Customer cancellation, expired/stolen card, repeated bank decline.
  - `UNKNOWN`: Insufficient evidence.
- **Recommended Actions**: Bounded outputs (`RETRY_PAYMENT`, `RETRY_LATER`, `ASK_CUSTOMER_TO_RETRY`, `VERIFY_PAYMENT_METHOD`, `NO_ACTION`) with explainable rationale strings.
- **Stopping Rules & Safeguards**:
  - Maximum 2 simulated recovery attempts per payment (`MAX_ATTEMPTS_EXCEEDED`).
  - Protected `NOT_RECOVERABLE` transactions (`REJECTED_PERMANENT`).
  - Zero live Razorpay charge/refund API execution (100% test simulation mode).
- **Copilot Integration**: Unified with `merchant-copilot.ts` to answer recovery queries (*"How much revenue can I recover?"*, *"Which failed payments should I recover first?"*).

### Step 13 — Revenue Recovery Campaign & Outcome Simulator (`lib/services/revenue-recovery.ts`)

CapitalOrbit includes a **Deterministic Recovery Campaign & Outcome Simulator** allowing merchants to construct simulated recovery campaigns across failed payment batches and project realistic revenue recovery.

> ⚠️ **DISCLAIMER**: Campaign outputs are **simulations only**. No real payments are retried, charged, or recovered on live payment networks during campaign simulation.

#### 1. Deterministic Recovery Probability Matrix
Campaign outcome forecasts use transparent, documented, deterministic probabilities per failure category (no random numbers):

| Failure Category | Recovery Probability | Rationale |
| :--- | :--- | :--- |
| `NETWORK_FAILURE` | **85% (0.85)** | Transient network drops have high immediate retry success. |
| `TIMEOUT` | **80% (0.80)** | Gateway timeout errors resolve quickly upon status check / retry. |
| `PAYMENT_GATEWAY_FAILURE` | **75% (0.75)** | Acquiring bank downtime resolves following status recovery. |
| `AUTHENTICATION_FAILURE` | **50% (0.50)** | 3DS OTP issues resolve if customer completes verification. |
| `INSUFFICIENT_FUNDS` | **35% (0.35)** | Customer balance issues resolve if customer tops up balance. |
| `BANK_DECLINE` | **15% (0.15)** | Issuing bank decline requires instrument limit check or alternate card. |
| `CUSTOMER_CANCELLED` | **0% (0.00)** | Permanent customer cancellation. Re-attempts prohibited. |
| `UNKNOWN` | **10% (0.10)** | Unspecified failure cause. Low baseline probability. |

#### 2. Outcome Calculation & Before vs After Flow
For each selected transaction $i$:
$$\text{Expected Recovery}_i = \text{Amount}_i \times \text{Probability}_{\text{category}}$$
$$\text{Remaining Risk}_i = \text{Amount}_i - \text{Expected Recovery}_i$$

Campaign Totals:
- **Expected Recovered Revenue**: $\sum \text{Expected Recovery}_i$
- **Remaining Revenue Risk**: $\text{Total Revenue at Risk} - \text{Expected Recovered Revenue}$
- **Expected Recovery Rate**: $(\text{Expected Recovered Revenue} / \text{Total Revenue at Risk}) \times 100$

#### 3. Exception Handling & Exclusion Rules
Transactions are excluded from campaign selection with explicit rationale:
- `NOT_RECOVERABLE` / `CUSTOMER_CANCELLED`: Protected permanent decline or customer cancellation.
- `MAX_ATTEMPTS_EXCEEDED`: Transaction has reached maximum simulated retries (2).
- `OUTSIDE_FILTERS`: Transaction does not match selected priority, failure category, method, or strategy filter.
- `MAX_LIMIT_EXCEEDED`: Exceeds merchant-specified campaign transaction cap.

#### 4. Audit Trail & Copilot Integration
- **Audit Log**: Every campaign simulation generates a timestamped log entry in `RecoveryAuditLogEntry` explicitly tagged as `SIMULATION`.
- **Copilot Intelligence**: `processCopilotQuery` calls `simulateRecoveryCampaign` directly to answer natural language questions (*"How much could I recover if I retry my failed payments?"*, *"What would happen if I recover my high priority payments?"*).

---

### Step 14 — Expense Calendar View (`lib/services/expense-calendar.ts`)

CapitalOrbit includes an **Expense Calendar View** integrated inside the existing `/expenses` section (`List View | Grouped View | Calendar View 📅`).

#### 1. Daily Aggregation & Grid Engine
- **Monthly Grid**: Generates full week-aligned grids using `date-fns` (`startOfWeek`, `endOfWeek`, `eachDayOfInterval`), supporting leap years and variable month lengths.
- **Daily Cell Display**: Shows date number, number of daily transactions (`3 txs`), and total daily spending (`₹1,919`).
- **Month Summary Bar**: Displays Monthly Total Spending, Monthly Total Income, Active Spending Days, and Average Daily Spend per active day.

#### 2. Relative Spending Intensity Calculation
Cell background colors dynamically reflect spending intensity relative to the user's actual average daily spending ($\text{avgDaily}$):

| Intensity Level | Condition | Visual Indicator |
| :--- | :--- | :--- |
| `LOW` | $\text{Daily Spent} < 0.5 \times \text{avgDaily}$ | Emerald tint |
| `NORMAL` | $0.5 \times \text{avgDaily} \le \text{Daily Spent} < 1.2 \times \text{avgDaily}$ | Indigo tint |
| `HIGH` | $1.2 \times \text{avgDaily} \le \text{Daily Spent} < 2.0 \times \text{avgDaily}$ | Amber tint |
| `VERY_HIGH` | $\text{Daily Spent} \ge 2.0 \times \text{avgDaily}$ | Rose tint |

#### 3. Interactive Date Details & Filters
- **Date Inspection Dialog**: Clicking any date cell opens a details modal displaying merchant name, category, payment method icon, timestamp, source badge (`Razorpay` / `Manual`), and expense amount without page navigation.
- **Filter Support**: Filters by Category, Payment Method, and Transaction Source (`Razorpay` vs `Manual`). Daily totals and intensity levels dynamically update upon filter selection.

---

## 🚀 Vercel Deployment & Production Setup

### Environment Variables
Configure the following environment variables in your deployment dashboard (e.g. Vercel Project Settings → Environment Variables):

| Variable | Scope | Secret? | Description |
| :--- | :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Server | No | Your Razorpay API Key ID (e.g. `rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Server | **YES** | Your Razorpay Key Secret. **Never expose to frontend.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client | No | Public Key ID consumed by Razorpay Checkout SDK on client. |
| `DATABASE_URL` | Server | **YES** | Database connection string. (Local: `file:./dev.db`, Production: PostgreSQL) |
| `JWT_SECRET` | Server | **YES** | Secret key used to sign JWT authentication cookies. |

### Database Architecture
- **Development**: Local SQLite (`file:./dev.db`).
- **Production Recommended**: Hosted PostgreSQL (e.g. Vercel Postgres, Supabase, Neon, or Railway). Update `provider = "postgresql"` in `prisma/schema.prisma` for hosted database deployments.

### Razorpay Test Mode Deployment Flow
1. Obtain Razorpay Test Mode Key ID and Key Secret from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).
2. Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in Vercel environment variables.
3. Deploy CapitalOrbit (`git push vercel main` or automatic Vercel GitHub integration).
4. Open the deployed application URL, open `/settings` or `/dashboard`, and click **Test Standard Checkout**.
5. Complete payment using Razorpay Test UPI / Card credentials.
6. The backend verifies the HMAC-SHA256 signature (`order_id + "|" + payment_id`, `KEY_SECRET`), records the transaction, and updates Safe-to-Spend limits.

---

## ✅ Production Readiness Checklist

### Security
- [x] All API secrets externalized to server-only environment variables (`RAZORPAY_KEY_SECRET`).
- [x] `RAZORPAY_KEY_SECRET` is never exposed in client bundles or public status endpoints.
- [x] User authentication and session-derived authorization enforced across all API routes (`getSession()`).
- [x] Input sanitization and monetary validation active (minimum 100 paise, non-negative amounts, bounds checking).
- [x] Error messages sanitized to mask database paths and internal stack traces.
- [x] In-memory sliding window rate limiting enabled on sensitive API routes.
- [x] Security response headers configured (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).

### Payments
- [x] Razorpay Order Creation (`POST /api/create-order`).
- [x] HMAC-SHA256 Payment Signature Verification (`POST /api/verify-payment`).
- [x] Automatic transaction ingestion & AI categorization.
- [x] Idempotent upsert prevention against duplicate payment records.
- [x] Failed and refunded payments excluded from spending totals.
- [x] Webhook route handler template ready (`POST /api/razorpay/webhook`).

### Application Capabilities
- [x] Financial Health Engine (`lib/services/financial-health.ts`).
- [x] Safe-to-Spend calculation with over-commitment detection.
- [x] AI Financial Decision Engine ("Ask Before You Spend").
- [x] Cash Flow Analytics & Spending Analytics.
- [x] 30 / 60 / 90-Day Projected Financial Forecast.
- [x] Explainable AI Financial Insights.
- [x] Printable Financial Summary Reports.
- [x] Demo Financial Profile Seeding.

### Deployment & Build
- [x] Next.js production build passing (`npm run build`).
- [x] Automated test suite passing (`npm run test`).
- [x] Environment variable documentation completed.
- [x] Git `.gitignore` enforcing secret file exclusions.
- [x] Production database recommendations (PostgreSQL) documented.


