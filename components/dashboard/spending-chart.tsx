'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryLabel, CHART_COLORS } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const CATEGORY_COLOR_MAP: Record<string, string> = {
  food: '#E9785B',          // Terracotta Coral
  transport: '#F2B84B',     // Warm Gold
  entertainment: '#9B51E0', // Vibrant Violet
  shopping: '#3B82F6',      // Sky Blue
  utilities: '#42B89D',     // Soft Mint
  education: '#EC4899',     // Bright Pink
  health: '#10B981',        // Emerald
  uncategorized: '#F97316', // Bright Orange
  other: '#06B6D4',         // Cyan
}

export function SpendingChart() {
  const { getSpendingByCategory, user } = useExpenses()
  const spending = getSpendingByCategory('month')

  const data = spending.map((item, idx) => {
    const key = item.category.toLowerCase().trim()
    const color = CATEGORY_COLOR_MAP[key] || CHART_COLORS[idx % CHART_COLORS.length]
    return {
      name: getCategoryLabel(item.category),
      value: item.amount,
      color,
    }
  })

  const total = spending.reduce((sum, item) => sum + item.amount, 0)

  if (data.length === 0) {
    return (
      <Card className="h-full border-[#E2DCD0] dark:border-[#4A354A] bg-white dark:bg-[#261B26] rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
            Spending Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center h-64">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F1E8] dark:bg-[#1C141C] text-[#3B1F3A] dark:text-[#F7F4ED]">
              <PieChartIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">No spending data recorded</p>
            <p className="mt-1 text-[11px] text-[#756E72] dark:text-[#B5AAB3]">
              Add expenses to visualize category allocations
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-[#E2DCD0] dark:border-[#4A354A] bg-white dark:bg-[#261B26] rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-serif font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
          Spending Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2.5} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataItem = payload[0].payload
                    const percentage = total > 0 ? ((dataItem.value / total) * 100).toFixed(1) : '0'
                    return (
                      <div className="rounded-xl border border-[#E2DCD0] dark:border-[#4A354A] bg-white dark:bg-[#1C141C] p-3 shadow-lg text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dataItem.color }} />
                          <span>{dataItem.name}</span>
                        </div>
                        <p className="text-sm font-bold text-[#3B1F3A] dark:text-[#F7F4ED] mt-1 font-mono">
                          {formatCurrency(dataItem.value, user.currency)}
                        </p>
                        <p className="text-[10px] text-[#756E72] dark:text-[#B5AAB3] mt-0.5">
                          {percentage}% of monthly total
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={40}
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-3 mt-3">
                    {payload?.slice(0, 4).map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center gap-1.5">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-bold text-[#3B1F3A] dark:text-[#F7F4ED]">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                    {payload && payload.length > 4 && (
                      <span className="text-xs font-medium text-[#756E72] dark:text-[#B5AAB3]">
                        +{payload.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function PieChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}
