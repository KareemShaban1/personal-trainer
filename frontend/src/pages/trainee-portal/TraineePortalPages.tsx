import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, fullName } from '@/lib/utils'
import type { Attendance, Paginated, ProgressRecord, Subscription, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import {
  AttendanceHistoryList,
  AttendanceSummaryCards,
} from '@/components/attendance/attendance-history'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn } from '@/lib/utils'

function useMyTrainee() {
  return useQuery({
    queryKey: ['my-trainee'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Trainee>>('/trainees')
      return data.data[0] || null
    },
  })
}

export function TraineeDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const traineeQuery = useMyTrainee()
  const attendanceQuery = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => (await api.get<Paginated<Attendance>>('/attendance')).data.data,
  })

  if (traineeQuery.isLoading || attendanceQuery.isLoading) return <LoadingBlock />
  if (traineeQuery.isError) return <ErrorBlock onRetry={() => void traineeQuery.refetch()} />

  const activeSub = traineeQuery.data?.subscriptions?.find((s) => s.status === 'active')

  return (
    <div>
      <PageHeader
        title={`${t('traineePortal.dashboard')}, ${user?.first_name || ''}`}
        description={t('traineePortal.welcome')}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-slate-500">{t('subscriptions.remaining')}</p>
            <p className="mt-2 text-3xl font-bold text-brand-800">
              {activeSub?.remaining_sessions ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-slate-500">{t('subscriptions.package')}</p>
            <p className="mt-2 text-lg font-semibold">{activeSub?.package?.name || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-slate-500">{t('nav.attendance')}</p>
            <p className="mt-2 text-3xl font-bold">{attendanceQuery.data?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function TraineeSubscriptionPage() {
  const { t } = useTranslation()
  const traineeQuery = useMyTrainee()
  const subsQuery = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => (await api.get<Paginated<Subscription>>('/subscriptions')).data.data,
  })

  if (traineeQuery.isLoading || subsQuery.isLoading) return <LoadingBlock />
  if (subsQuery.isError) return <ErrorBlock onRetry={() => void subsQuery.refetch()} />

  return (
    <div>
      <PageHeader title={t('nav.mySubscription')} />
      {!subsQuery.data?.length ? <EmptyBlock title={t('subscriptions.empty')} /> : null}
      <div className="space-y-3">
        {subsQuery.data?.map((sub) => (
          <Card key={sub.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{sub.package?.name}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(sub.started_at)} → {formatDate(sub.ends_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{sub.status}</Badge>
                <Badge variant="warning">{sub.remaining_sessions ?? 0}</Badge>
                <span className="text-sm">
                  {formatCurrency(sub.package?.price, sub.package?.currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TraineeAttendancePage() {
  const { t } = useTranslation()
  const { dir, textAlign } = useLocaleLayout()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () =>
      (
        await api.get<Paginated<Attendance>>('/attendance', {
          params: { per_page: 100 },
        })
      ).data.data,
  })

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  const records = data ?? []

  return (
    <div dir={dir} className={cn('space-y-5', textAlign)}>
      <PageHeader
        title={t('nav.myAttendance')}
        description={t('attendance.myHistorySubtitle')}
      />
      {records.length ? <AttendanceSummaryCards records={records} /> : null}
      <AttendanceHistoryList
        records={records}
        emptyTitle={t('attendance.empty')}
        emptyDescription={t('attendance.emptyDescription')}
      />
    </div>
  )
}

export function TraineeProgressPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-progress'],
    queryFn: async () => (await api.get<Paginated<ProgressRecord>>('/progress')).data.data,
  })

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('nav.myProgress')} />
      {!data?.length ? <EmptyBlock title={t('progress.empty')} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-semibold">{formatDate(row.recorded_at)}</p>
              <p className="text-sm text-slate-600">{row.notes || '—'}</p>
              <div className="flex flex-wrap gap-2">
                {(row.skills || []).map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill.skill_name}: {skill.rating ?? '—'}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TraineeQrPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-qr'],
    queryFn: async () => {
      const { data } = await api.get<{ token: string; type: string }>('/attendance/my-qr')
      return data
    },
  })

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('traineePortal.myQr')} description={t('traineePortal.showQr')} />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{fullName({ name: data?.type })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {data?.token ? (
            <>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-border-subtle">
                <QRCodeSVG value={data.token} size={220} />
              </div>
              <code className="break-all text-xs text-slate-500">{data.token}</code>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
