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


