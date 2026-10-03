import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { fullName } from '@/lib/utils'
import type { Paginated, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounce } from '@/hooks/use-debounce'

export function TraineesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainees', debounced],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Trainee>>('/trainees', {
        params: { q: debounced || undefined },
      })
      return data
    },
  })

  return (
    <div>
      <PageHeader
        title={t('trainees.title')}
        description={t('trainees.subtitle')}
        actions={
          <Button asChild>
            <Link to="/trainees/new">
              <Plus className="h-4 w-4" />
              {t('trainees.add')}
            </Link>
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="ps-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('app.search')} />
        </div>
      </div>

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? (
        <EmptyBlock
          title={t('trainees.empty')}
          actionLabel={t('trainees.add')}
          onAction={() => navigate('/trainees/new')}
        />
      ) : null}

      {data?.data?.length ? (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('app.name')}</TableHead>
                <TableHead>{t('app.phone')}</TableHead>
                <TableHead>{t('trainees.code')}</TableHead>
                <TableHead>{t('app.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((trainee) => (
                <TableRow key={trainee.id}>
                  <TableCell className="font-medium">{fullName(trainee.user)}</TableCell>
                  <TableCell>{trainee.user?.phone || '—'}</TableCell>
                  <TableCell>{trainee.code || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={trainee.status === 'active' ? 'success' : 'secondary'}>
                      {trainee.status || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/trainees/${trainee.id}`}>{t('app.view')}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
