import * as React from 'react'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    const { dir } = useLocaleLayout()

    return (
      <textarea
        dir={dir}
        className={cn(
          'flex min-h-[96px] w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-start text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'
