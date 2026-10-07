import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { cn, formatCurrency, formatDate, fullName } from '@/lib/utils'
import type { Attendance, Note, Paginated, ProgressRecord, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import {
  AttendanceHistoryList,
  AttendanceSummaryCards,
} from '@/components/attendance/attendance-history'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocaleLayout } from '@/hooks/use-locale-layout'

export function TraineeDetailPage() {
  const { t } = useTranslation()
  const { dir, textAlign, locale } = useLocaleLayout()
  const { id } = useParams()

  const traineeQuery = useQuery({
    queryKey: ['trainee', id],
    queryFn: async () => {
      const { data } = await api.get<{ trainee: Trainee } | Trainee>(`/trainees/${id}`)
      return 'trainee' in data ? data.trainee : data
    },
  })

  const attendanceQuery = useQuery({
    queryKey: ['trainee-attendance', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Attendance>>('/attendance', {
        params: { trainee_id: id, per_page: 100 },
      })
      return data.data
    },
  })

  const progressQuery = useQuery({
    queryKey: ['trainee-progress', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ProgressRecord>>('/progress', {
        params: { trainee_id: id },
      })
      return data.data
    },
  })

  const notesQuery = useQuery({
    queryKey: ['trainee-notes', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Paginated<Note>>('/notes', {
        params: {
          notable_type: 'App\\Models\\Trainee',
          notable_id: id,
        },
      })
      return data.data
    },
  })

  if (traineeQuery.isLoading) return <LoadingBlock />
  if (traineeQuery.isError || !traineeQuery.data)
    return <ErrorBlock onRetry={() => void traineeQuery.refetch()} />

  const trainee = traineeQuery.data

  return (
    <div dir={dir} className={cn('w-full', textAlign)}>
      <PageHeader
        title={fullName(trainee.user)}
        description={t('trainees.detail')}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/trainees">{t('app.back')}</Link>
            </Button>
            <Button asChild>
              <Link to={`/trainees/${id}/edit`}>{t('app.edit')}</Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className={cn('space-y-2 p-5 text-sm', textAlign)}>
            <p>
              <span className="text-slate-500">{t('app.phone')}: </span>
              {trainee.user?.phone || '—'}
            </p>
            <p>
              <span className="text-slate-500">{t('app.email')}: </span>
              {trainee.user?.email || '—'}
            </p>
            <p>
              <span className="text-slate-500">{t('trainees.code')}: </span>
              {trainee.code || '—'}
            </p>
            <div className="flex justify-start">
              <Badge variant={trainee.status === 'active' ? 'success' : 'secondary'}>
                {trainee.status === 'active' ? t('app.active') : trainee.status || '—'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className={textAlign}>
            <CardTitle>{t('trainees.qr')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 p-5 pt-0">
            <div className="rounded-xl bg-white p-3 ring-1 ring-border-subtle">
              <QRCodeSVG value={`trainee:${trainee.id}:${trainee.code || trainee.id}`} size={120} />
            </div>
            <p className={cn('text-sm text-slate-500', textAlign)}>{t('traineePortal.showQr')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" dir={dir}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="subscriptions">{t('trainees.subscriptions')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('trainees.attendanceSummary')}</TabsTrigger>
          <TabsTrigger value="progress">{t('trainees.progress')}</TabsTrigger>
          <TabsTrigger value="notes">{t('trainees.notes')}</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-2">
          {trainee.subscriptions?.length ? (
            trainee.subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className={cn('min-w-0', textAlign)}>
                    <p className="font-semibold">{sub.package?.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(sub.started_at, locale)} → {formatDate(sub.ends_at, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{sub.status || '—'}</Badge>
                    <Badge variant="warning">
                      {sub.remaining_sessions ?? 0} {t('subscriptions.remaining')}
                    </Badge>
                    <span className="text-sm">
                      {formatCurrency(sub.package?.price, sub.package?.currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyBlock title={t('subscriptions.empty')} />
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-5">
          {attendanceQuery.isLoading ? <LoadingBlock /> : null}
          {!attendanceQuery.isLoading ? (
            <>
              <div className={textAlign}>
                <h3 className="text-base font-semibold text-brand-950">{t('attendance.historyTitle')}</h3>
                <p className="mt-1 text-sm text-slate-500">{t('attendance.traineeHistorySubtitle')}</p>
              </div>
              {attendanceQuery.data?.length ? (
                <AttendanceSummaryCards records={attendanceQuery.data} />
              ) : null}
              <AttendanceHistoryList
                records={attendanceQuery.data ?? []}
                emptyTitle={t('attendance.empty')}
                emptyDescription={t('attendance.emptyDescription')}
              />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="progress" className="space-y-2">
          {progressQuery.isLoading ? <LoadingBlock /> : null}
          {progressQuery.data?.length ? (
            progressQuery.data.map((row) => (
              <Card key={row.id}>
                <CardContent className={cn('p-4', textAlign)}>
                  <p className="text-sm font-semibold">{formatDate(row.recorded_at, locale)}</p>
                  <p className="text-sm text-slate-600">{row.notes || '—'}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            !progressQuery.isLoading && <EmptyBlock title={t('progress.empty')} />
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-2">
          {notesQuery.isLoading ? <LoadingBlock /> : null}
          {notesQuery.data?.length ? (
            notesQuery.data.map((note) => (
              <Card key={note.id}>
                <CardContent className={cn('p-4', textAlign)}>
                  <p className="text-sm">{note.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t(`notes.${note.visibility}`, { defaultValue: note.visibility })} ·{' '}
                    {formatDate(note.created_at, locale)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            !notesQuery.isLoading && <EmptyBlock title={t('notes.empty')} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
