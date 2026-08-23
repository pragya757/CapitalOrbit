'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import type { Expense, Budget, Income, RecurringRule, User, CategoryItem } from '@/lib/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

// Default categories to seed for each user
const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORIES as string[]

/**
 * Ensure default categories exist for a user (idempotent).
 */
async function ensureDefaultCategories(userId: string) {
  const existing = await prisma.category.findMany({
    where: { userId },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((c) => c.name))

  const toCreate = DEFAULT_CATEGORY_NAMES.filter((name) => !existingNames.has(name))

  if (toCreate.length > 0) {
    await Promise.all(
      toCreate.map((name) =>
        prisma.category.upsert({
          where: { userId_name: { userId, name } },
          update: {},
          create: {
            id: crypto.randomUUID(),
            userId,
            name,
            isCustom: false,
          },
        })
      )
    )
  }
}

// Fetch all user initialization data
export async function fetchUserData() {
  const session = await getSession()
  if (!session?.userId) return null

  const userId = session.userId as string

  // Ensure default categories exist
  await ensureDefaultCategories(userId)

  const [user, expenses, budgets, incomes, recurring, categories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.income.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.recurringRule.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
  ])

  if (!user) return null

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyBudget: user.monthlyBudget,
    } as User,
    expenses: expenses as unknown as Expense[],
    budgets: budgets.map(b => ({ ...b, spent: 0 })) as unknown as Budget[],
    incomes: incomes as unknown as Income[],
    recurringRules: recurring as unknown as RecurringRule[],
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      isCustom: c.isCustom,
    })) as CategoryItem[],
  }
}

// Sync individual items (Fire and Forget from client)
export async function syncExpense(expense: Expense, isDelete = false) {
  const session = await getSession()
  if (!session?.userId) return

  const {
    id,
    category,
    description,
    date,
    paymentMethod,
    isRecurring,
    recurringFrequency,
    amount,
    source = 'manual',
    status = 'captured',
    razorpayPaymentId,
    razorpayOrderId,
    email,
    contact,
    merchantName,
    categorySource,
    categoryConfidence,
    categoryReason,
  } = expense

  if (isDelete) {
    await prisma.expense.delete({ where: { id } }).catch(() => {})
  } else {
    await prisma.expense.upsert({
      where: { id },
      update: {
        amount,
        category,
        description,
        date,
        paymentMethod,
        isRecurring,
        recurringFrequency,
        source,
        status,
        razorpayPaymentId,
        razorpayOrderId,
        email,
        contact,
        merchantName,
        categorySource,
        categoryConfidence,
        categoryReason,
      },
      create: {
        id,
        userId: session.userId,
        amount,
        category,
        description,
        date,
        paymentMethod,
        isRecurring,
        recurringFrequency,
        source,
        status,
        razorpayPaymentId,
        razorpayOrderId,
        email,
        contact,
        merchantName,
        categorySource,
        categoryConfidence,
        categoryReason,
      },
    })
  }
}

export async function syncBudget(budget: Budget) {
  const session = await getSession()
  if (!session?.userId) return

  const { id, category, limit, period } = budget

  await prisma.budget.upsert({
    where: { id },
    update: { category, limit, period },
    create: {
      id,
      userId: session.userId,
      category,
      limit,
      period,
    },
  })
}

export async function syncIncome(income: Income, isDelete = false) {
  const session = await getSession()
  if (!session?.userId) return

  const { id, amount, source, description, date, isRecurring, recurringFrequency } = income

  if (isDelete) {
    await prisma.income.delete({ where: { id } }).catch(() => {})
  } else {
    await prisma.income.upsert({
      where: { id },
      update: { amount, source, description, date, isRecurring, recurringFrequency },
      create: {
        id,
        userId: session.userId,
        amount,
        source,
        description,
        date,
        isRecurring,
        recurringFrequency,
      },
    })
  }
}

export async function syncRecurringRule(rule: RecurringRule, isDelete = false) {
  const session = await getSession()
  if (!session?.userId) return

  const { id, type, amount, category, source, description, paymentMethod, frequency, nextDate, isActive } = rule

  if (isDelete) {
    await prisma.recurringRule.delete({ where: { id } }).catch(() => {})
  } else {
    await prisma.recurringRule.upsert({
      where: { id },
      update: { type, amount, category, source, description, paymentMethod, frequency, nextDate, isActive },
      create: {
        id,
        userId: session.userId,
        type,
        amount,
        category,
        source,
        description,
        paymentMethod,
        frequency,
        nextDate,
        isActive,
      },
    })
  }
}

export async function syncUserProfile(user: Partial<User>) {
  const session = await getSession()
  if (!session?.userId) return

  const { name, currency, monthlyBudget } = user

  await prisma.user.update({
    where: { id: session.userId },
    data: { name, currency, monthlyBudget },
  })
}

// ──────────────────────────────────────────────────
// Category management
// ──────────────────────────────────────────────────

export async function syncCategory(category: CategoryItem) {
  const session = await getSession()
  if (!session?.userId) return

  await prisma.category.upsert({
    where: {
      userId_name: { userId: session.userId, name: category.name },
    },
    update: {},
    create: {
      id: category.id,
      userId: session.userId,
      name: category.name,
      isCustom: category.isCustom,
    },
  })
}

export async function deleteCategory(categoryName: string) {
  const session = await getSession()
  if (!session?.userId) return

  // Safety check: do not allow deletion of default categories
  if ((DEFAULT_CATEGORY_NAMES as string[]).includes(categoryName)) {
    return { error: 'Cannot delete a default category' }
  }

  await prisma.category.delete({
    where: {
      userId_name: { userId: session.userId, name: categoryName },
    },
  }).catch(() => {})

  return { success: true }
}
