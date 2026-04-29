import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.80)',
  borderColor: 'rgba(0,0,0,0.12)',
  color: '#1a1625',
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, style, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-xl border px-3 py-1 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150',
        className
      )}
      style={{ ...inputStyle, ...style }}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
