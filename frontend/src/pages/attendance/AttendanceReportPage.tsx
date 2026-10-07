import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ClipboardPlus, FileBarChart2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, formatDate, fullName } from '@/lib/utils'
import type { Attendance, Paginated, Trainee } from '@/types'
import {
  AttendanceHistoryList,
  AttendanceSummaryCards,
} from '@/components/attendance/attendance-history'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type RangePreset = 'day' | 'week' | 'month' | 'custom'

function toIsoDate(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function rangeForPreset(preset: RangePreset, customFrom: string, customTo: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = toIsoDate(today)

  if (preset === 'day') {
    return { from: todayIso, to: todayIso }
  }
  if (preset === 'week') {
    return { from: toIsoDate(startOfWeek(today)), to: todayIso }
  }
  if (preset === 'month') {
    return { from: toIsoDate(startOfMonth(today)), to: todayIso }
  }
  return { from: customFrom || undefined, to: customTo || undefined }
}

function statusVariant(status?: string | null): 'success' | 'warning' | 'danger' | 'secondary' | 'default' {
  switch (status) {
    case 'present':
      return 'success'
    case 'late':
      return 'warning'
    case 'absent':
      return 'danger'
    case 'excused':
      return 'secondary'
    default:
      return 'default'
  }
}

export function AttendanceReportPage() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<RangePreset>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [traineeId, setTraineeId] = useState('all')

  const range = useMemo(
    () => rangeForPreset(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  )

  const traineesQuery = useQuery({
    queryKey: ['trainees-attendance-report'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Trainee>>('/trainees', {
        params: { per_page: 200 },
      })
      return data.data
    },
  })

  const reportQuery = useQuery({
    queryKey: ['attendance-report', range.from, range.to, traineeId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Attendance>>('/attendance', {
        params: {
          from: range.from,
          to: range.to,
          trainee_id: traineeId !== 'all' ? Number(traineeId) : undefined,
          per_page: 200,
        },
      })
      return data.data
    },
  })

  const records = reportQuery.data || []
  const trainees = traineesQuery.data || []
  const selectedTrainee = trainees.find((row) => String(row.id) === traineeId)

  const presetOptions: Array<{ value: RangePreset; label: string }> = [
    { value: 'day', label: t('attendance.report.day') },
    { value: 'week', label: t('attendance.report.week') },
    { value: 'month', label: t('attendance.report.month') },
    { value: 'custom', label: t('attendance.report.custom') },
  ]

  return (
    <div>
      <PageHeader
        title={t('attendance.report.title')}
        description={t('attendance.report.subtitle')}
        actions={
          <Button asChild variant="outline">
            <Link to="/attendance">
              <ClipboardPlus className="h-4 w-4" />
              {t('attendance.mark')}
            </Link>
          </Button>
        }
      />

      <div className="mb-4 space-y-4 rounded-2xl border border-border-subtle bg-white p-4">
        <div>
          <Label className="mb-2 block">{t('attendance.report.range')}</Label>
          <div className="flex flex-wrap gap-2">
            {presetOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={preset === option.value ? 'default' : 'outline'}
                onClick={() => setPreset(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {preset === 'custom' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="attendance-report-from">{t('app.from')}</Label>
                <Input
                  id="attendance-report-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance-report-to">{t('app.to')}</Label>
                <Input
                  id="attendance-report-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('attendance.report.activeRange')}</Label>
              <p className="rounded-xl border border-border-subtle bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {range.from && range.to
                  ? range.from === range.to
                    ? formatDate(range.from)
                    : `${formatDate(range.from)} → ${formatDate(range.to)}`
                  : t('attendance.report.selectRange')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('subscriptions.trainee')}</Label>
            <Select value={traineeId} onValueChange={setTraineeId}>
              <SelectTrigger>
                <SelectValue placeholder={t('attendance.report.allTrainees')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('attendance.report.allTrainees')}</SelectItem>
                {trainees.map((trainee) => (
                  <SelectItem key={trainee.id} value={String(trainee.id)}>
                    {fullName(trainee.user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(range.from || range.to || traineeId !== 'all') && (
          <p className="text-xs text-slate-500">
            <FileBarChart2 className="mr-1 inline h-3.5 w-3.5" />
            {t('attendance.report.showing', {
              range:
                range.from && range.to
                  ? range.from === range.to
                    ? formatDate(range.from)
                    : `${formatDate(range.from)} – ${formatDate(range.to)}`
                  : t('attendance.report.allDates'),
              trainee:
                traineeId === 'all'
                  ? t('attendance.report.allTrainees')
                  : fullName(selectedTrainee?.user),
            })}
          </p>
        )}
      </div>

      {reportQuery.isLoading || traineesQuery.isLoading ? <LoadingBlock /> : null}
      {reportQuery.isError ? (
        <ErrorBlock onRetry={() => void reportQuery.refetch()} />
      ) : null}

      {!reportQuery.isLoading && !reportQuery.isError ? (
        <div className="space-y-4">
          {records.length ? <AttendanceSummaryCards records={records} /> : null}

          <div className="hidden overflow-hidden rounded-2xl border border-border-subtle bg-white md:block">
            {records.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('attendance.date')}</TableHead>
                    <TableHead>{t('subscriptions.trainee')}</TableHead>
                    <TableHead>{t('attendance.status')}</TableHead>
                    <TableHead>{t('attendance.method')}</TableHead>
                    <TableHead>{t('app.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.attendance_date)}</TableCell>
                      <TableCell className="font-medium">{fullName(row.trainee?.user)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>
                          {t(`attendance.${row.status || 'present'}`, {
                            defaultValue: row.status || '—',
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {t(`attendance.methods.${row.check_in_method || 'manual'}`, {
                          defaultValue: row.check_in_method || t('attendance.methods.manual'),
                        })}
                      </TableCell>
                      <TableCell className={cn('max-w-xs truncate text-slate-600')}>
                        {row.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4">
                <EmptyBlock
                  title={t('attendance.empty')}
                  description={t('attendance.report.emptyDescription')}
                />
              </div>
            )}
          </div>

          <div className="md:hidden">
            <AttendanceHistoryList
              records={records}
              showTrainee
              emptyTitle={t('attendance.empty')}
              emptyDescription={t('attendance.report.emptyDescription')}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
