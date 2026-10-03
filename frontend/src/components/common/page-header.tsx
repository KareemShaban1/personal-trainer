import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-slate-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="animate-fade-up-delay flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
