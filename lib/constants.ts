/**
 * Shared constants — icons, colors, and labels for categories and payment methods.
 * Replaces duplicated maps across 4+ component files.
 */

import {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Zap,
  GraduationCap,
  Heart,
  MoreHorizontal,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Tag,
  ShoppingCart,
  Tv,
  Plane,
  Repeat,
  Sparkles,
  Package,
  Megaphone,
  Users,
  Briefcase,
  Laptop,
  Truck,
  Building,
  FileText,
  ShieldCheck,
  Globe,
  Building2,
} from 'lucide-react'
import type { DefaultCategory, PaymentMethod } from './types'

// Category icon mapping (built-in defaults + personal & business taxonomy)
export const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  food: Utensils,
  groceries: ShoppingCart,
  transport: Car,
  entertainment: Film,
  shopping: ShoppingBag,
  electronics: Tv,
  utilities: Zap,
  education: GraduationCap,
  health: Heart,
  travel: Plane,
  subscriptions: Repeat,
  personal_care: Sparkles,
  other: MoreHorizontal,
  // Business
  inventory: Package,
  marketing: Megaphone,
  salaries: Users,
  operations: Briefcase,
  software: Laptop,
  logistics: Truck,
  rent: Building,
  taxes: FileText,
  professional_services: ShieldCheck,
  business_travel: Globe,
  other_business: Building2,
}

/** Get icon for any category (returns fallback Tag icon for custom categories) */
export function getCategoryIcon(category: string): typeof Utensils {
  const key = category.toLowerCase().trim()
  return CATEGORY_ICONS[key] || Tag
}

// Category display labels (built-in defaults)
export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Dining',
  groceries: 'Groceries',
  transport: 'Transport',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  electronics: 'Electronics',
  utilities: 'Bills & Utilities',
  education: 'Education',
  health: 'Healthcare',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
  personal_care: 'Personal Care',
  other: 'Other',
  // Business
  inventory: 'Inventory',
  marketing: 'Marketing',
  salaries: 'Salaries',
  operations: 'Operations',
  software: 'Software & SaaS',
  logistics: 'Logistics',
  rent: 'Rent',
  taxes: 'Taxes',
  professional_services: 'Professional Services',
  business_travel: 'Business Travel',
  other_business: 'Other Business',
}

/** Get display label for any category (capitalizes custom category names) */
export function getCategoryLabel(category: string): string {
  const key = category.toLowerCase().trim()
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key]
  if (category === 'Uncategorized') return 'Uncategorized'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

// Category colors for solid backgrounds (budget cards)
export const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-chart-1',
  transport: 'bg-chart-2',
  entertainment: 'bg-chart-3',
  shopping: 'bg-chart-4',
  utilities: 'bg-chart-5',
  education: 'bg-primary',
  health: 'bg-accent',
  other: 'bg-muted-foreground',
}

/** Get color class for any category (returns fallback for custom categories) */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'bg-muted-foreground'
}

// Category colors for icon backgrounds (expense lists)
export const CATEGORY_ICON_COLORS: Record<string, string> = {
  food: 'bg-chart-1/10 text-chart-1',
  transport: 'bg-chart-2/10 text-chart-2',
  entertainment: 'bg-chart-3/10 text-chart-3',
  shopping: 'bg-chart-4/10 text-chart-4',
  utilities: 'bg-chart-5/10 text-chart-5',
  education: 'bg-primary/10 text-primary',
  health: 'bg-accent/10 text-accent',
  other: 'bg-muted text-muted-foreground',
}

/** Get icon color classes for any category */
export function getCategoryIconColor(category: string): string {
  return CATEGORY_ICON_COLORS[category] || 'bg-muted text-muted-foreground'
}

// Payment method icons
export const PAYMENT_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
  wallet: Wallet,
}

// Chart color palette (High-Contrast Distinct Palette)
export const CHART_COLORS = [
  '#E9785B', // Terracotta Coral
  '#F2B84B', // Warm Gold
  '#42B89D', // Soft Mint
  '#9B51E0', // Vibrant Violet
  '#3B82F6', // Sky Blue
  '#EC4899', // Bright Pink
  '#F97316', // Bright Orange
]

// All default expense categories
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  'food', 'transport', 'entertainment', 'shopping',
  'utilities', 'education', 'health', 'other',
]

// All expense categories (alias for backward compat)
export const ALL_CATEGORIES = DEFAULT_CATEGORIES

// All payment methods
export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'cash', 'card', 'upi', 'wallet',
]

// ──────────────────────────────────────────────────
// Automatic Categorization — keyword → category map
// ──────────────────────────────────────────────────

export const KEYWORD_CATEGORY_MAP: Record<string, DefaultCategory> = {
  // Food & Dining
  restaurant: 'food',
  cafe: 'food',
  groceries: 'food',
  grocery: 'food',
  swiggy: 'food',
  zomato: 'food',
  pizza: 'food',
  burger: 'food',
  breakfast: 'food',
  lunch: 'food',
  dinner: 'food',
  snack: 'food',
  coffee: 'food',
  tea: 'food',
  food: 'food',
  dominos: 'food',
  mcdonalds: 'food',
  kfc: 'food',
  biryani: 'food',

  // Transport / Travel
  uber: 'transport',
  ola: 'transport',
  bus: 'transport',
  train: 'transport',
  fuel: 'transport',
  petrol: 'transport',
  diesel: 'transport',
  metro: 'transport',
  cab: 'transport',
  taxi: 'transport',
  flight: 'transport',
  travel: 'transport',
  parking: 'transport',
  toll: 'transport',
  rapido: 'transport',

  // Shopping
  amazon: 'shopping',
  flipkart: 'shopping',
  clothes: 'shopping',
  electronics: 'shopping',
  myntra: 'shopping',
  shoes: 'shopping',
  gadget: 'shopping',
  mall: 'shopping',
  shopping: 'shopping',
  meesho: 'shopping',

  // Education
  books: 'education',
  book: 'education',
  course: 'education',
  fees: 'education',
  tuition: 'education',
  udemy: 'education',
  coursera: 'education',
  school: 'education',
  college: 'education',
  exam: 'education',
  stationery: 'education',

  // Utilities
  electricity: 'utilities',
  water: 'utilities',
  wifi: 'utilities',
  internet: 'utilities',
  broadband: 'utilities',
  phone: 'utilities',
  recharge: 'utilities',
  gas: 'utilities',
  rent: 'utilities',
  bill: 'utilities',

  // Health
  medicine: 'health',
  hospital: 'health',
  doctor: 'health',
  pharmacy: 'health',
  gym: 'health',
  fitness: 'health',
  clinic: 'health',
  medical: 'health',
  therapy: 'health',

  // Entertainment
  movie: 'entertainment',
  netflix: 'entertainment',
  spotify: 'entertainment',
  game: 'entertainment',
  gaming: 'entertainment',
  concert: 'entertainment',
  party: 'entertainment',
  subscription: 'entertainment',
  hotstar: 'entertainment',
  prime: 'entertainment',
}

/**
 * Auto-detect a category from a description string.
 * Scans each word for keyword matches. Returns 'other' if nothing matches.
 */
export function detectCategory(description: string): DefaultCategory {
  const words = description.toLowerCase().split(/[\s,.\-/]+/)
  for (const word of words) {
    if (KEYWORD_CATEGORY_MAP[word]) {
      return KEYWORD_CATEGORY_MAP[word]
    }
  }
  // Also try substring matching for partial matches (e.g., "swiggy order")
  const lower = description.toLowerCase()
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      return category
    }
  }
  return 'other'
}
