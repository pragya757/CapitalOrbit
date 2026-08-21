'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  TrendingUp,
  X,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Camera,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, href: '/expenses' },
  { id: 'budgets', label: 'Budgets', icon: Target, href: '/budgets' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, href: '/analytics' },
  { id: 'scan', label: 'Scan', icon: Camera, href: '/scan' },
  { id: 'goals', label: 'Goals', icon: PiggyBank, href: '/goals' },
  { id: 'income', label: 'Income', icon: DollarSign, href: '/income' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-[#F4EFE6] dark:bg-[#191119] border-[#E4DED5] dark:border-[#3D2D3D] transition-all duration-300 md:static md:translate-x-0',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E4DED5] dark:border-[#3D2D3D] px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
                {/* Minimal Orbit Accent Ring */}
                <svg className="absolute -inset-1 w-10 h-10 text-[#E9785B] animate-orbit-slow" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeDasharray="15 25" />
                </svg>
                <span className="font-serif text-sm font-bold tracking-wider">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#3B1F3A] dark:text-[#F7F4ED]">
                Capital<span className="text-[#E9785B]">Orbit</span>
              </span>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-5 w-5 text-[#3B1F3A] dark:text-[#F7F4ED]" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  'w-full transition-all duration-200 text-xs font-semibold rounded-xl',
                  isCollapsed ? 'justify-center px-0 h-11' : 'justify-start gap-3.5 px-3.5 h-11',
                  isActive
                    ? 'bg-[#3B1F3A] text-white dark:bg-[#F7F4ED] dark:text-[#3B1F3A] shadow-sm hover:bg-[#3B1F3A]/90'
                    : 'text-[#756E72] hover:bg-[#EAE3D7] dark:hover:bg-[#2E1F2E] hover:text-[#3B1F3A] dark:hover:text-[#F7F4ED]'
                )}
                asChild
                onClick={() => {
                  if (window.innerWidth < 768) onClose()
                }}
              >
                <Link href={item.href}>
                  <Icon className={cn('shrink-0', isCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </Button>
            )
          })}
        </nav>

        {/* Bottom Banner & Collapse toggle */}
        <div className="mt-auto border-t border-[#E4DED5] dark:border-[#3D2D3D] p-3 flex flex-col gap-3">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-[#EAE3D7]/60 dark:bg-[#2E1F2E]/60 p-3 border border-[#E4DED5] dark:border-[#3D2D3D]"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                  <Sparkles className="h-3.5 w-3.5 text-[#E9785B]" />
                  <span>Orbital Insight</span>
                </div>
                <p className="mt-1 text-[11px] text-[#756E72] dark:text-[#A89FA6] leading-relaxed">
                  Your money is moving towards your future. Use Ask Before You Spend to evaluate major purchases.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="button"
            variant="ghost"
            className={cn(
              'w-full text-[#756E72] hover:text-[#3B1F3A] dark:hover:text-[#F7F4ED] hover:bg-[#EAE3D7] dark:hover:bg-[#2E1F2E] rounded-xl transition-all h-10 text-xs font-medium',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsCollapsed((prev) => !prev)
            }}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
