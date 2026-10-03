import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function ErrorBlock({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-6 py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-red-600" />
      <p className="text-sm text-red-700">{message || t('app.somethingWrong')}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {t('app.tryAgain')}
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyBlock({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  const { t } = useTranslation()
  return (
    <EmptyState
      title={title || t('app.emptyTitle')}
      description={description || t('app.emptyDescription')}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  )
}
