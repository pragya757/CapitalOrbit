'use client'

import { StatsCards } from './stats-cards'
import { FinancialHealthCard } from './financial-health-card'
import { DecisionCenter } from './decision-center'
import { CopilotChat } from './copilot-chat'
import { FinancialAlerts } from './financial-alerts'
import { ForecastCard } from './forecast-card'
import { FinancialInsightsCard } from './financial-insights-card'
import { TransactionFailureCard } from './transaction-failure-card'
import { FinancialReportDialog } from './financial-report-dialog'
import { RecentExpenses } from './recent-expenses'
import { SpendingChart } from './spending-chart'
import { BudgetProgress } from './budget-progress'
import { AddExpenseDialog } from './add-expense-dialog'
import { DemoDataButton } from './demo-data-button'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export function DashboardView() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight text-[#3B1F3A] dark:text-[#F7F4ED]">
            Financial Orbit
          </h2>
          <p className="text-xs sm:text-sm text-[#756E72] font-medium">
            Your money. Your decisions. Your future. ✨
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FinancialReportDialog />
          <DemoDataButton />
          <AddExpenseDialog />
        </div>
      </motion.div>

      {/* Top Metrics & Safe-to-Spend Centerpiece Hero Card */}
      <motion.div variants={itemVariants}>
        <FinancialHealthCard />
      </motion.div>

      {/* Primary Section: AI Decision Center ("Ask Before You Spend") */}
      <motion.div variants={itemVariants}>
        <DecisionCenter />
      </motion.div>

      {/* Transaction Failure Intelligence Section */}
      <motion.div variants={itemVariants}>
        <TransactionFailureCard />
      </motion.div>

      {/* Alerts & 30/60/90-Day Forecast Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <FinancialAlerts />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ForecastCard />
        </motion.div>
      </div>

      {/* Financial Insights Section */}
      <motion.div variants={itemVariants}>
        <FinancialInsightsCard />
      </motion.div>

      {/* Overview Stats Cards */}
      <motion.div variants={itemVariants}>
        <StatsCards />
      </motion.div>

      {/* Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <SpendingChart />
        </motion.div>
        <motion.div variants={itemVariants}>
          <BudgetProgress />
        </motion.div>
      </div>

      {/* Recent Transactions Section */}
      <motion.div variants={itemVariants}>
        <RecentExpenses />
      </motion.div>

      {/* Floating CapitalOrbit AI Merchant Copilot Chatbot */}
      <CopilotChat />
    </motion.div>
  )
}
