import { prisma } from '@/lib/prisma'
import { categorizeTransaction } from './transaction-intelligence'

/**
 * Realistic Demo Financial Profile Seeding Service
 * Populates income, expenses, budgets, savings goal, and recurring obligations for the current user.
 * Fully idempotent to avoid duplicating records or overwriting real Razorpay transactions.
 */
export async function seedDemoData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error(`User with ID ${userId} not found.`)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonthDate = `${todayStr.substring(0, 7)}-01`

  // 1. SEED / UPDATE DEMO INCOME (₹50,000/month Salary)
  const existingIncome = await prisma.income.findFirst({
    where: { userId, source: 'Monthly Salary' },
  })

  if (!existingIncome) {
    await prisma.income.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        amount: 50000,
        source: 'Monthly Salary',
        description: 'Tech Lead Monthly Salary',
        date: currentMonthDate,
        isRecurring: true,
        recurringFrequency: 'monthly',
      },
    })
  } else {
    await prisma.income.update({
      where: { id: existingIncome.id },
      data: { amount: 50000, date: currentMonthDate },
    })
  }

  // 2. SEED REALISTIC EXPENSES
  const demoExpenses = [
    { description: 'Apartment Rent Payment', amount: 12000, category: 'housing', paymentMethod: 'bank_transfer' },
    { description: 'Swiggy Food & Dining', amount: 5000, category: 'food', paymentMethod: 'upi' },
    { description: 'Uber Rides & Petrol', amount: 3000, category: 'transportation', paymentMethod: 'upi' },
    { description: 'PVR Movies & Netflix', amount: 2000, category: 'entertainment', paymentMethod: 'card' },
    { description: 'Electricity & Water Bill', amount: 2500, category: 'utilities', paymentMethod: 'upi' },
    { description: 'Amazon Apparel & Goods', amount: 3500, category: 'shopping', paymentMethod: 'card' },
  ]

  for (const exp of demoExpenses) {
    const existing = await prisma.expense.findFirst({
      where: { userId, description: exp.description },
    })

    if (!existing) {
      const intel = categorizeTransaction({ description: exp.description, amount: exp.amount })
      await prisma.expense.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          amount: exp.amount,
          category: intel.category || exp.category,
          description: exp.description,
          date: todayStr,
          paymentMethod: exp.paymentMethod,
          isRecurring: exp.category === 'housing' || exp.category === 'utilities',
          source: 'demo_seed',
          status: 'captured',
          merchantName: exp.description.split(' ')[0],
          categorySource: intel.source,
          categoryConfidence: intel.confidence,
          categoryReason: intel.reason,
        },
      })
    }
  }

  // 3. SEED REALISTIC BUDGETS
  const demoBudgets = [
    { category: 'food', limit: 7000 },
    { category: 'transportation', limit: 5000 },
    { category: 'entertainment', limit: 3000 },
    { category: 'shopping', limit: 5000 },
  ]

  for (const b of demoBudgets) {
    await prisma.budget.upsert({
      where: { userId_category: { userId, category: b.category } },
      update: { limit: b.limit },
      create: {
        id: crypto.randomUUID(),
        userId,
        category: b.category,
        limit: b.limit,
        period: 'monthly',
      },
    })
  }

  // 4. SEED SAVINGS GOAL ("New Bike", Target: ₹1,20,000, Saved: ₹30,000, Deadline: 8 months)
  const deadlineDate = new Date()
  deadlineDate.setMonth(deadlineDate.getMonth() + 8)
  const deadlineStr = deadlineDate.toISOString().split('T')[0]

  const existingGoal = await prisma.savingsGoal.findFirst({
    where: { userId, name: 'New Bike' },
  })

  if (!existingGoal) {
    await prisma.savingsGoal.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        name: 'New Bike',
        targetAmount: 120000,
        savedAmount: 30000,
        deadline: deadlineStr,
      },
    })
  } else {
    await prisma.savingsGoal.update({
      where: { id: existingGoal.id },
      data: {
        targetAmount: 120000,
        savedAmount: 30000,
        deadline: deadlineStr,
      },
    })
  }

  // 5. SEED RECURRING OBLIGATIONS (Rent, Utilities, Internet Subscription)
  const demoRecurring = [
    { description: 'Apartment Monthly Rent', amount: 12000, category: 'housing', frequency: 'monthly' },
    { description: 'Electricity & Utility Bills', amount: 2500, category: 'utilities', frequency: 'monthly' },
    { description: 'High-Speed Broadband Internet', amount: 1000, category: 'utilities', frequency: 'monthly' },
  ]

  for (const rec of demoRecurring) {
    const existingRec = await prisma.recurringRule.findFirst({
      where: { userId, description: rec.description },
    })

    if (!existingRec) {
      await prisma.recurringRule.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'expense',
          amount: rec.amount,
          category: rec.category,
          description: rec.description,
          paymentMethod: 'upi',
          frequency: rec.frequency,
          nextDate: todayStr,
          isActive: true,
        },
      })
    }
  }

  return {
    success: true,
    message: 'Realistic demo financial profile seeded successfully!',
  }
}
