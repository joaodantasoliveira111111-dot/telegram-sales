import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.1)',
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, style, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-xl border px-3 py-1 text-sm text-slate-100 shadow-sm placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150',
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
