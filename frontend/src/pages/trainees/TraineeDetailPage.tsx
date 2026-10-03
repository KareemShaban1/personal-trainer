import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { formatDate, formatCurrency, fullName } from '@/lib/utils'
import type { Attendance, Note, Paginated, ProgressRecord, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function TraineeDetailPage() {
  const { t } = useTranslation()
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
        params: { trainee_id: id },
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
    <div>
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
          <CardContent className="space-y-2 p-5 text-sm">
            <p><span className="text-slate-500">{t('app.phone')}:</span> {trainee.user?.phone || '—'}</p>
            <p><span className="text-slate-500">{t('app.email')}:</span> {trainee.user?.email || '—'}</p>
            <p><span className="text-slate-500">{t('trainees.code')}:</span> {trainee.code || '—'}</p>
            <Badge variant={trainee.status === 'active' ? 'success' : 'secondary'}>
              {trainee.status || '—'}
            </Badge>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('trainees.qr')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-3 ring-1 ring-border-subtle">
              <QRCodeSVG value={`trainee:${trainee.id}:${trainee.code || trainee.id}`} size={120} />
            </div>
            <p className="text-sm text-slate-500">{t('traineePortal.showQr')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="subscriptions">{t('trainees.subscriptions')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('trainees.attendanceSummary')}</TabsTrigger>
          <TabsTrigger value="progress">{t('trainees.progress')}</TabsTrigger>
          <TabsTrigger value="notes">{t('trainees.notes')}</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-2">
          {trainee.subscriptions?.length ? (
            trainee.subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
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
            ))
          ) : (
            <EmptyBlock title={t('subscriptions.empty')} />
          )}
        </TabsContent>

        <TabsContent value="attendance">
          {attendanceQuery.isLoading ? <LoadingBlock /> : null}
          {attendanceQuery.data?.length ? (
            <div className="space-y-2">
              {attendanceQuery.data.map((row) => (
                <div key={row.id} className="flex justify-between rounded-xl border bg-white px-3 py-2">
                  <span>{formatDate(row.attendance_date)}</span>
                  <Badge>{row.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            !attendanceQuery.isLoading && <EmptyBlock title={t('attendance.empty')} />
          )}
        </TabsContent>

        <TabsContent value="progress">
          {progressQuery.isLoading ? <LoadingBlock /> : null}
          {progressQuery.data?.length ? (
            <div className="space-y-2">
              {progressQuery.data.map((row) => (
                <Card key={row.id}>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold">{formatDate(row.recorded_at)}</p>
                    <p className="text-sm text-slate-600">{row.notes || '—'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !progressQuery.isLoading && <EmptyBlock title={t('progress.empty')} />
          )}
        </TabsContent>

        <TabsContent value="notes">
          {notesQuery.isLoading ? <LoadingBlock /> : null}
          {notesQuery.data?.length ? (
            <div className="space-y-2">
              {notesQuery.data.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <p className="text-sm">{note.body}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {note.visibility} · {formatDate(note.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !notesQuery.isLoading && <EmptyBlock title={t('notes.empty')} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
