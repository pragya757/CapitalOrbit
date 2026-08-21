import { AnimatedBackground } from '@/components/auth/animated-background'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AnimatedBackground />
      {children}
    </>
  )
}
