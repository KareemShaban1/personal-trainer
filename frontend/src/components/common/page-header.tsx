import type { ReactNode } from 'react'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { dir, textAlign, isRtl } = useLocaleLayout()

  return (
    <div
      dir={dir}
      className={cn(
        'mb-6 flex flex-col gap-3 sm:items-end sm:justify-between',
        isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row',
        textAlign,
      )}
    >
      <div className={cn('animate-fade-up', textAlign)}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-ink sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            'animate-fade-up-delay flex flex-wrap gap-2',
            isRtl ? 'justify-end sm:justify-start' : 'justify-start sm:justify-end',
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}
