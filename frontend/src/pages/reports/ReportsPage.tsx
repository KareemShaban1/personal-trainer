import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { api } from '@/lib/api'
import { downloadBlob } from '@/lib/utils'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ReportType = 'summary' | 'attendance' | 'revenue' | 'subscriptions'

export function ReportsPage() {
  const { t } = useTranslation()
  const [type, setType] = useState<ReportType>('summary')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const params = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', type, from, to],
    queryFn: async () => {
      if (type === 'summary') {
        const { data } = await api.get<{ summary: Record<string, unknown> }>('/reports/summary', { params })
        return { kind: 'summary' as const, summary: data.summary, rows: [] as Record<string, unknown>[] }
      }
      const { data } = await api.get<{ data: Record<string, unknown>[] }>(`/reports/${type}`, { params })
      return { kind: type, summary: null, rows: data.data || [] }
    },
  })

  async function exportCsv() {
    const response = await api.get('/reports/export', {
      params: { ...params, type: type === 'summary' ? 'attendance' : type, format: 'csv' },
      responseType: 'blob',
    })
    downloadBlob(response.data as Blob, `${type}-report.csv`)
  }

  const chartData = useMemo(() => {
    if (!data?.rows?.length) return []
    return data.rows.slice(0, 12).map((row, index) => ({
      name: String(row.date || row.label || row.name || `#${index + 1}`),
      value: Number(row.count ?? row.amount ?? row.total ?? row.value ?? 1),
    }))
  }, [data])

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.subtitle')}
        actions={
          <Button variant="outline" onClick={() => void exportCsv()}>
            <Download className="h-4 w-4" />
            {t('app.downloadCsv')}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>{t('reports.type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">{t('reports.summary')}</SelectItem>
                <SelectItem value="attendance">{t('reports.attendance')}</SelectItem>
                <SelectItem value="revenue">{t('reports.revenue')}</SelectItem>
                <SelectItem value="subscriptions">{t('reports.subscriptions')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('app.from')}</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('app.to')}</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => void refetch()}>
              {t('app.apply')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}

      {data?.kind === 'summary' && data.summary ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.summary).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{key.replaceAll('_', ' ')}</p>
                <p className="mt-2 text-xl font-bold">{String(value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {data && data.kind !== 'summary' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.chart')}</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e3e6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0f7473" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock title={t('app.noResults')} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.table')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.rows.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(data.rows[0] || {})
                        .slice(0, 4)
                        .map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx}>
                        {Object.keys(data.rows[0] || {})
                          .slice(0, 4)
                          .map((key) => (
                            <TableCell key={key}>{String(row[key] ?? '—')}</TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyBlock title={t('app.noResults')} />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
