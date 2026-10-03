import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ClipboardPlus,
  PackagePlus,
  QrCode,
  ScanLine,
  UserPlus,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, fullName } from '@/lib/utils'
import type { DashboardData } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'

export function DashboardPage() {
  const { t } = useTranslation()
  const { organization } = useAuth()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/dashboard')
      return data
    },
  })

  const chartData =
    data?.recent_attendance?.slice(0, 8).map((item, index) => ({
      name: formatDate(item.attendance_date) || `#${index + 1}`,
      count: item.status === 'present' || item.status === 'late' ? 1 : 0,
    })) ?? []

  const stats = [
    { label: t('dashboard.trainees'), value: data?.stats.trainees_count ?? 0 },
    { label: t('dashboard.activeSubscriptions'), value: data?.stats.active_subscriptions ?? 0 },
    { label: t('dashboard.attendanceToday'), value: data?.stats.attendance_today ?? 0 },
    { label: t('dashboard.presentToday'), value: data?.stats.present_today ?? 0 },
    {
      label: t('dashboard.revenueMonth'),
      value: formatCurrency(data?.stats.revenue_this_month ?? 0, organization?.currency || 'EGP'),
    },
  ]

  const actions = [
    { to: '/attendance', label: t('dashboard.markAttendance'), icon: ClipboardPlus },
    { to: '/attendance/scan', label: t('dashboard.scanQr'), icon: ScanLine },
    { to: '/trainees/new', label: t('dashboard.addTrainee'), icon: UserPlus },
    { to: '/packages', label: t('dashboard.addPackage'), icon: PackagePlus },
    { to: '/subscriptions', label: t('dashboard.assignPackage'), icon: QrCode },
  ]

  if (isLoading) return <LoadingBlock rows={6} />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.subtitle')} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-fade-up overflow-hidden">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('dashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button key={action.to} asChild variant="secondary">
                <Link to={action.to}>
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.attendanceTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f7473" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f7473" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e3e6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#0f7473" fill="url(#tealFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock title={t('attendance.empty')} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.lowSessions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.low_session_subscriptions?.length ? (
              data.low_session_subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{fullName(sub.trainee?.user)}</p>
                    <p className="text-xs text-slate-500">{sub.package?.name}</p>
                  </div>
                  <Badge variant="warning">{sub.remaining_sessions ?? 0}</Badge>
                </div>
              ))
            ) : (
              <EmptyBlock title={t('app.emptyTitle')} description={t('app.emptyDescription')} />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.recentAttendance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.recent_attendance?.length ? (
              data.recent_attendance.slice(0, 8).map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{fullName(row.trainee?.user)}</p>
                    <p className="text-xs text-slate-500">{formatDate(row.attendance_date)}</p>
                  </div>
                  <Badge variant={row.status === 'present' ? 'success' : 'secondary'}>{row.status}</Badge>
                </div>
              ))
            ) : (
              <EmptyBlock title={t('attendance.empty')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
