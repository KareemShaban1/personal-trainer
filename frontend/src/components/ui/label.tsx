import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { dir } = useLocaleLayout()

  return (
    <LabelPrimitive.Root
      ref={ref}
      dir={dir}
      className={cn(
        'block w-full text-start text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
})
Label.displayName = LabelPrimitive.Root.displayName
