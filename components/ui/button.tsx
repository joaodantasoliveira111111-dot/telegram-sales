import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: [
          'text-white shadow-lg',
          'bg-gradient-to-br from-blue-500 to-blue-700',
          'shadow-blue-500/25',
          'hover:from-blue-400 hover:to-blue-600',
          'hover:shadow-blue-500/40',
        ].join(' '),
        destructive: [
          'text-white shadow-lg',
          'bg-gradient-to-br from-red-500 to-red-700',
          'shadow-red-500/20',
          'hover:from-red-400 hover:to-red-600',
        ].join(' '),
        outline: [
          'border text-slate-200',
          'hover:text-white',
        ].join(' '),
        secondary: [
          'text-slate-200',
        ].join(' '),
        ghost: 'text-slate-300 hover:text-slate-100',
        link: 'text-blue-400 underline-offset-4 hover:underline',
        success: [
          'text-white shadow-lg',
          'bg-gradient-to-br from-emerald-500 to-emerald-700',
          'shadow-emerald-500/20',
          'hover:from-emerald-400 hover:to-emerald-600',
        ].join(' '),
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// Inline styles for glass variants (can't use dynamic values in cva)
function getVariantStyle(variant?: string | null): React.CSSProperties {
  if (variant === 'outline') {
    return {
      background: 'rgba(255,255,255,0.04)',
      borderColor: 'rgba(255,255,255,0.12)',
    }
  }
  if (variant === 'secondary') {
    return {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.1)',
    }
  }
  if (variant === 'ghost') {
    return {
      background: 'transparent',
    }
  }
  return {}
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ ...getVariantStyle(variant), ...style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
