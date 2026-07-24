import React from 'react'

type OptionPillProps = { 
    icon: React.ReactNode; 
    label: string }

function OptionPill({ icon, label }: OptionPillProps) {
  return (
    <button
      type='button'
      className='flex items-center gap-1.5 rounded-full border border-edge px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-elevated'
    >
      {icon}
      {label}
    </button>
  )
}


export default OptionPill