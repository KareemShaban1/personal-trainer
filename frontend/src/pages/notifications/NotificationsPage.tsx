import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { AppNotification } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface NotificationsResponse {
  data: AppNotification[]
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>('/notifications')
      return data.data
    },
  })

  const markAll = useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: async () => {
      toast.success(t('notifications.markAll'))
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markOne = useMutation({
    mutationFn: async (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        actions={
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            {t('notifications.markAll')}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.length ? <EmptyBlock title={t('notifications.empty')} /> : null}

      <div className="space-y-3">
        {data?.map((notification) => (
          <Card key={notification.id} className={!notification.read_at ? 'ring-1 ring-brand-200' : undefined}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">
                  {String(notification.data?.title || notification.data?.message || notification.type)}
                </p>
                {notification.data?.body ? (
                  <p className="mt-1 text-sm text-slate-600">{String(notification.data.body)}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">{formatDate(notification.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read_at ? <Badge>{t('notifications.unread')}</Badge> : null}
                {!notification.read_at ? (
                  <Button size="sm" variant="outline" onClick={() => markOne.mutate(notification.id)}>
                    {t('app.confirm')}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
