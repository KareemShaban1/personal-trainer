import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { formatDate, fullName } from '@/lib/utils'
import type { Attendance, Paginated, ProgressRecord, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ParentChildrenPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => (await api.get<Paginated<Trainee>>('/trainees')).data.data,
  })

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('parentPortal.children')} description={t('parentPortal.subtitle')} />
      {!data?.length ? <EmptyBlock title={t('parentPortal.empty')} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((child) => (
          <Card key={child.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{fullName(child.user)}</p>
                <p className="text-xs text-slate-500">{child.code || child.user?.phone}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/trainees/${child.id}`}>{t('app.view')}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ParentAttendancePage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parent-attendance'],
    queryFn: async () => (await api.get<Paginated<Attendance>>('/attendance')).data.data,
  })

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('nav.attendance')} />
      {!data?.length ? <EmptyBlock title={t('attendance.empty')} /> : null}
      <div className="space-y-2">
        {data?.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2">
            <div>
              <p className="text-sm font-medium">{fullName(row.trainee?.user)}</p>
              <p className="text-xs text-slate-500">{formatDate(row.attendance_date)}</p>
            </div>
            <Badge>{row.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ParentProgressPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parent-progress'],
    queryFn: async () => (await api.get<Paginated<ProgressRecord>>('/progress')).data.data,
  })

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('nav.progress')} />
      {!data?.length ? <EmptyBlock title={t('progress.empty')} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold">{fullName(row.trainee?.user)}</p>
              <p className="text-xs text-slate-500">{formatDate(row.recorded_at)}</p>
              <p className="text-sm text-slate-600">{row.notes || '—'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
