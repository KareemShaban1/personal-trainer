import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { i18n } = useTranslation()
  const isRtl = i18n.language?.startsWith('ar')

  return (
    <LabelPrimitive.Root
      ref={ref}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'block w-full text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        isRtl ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    />
  )
})
Label.displayName = LabelPrimitive.Root.displayName
