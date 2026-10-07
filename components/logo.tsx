import React from 'react'

export function Logo({ className = "h-10", showText = true }: { className?: string, showText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* The SVG Icon */}
      <svg viewBox="0 0 40 40" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="url(#jgt_gradient_main)"/>
        <circle cx="20" cy="15" r="6" fill="white"/>
        <path d="M10 24C10 24 15 19 20 24C25 29 30 24 30 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 30C10 30 15 25 20 30C25 35 30 30 30 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="jgt_gradient_main" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#dfa241"/>
            <stop offset="1" stopColor="#b8731b"/>
          </linearGradient>
        </defs>
      </svg>

      {/* The Brand Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-bold text-xl leading-none text-slate-900 tracking-tight">Jazgot Tours</span>
          <span className="text-[10px] font-bold text-[#ce9136] uppercase tracking-widest mt-1">El Nido, Palawan</span>
        </div>
      )}
    </div>
  )
}