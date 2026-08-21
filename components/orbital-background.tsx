'use client'

export function OrbitalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-40">
      {/* Primary Orbital Curve 1 */}
      <svg
        className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] text-[#3B1F3A]/[0.06] animate-orbit-slow"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="250" cy="250" r="220" stroke="currentColor" strokeWidth="1" strokeDasharray="6 8" />
        <circle cx="470" cy="250" r="4" fill="#3B1F3A" opacity="0.3" />
        <circle cx="30" cy="250" r="3" fill="#E9785B" opacity="0.4" />
      </svg>

      {/* Secondary Orbital Curve 2 */}
      <svg
        className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] text-[#E9785B]/[0.05] animate-orbit-float"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="250" cy="250" rx="230" ry="160" stroke="currentColor" strokeWidth="1" />
        <circle cx="480" cy="250" r="3" fill="#D8A84E" opacity="0.4" />
      </svg>

      {/* Subtle Floating Financial Symbols & Dots */}
      <div className="absolute top-1/4 left-1/12 text-[#3B1F3A]/10 text-xs font-serif font-bold animate-orbit-float">
        ₹
      </div>
      <div className="absolute top-2/3 left-1/6 text-[#72B8A5]/15 text-sm font-sans animate-orbit-float" style={{ animationDelay: '3s' }}>
        ✦
      </div>
      <div className="absolute top-1/3 right-1/8 text-[#D8A84E]/15 text-xs font-sans animate-orbit-float" style={{ animationDelay: '5s' }}>
        •
      </div>
      <div className="absolute bottom-1/4 right-1/4 text-[#3B1F3A]/10 text-xs font-serif animate-orbit-float" style={{ animationDelay: '7s' }}>
        ₹
      </div>
    </div>
  )
}
