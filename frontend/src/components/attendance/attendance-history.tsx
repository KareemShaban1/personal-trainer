import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock3, MapPin, NotebookPen, Package, QrCode, ScanLine, UserRound } from 'lucide-react'
import type { Attendance } from '@/types'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { formatDate, formatDateTime, formatTime } from '@/lib/utils'
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
  dir,
  isRtl,
  wide = false,
}: {
  icon: typeof CalendarDays
  label: string
  children: ReactNode
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  wide?: boolean
}) {
  const alignStyle: CSSProperties = {
    direction: dir,
    textAlign: isRtl ? 'right' : 'left',
  }

  return (
    <div
      className={wide ? 'sm:col-span-2' : undefined}
      style={{
        ...alignStyle,
        display: 'flex',
        flexDirection: isRtl ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '0.5rem',
      }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <div style={{ ...alignStyle, minWidth: 0, flex: 1 }}>
        <p
          className="text-xs font-medium uppercase tracking-wide text-slate-500"
          style={alignStyle}
        >
          {label}
        </p>
        <div style={alignStyle}>{children}</div>
      </div>
    </div>
  )
}

export function AttendanceSummaryCards({ records }: { records: Attendance[] }) {
  const { t } = useTranslation()
  const { dir, isRtl } = useLocaleLayout()
  const alignStyle: CSSProperties = {
    direction: dir,
    textAlign: isRtl ? 'right' : 'left',
  }

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
    <div
      dir={dir}
      style={alignStyle}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {items.map((item) => (
        <Card key={item.key}>
          <CardContent className="p-4" style={alignStyle}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500" style={alignStyle}>
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-brand-950" style={alignStyle}>
              {item.value}
            </p>
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
  const { dir, isRtl, locale } = useLocaleLayout()
  const alignStyle: CSSProperties = {
    direction: dir,
    textAlign: isRtl ? 'right' : 'left',
  }

  if (!records.length) {
    return (
      <div dir={dir} style={alignStyle}>
        <EmptyBlock
          title={emptyTitle || t('attendance.empty')}
          description={emptyDescription || t('attendance.emptyDescription')}
        />
      </div>
    )
  }

  return (
    <div dir={dir} style={alignStyle} className="space-y-3">
      {records.map((row) => {
        const MethodIcon = methodIcon(row.check_in_method)
        const hasLocation = row.latitude != null && row.longitude != null

        return (
          <Card key={row.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="space-y-3 p-4" style={alignStyle}>
                <div
                  style={{
                    ...alignStyle,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: isRtl ? 'flex-end' : 'flex-start',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                  }}
                >
                  <Badge variant={statusVariant(row.status)}>
                    {t(`attendance.${row.status || 'present'}`, {
                      defaultValue: row.status || '—',
                    })}
                  </Badge>
                  <Badge
                    variant="outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                    }}
                  >
                    <MethodIcon className="h-3 w-3" />
                    {t(`attendance.methods.${row.check_in_method || 'manual'}`, {
                      defaultValue: row.check_in_method || t('attendance.methods.manual'),
                    })}
                  </Badge>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2" style={alignStyle}>
                  <DetailRow icon={CalendarDays} label={t('attendance.date')} dir={dir} isRtl={isRtl}>
                    <p className="font-medium">{formatDate(row.attendance_date, locale)}</p>
                  </DetailRow>

                  <DetailRow
                    icon={Clock3}
                    label={t('attendance.checkInTime')}
                    dir={dir}
                    isRtl={isRtl}
                  >
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
                    <DetailRow
                      icon={Package}
                      label={t('attendance.subscription')}
                      dir={dir}
                      isRtl={isRtl}
                    >
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
                    <DetailRow
                      icon={UserRound}
                      label={t('subscriptions.trainee')}
                      dir={dir}
                      isRtl={isRtl}
                    >
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
                    <DetailRow
                      icon={MapPin}
                      label={t('attendance.location')}
                      dir={dir}
                      isRtl={isRtl}
                      wide
                    >
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
                    <DetailRow
                      icon={NotebookPen}
                      label={t('app.notes')}
                      dir={dir}
                      isRtl={isRtl}
                      wide
                    >
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
