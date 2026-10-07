import * as React from 'react'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    const { dir } = useLocaleLayout()

    return (
      <input
        type={type}
        dir={dir}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-start text-sm text-slate-ink shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
