import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    const { i18n } = useTranslation()
    const isRtl = i18n.language?.startsWith('ar')

    return (
      <textarea
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(
          'flex min-h-[96px] w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50',
          isRtl ? 'text-right' : 'text-left',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'
