import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock3, MapPin, NotebookPen, Package, QrCode, ScanLine, UserRound } from 'lucide-react'
import type { Attendance } from '@/types'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn, formatDate, formatDateTime, formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyBlock } from '@/components/common/query-state'

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

function methodIcon(method?: string | null) {
  switch (method) {
    case 'qr_scan':
      return ScanLine
    case 'self_check_in':
      return QrCode
    default:
      return UserRound
  }
}

function DetailRow({
  icon: Icon,
  label,
  children,
  wide = false,
}: {
  icon: typeof CalendarDays
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={cn('flex items-start gap-2', wide && 'sm:col-span-2')}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <div>{children}</div>
      </div>
    </div>
  )
}

export function AttendanceSummaryCards({ records }: { records: Attendance[] }) {
  const { t } = useTranslation()
  const { dir, textAlign } = useLocaleLayout()

  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, total: records.length }
    for (const row of records) {
      const key = row.status as keyof typeof counts
      if (key in counts && key !== 'total') counts[key] += 1
    }
    const attended = counts.present + counts.late
    const rate = counts.total ? Math.round((attended / counts.total) * 100) : 0
    return { ...counts, attended, rate }
  }, [records])

  const items = [
    { key: 'total', label: t('attendance.totalRecords'), value: stats.total },
    { key: 'present', label: t('attendance.present'), value: stats.present },
    { key: 'late', label: t('attendance.late'), value: stats.late },
    { key: 'absent', label: t('attendance.absent'), value: stats.absent },
    { key: 'rate', label: t('attendance.attendanceRate'), value: `${stats.rate}%` },
  ]

  return (
    <div dir={dir} className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5', textAlign)}>
      {items.map((item) => (
        <Card key={item.key}>
          <CardContent className={cn('p-4', textAlign)}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-brand-950">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AttendanceHistoryList({
  records,
  emptyTitle,
  emptyDescription,
  showTrainee = false,
}: {
  records: Attendance[]
  emptyTitle?: string
  emptyDescription?: string
  showTrainee?: boolean
}) {
  const { t } = useTranslation()
  const { dir, textAlign, locale } = useLocaleLayout()

  if (!records.length) {
    return (
      <div dir={dir} className={textAlign}>
        <EmptyBlock
          title={emptyTitle || t('attendance.empty')}
          description={emptyDescription || t('attendance.emptyDescription')}
        />
      </div>
    )
  }

  return (
    <div dir={dir} className={cn('space-y-3', textAlign)}>
      {records.map((row) => {
        const MethodIcon = methodIcon(row.check_in_method)
        const hasLocation = row.latitude != null && row.longitude != null

        return (
          <Card key={row.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className={cn('space-y-3 p-4', textAlign)}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(row.status)}>
                    {t(`attendance.${row.status || 'present'}`, {
                      defaultValue: row.status || '—',
                    })}
                  </Badge>
                  <Badge variant="outline" className="inline-flex items-center gap-1">
                    <MethodIcon className="h-3 w-3" />
                    {t(`attendance.methods.${row.check_in_method || 'manual'}`, {
                      defaultValue: row.check_in_method || t('attendance.methods.manual'),
                    })}
                  </Badge>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <DetailRow icon={CalendarDays} label={t('attendance.date')}>
                    <p className="font-medium">{formatDate(row.attendance_date, locale)}</p>
                  </DetailRow>

                  <DetailRow icon={Clock3} label={t('attendance.checkInTime')}>
                    <p className="font-medium">
                      {row.checked_in_at
                        ? formatTime(row.checked_in_at, locale)
                        : t('attendance.noCheckInTime')}
                    </p>
                    {row.checked_in_at ? (
                      <p className="text-xs text-slate-500">
                        {formatDateTime(row.checked_in_at, locale)}
                      </p>
                    ) : null}
                  </DetailRow>

                  {(row.subscription?.package?.name || row.subscription_id) && (
                    <DetailRow icon={Package} label={t('attendance.subscription')}>
                      <p className="font-medium">
                        {row.subscription?.package?.name ||
                          t('attendance.subscriptionId', { id: row.subscription_id })}
                      </p>
                      {row.subscription?.remaining_sessions != null ? (
                        <p className="text-xs text-slate-500">
                          {t('attendance.remainingAfter', {
                            count: row.subscription.remaining_sessions,
                          })}
                        </p>
                      ) : null}
                    </DetailRow>
                  )}

                  {showTrainee && row.trainee?.user ? (
                    <DetailRow icon={UserRound} label={t('subscriptions.trainee')}>
                      <p className="font-medium">
                        {[row.trainee.user.first_name, row.trainee.user.last_name]
                          .filter(Boolean)
                          .join(' ') ||
                          row.trainee.user.name ||
                          '—'}
                      </p>
                    </DetailRow>
                  ) : null}

                  {hasLocation ? (
                    <DetailRow icon={MapPin} label={t('attendance.location')} wide>
                      <p className="font-mono text-xs sm:text-sm">
                        {Number(row.latitude).toFixed(5)}, {Number(row.longitude).toFixed(5)}
                      </p>
                      <a
                        className="text-xs font-semibold text-brand-700 hover:underline"
                        href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('attendance.openMap')}
                      </a>
                    </DetailRow>
                  ) : null}

                  {row.notes ? (
                    <DetailRow icon={NotebookPen} label={t('app.notes')} wide>
                      <p className="leading-relaxed">{row.notes}</p>
                    </DetailRow>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
