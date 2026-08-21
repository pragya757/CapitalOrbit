import { DefaultCategory, ExpenseCategory } from './types'

export type ReactionTone = 'success' | 'warning' | 'danger'

export interface Reaction {
  message: string
  emoji: string
  tone: ReactionTone
}

const CATEGORY_REACTIONS: Record<DefaultCategory, { small: Reaction, medium: Reaction, high: Reaction }> = {
  food: {
    small: { message: "Snack attack, huh 😋", emoji: "🍔", tone: "success" },
    medium: { message: "That meal better have been worth it 👀", emoji: "🍽️", tone: "warning" },
    high: { message: "Five-star dining?? We rich now? 💀", emoji: "💸", tone: "danger" }
  },
  shopping: {
    small: { message: "Little treat, we approve ✨", emoji: "🛍️", tone: "success" },
    medium: { message: "Retail therapy kicking in 😏", emoji: "👗", tone: "warning" },
    high: { message: "Did we NEED that… or just vibes? 😭", emoji: "💰", tone: "danger" }
  },
  entertainment: {
    small: { message: "Fun money, fair enough 🎉", emoji: "🎮", tone: "success" },
    medium: { message: "Okay okay, living life I see 😎", emoji: "🍿", tone: "warning" },
    high: { message: "This better come with memories 😭", emoji: "🎢", tone: "danger" }
  },
  transport: {
    small: { message: "Quick ride, no stress 🚕", emoji: "🚌", tone: "success" },
    medium: { message: "Traffic + money gone, sad combo 😩", emoji: "⛽", tone: "warning" },
    high: { message: "Private jet or what?? 💀", emoji: "✈️", tone: "danger" }
  },
  health: {
    small: { message: "Health first, always 💚", emoji: "💊", tone: "success" },
    medium: { message: "Taking care of yourself, nice 👏", emoji: "🏥", tone: "warning" },
    high: { message: "Okay but at least you're alive 😭", emoji: "🚑", tone: "danger" }
  },
  education: {
    small: { message: "Investing in brain 🧠✨", emoji: "📚", tone: "success" },
    medium: { message: "Future you says thanks 👀", emoji: "🎓", tone: "warning" },
    high: { message: "This degree better pay off 😭", emoji: "🏫", tone: "danger" }
  },
  utilities: {
    small: { message: "Bills doing their thing 😐", emoji: "💡", tone: "success" },
    medium: { message: "Adulting unlocked 🔓", emoji: "📱", tone: "warning" },
    high: { message: "Why are bills always attacking 💀", emoji: "⚡", tone: "danger" }
  },
  other: {
    small: { message: "Random expense, noting it down 📝", emoji: "✨", tone: "success" },
    medium: { message: "Mysterious spending... 👀", emoji: "🤔", tone: "warning" },
    high: { message: "Whatever this was, it hurt the wallet 😭", emoji: "💸", tone: "danger" }
  }
}

export const getSmartReaction = (
  category: DefaultCategory,
  amount: number,
  budgetLimit: number,
  streak: number = 0
): Reaction => {
  // Fallbacks just in case
  if (!budgetLimit || budgetLimit <= 0) budgetLimit = 100 // Safe default

  const percentage = (amount / budgetLimit) * 100
  let scale: 'small' | 'medium' | 'high' = 'small'
  
  // Adaptive thresholds based on relative percentage
  if (percentage >= 30) scale = 'high'
  else if (percentage >= 10) scale = 'medium'

  // Adaptive AI-Like Streak escalation overriding standard behavior
  if (scale === 'high' && streak >= 3) {
    return {
      message: "Your wallet is literally begging for mercy rn 😭",
      emoji: "🚨",
      tone: "danger"
    }
  }

  // Adaptive Streak level 2
  if (scale === 'high' && streak === 2) {
    return {
      message: "Bro... another massive purchase? Chill 💀",
      emoji: "🛑",
      tone: "danger"
    }
  }

  return CATEGORY_REACTIONS[category][scale] || CATEGORY_REACTIONS.other[scale]
}

export const getBudgetMessage = (percentUsed: number) => {
  if (percentUsed > 100) return "Budget officially crying rn 😭"
  if (percentUsed >= 90) return "This is NOT looking good 💀"
  if (percentUsed >= 70) return "Careful… you’re entering danger zone ⚠️"
  return "You're actually doing great 👏"
}

export const getAuthSuccessMessage = (type: 'login' | 'signup') => {
  if (type === 'signup') return "Welcome to CapitalOrbit, let’s get rich (or at least try) 💸"
  return "Welcome back, money manager 😎"
}

export const getEmptyStateMessage = () => {
  return "No expenses yet... your wallet must be so happy ✨"
}

export const getGoodHabitMessage = () => {
  return "Zero spend day?? ICONIC ✨"
}
