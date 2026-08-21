import { SavingsGoalsPage } from '@/components/savings/savings-goals-page'
import { SavingsProvider } from '@/components/savings/savings-provider'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Savings Goals | CapitalOrbit',
  description: 'Track your unbudgeted savings milestones',
}

export default async function GoalsRoute() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <SavingsProvider>
      <SavingsGoalsPage />
    </SavingsProvider>
  )
}
