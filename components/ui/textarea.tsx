import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all duration-150',
          className
        )}
        style={{
          background: 'rgba(255,255,255,0.80)',
          borderColor: 'rgba(0,0,0,0.12)',
          color: '#1a1625',
          ...style,
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
