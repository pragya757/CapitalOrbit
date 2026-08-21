'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useExpenses } from '@/components/expense-provider'
import { Menu, Download, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, exportToCSV } = useExpenses()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[#E4DED5] dark:border-[#3D2D3D] bg-[#F4EFE6]/90 dark:bg-[#191119]/90 backdrop-blur-md px-4 md:px-6">
      {/* Left side: Hamburger button + Mobile-only brand logo mark */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-[#3B1F3A] dark:text-[#F7F4ED]"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Brand logo mark shown ONLY on mobile (md:hidden) to prevent duplicate header/sidebar logo on desktop */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#3B1F3A] text-white">
            <svg className="absolute -inset-1 w-10 h-10 text-[#E9785B] animate-orbit-slow" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeDasharray="15 25" />
            </svg>
            <span className="font-serif text-sm font-bold tracking-wider">C</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#3B1F3A] dark:text-[#F7F4ED]">
            Capital<span className="text-[#E9785B]">Orbit</span>
          </span>
        </Link>
      </div>

      {/* Right side: Actions, Theme Toggle, User Profile */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 font-semibold text-xs border-[#E4DED5] dark:border-[#3D2D3D] text-[#3B1F3A] dark:text-[#F7F4ED] bg-[#F7F4ED] dark:bg-[#1C141C] hover:bg-[#EAE3D7]"
          onClick={exportToCSV}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-[#E4DED5] dark:border-[#3D2D3D]">
                <AvatarFallback className="bg-[#3B1F3A] text-white text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E4DED5] dark:border-[#3D2D3D] bg-[#FFFCF7] dark:bg-[#261B26]">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#3B1F3A] text-white text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">{user.name}</span>
                <span className="text-[10px] text-[#756E72] dark:text-[#A89FA6]">{user.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-[#E4DED5] dark:bg-[#3D2D3D]" />
            <DropdownMenuItem className="sm:hidden text-xs" onClick={exportToCSV}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E4DED5] dark:bg-[#3D2D3D]" />
            <DropdownMenuItem
              className="text-xs text-[#E9785B] font-semibold"
              onClick={async () => {
                const { logoutAction } = await import('@/lib/actions/auth')
                await logoutAction()
                window.location.href = '/login'
              }}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
