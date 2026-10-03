import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate, fullName } from '@/lib/utils'
import type { Paginated, ProgressRecord, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function ProgressPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      trainee_id: '',
      notes: '',
      recorded_at: '',
      skill_name: '',
      rating: 5,
    },
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => (await api.get<Paginated<ProgressRecord>>('/progress')).data,
  })

  const traineesQuery = useQuery({
    queryKey: ['trainees-options'],
    queryFn: async () => (await api.get<Paginated<Trainee>>('/trainees')).data.data,
  })

  const createMutation = useMutation({
    mutationFn: async (values: {
      trainee_id: string
      notes?: string
      recorded_at?: string
      skill_name?: string
      rating?: number
    }) => {
      await api.post('/progress', {
        trainee_id: Number(values.trainee_id),
        notes: values.notes || undefined,
        recorded_at: values.recorded_at || undefined,
        skills: values.skill_name
          ? [{ skill_name: values.skill_name, rating: values.rating }]
          : undefined,
      })
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      setOpen(false)
      form.reset()
      await queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })

  return (
    <div>
      <PageHeader
        title={t('progress.title')}
        description={t('progress.subtitle')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('progress.add')}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? <EmptyBlock title={t('progress.empty')} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {data?.data?.map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{fullName(row.trainee?.user)}</p>
                <span className="text-xs text-slate-500">{formatDate(row.recorded_at)}</span>
              </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('progress.add')}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}>
            <div className="space-y-2">
              <Label>{t('subscriptions.trainee')}</Label>
              <Select
                value={form.watch('trainee_id')}
                onValueChange={(v) => form.setValue('trainee_id', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(traineesQuery.data || []).map((tr) => (
                    <SelectItem key={tr.id} value={String(tr.id)}>
                      {fullName(tr.user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('progress.skill')}</Label>
              <Input {...form.register('skill_name')} />
            </div>
            <div className="space-y-2">
              <Label>{t('progress.rating')}</Label>
              <Input type="number" min={1} max={10} {...form.register('rating', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('progress.recordedAt')}</Label>
              <Input type="date" {...form.register('recorded_at')} />
            </div>
            <div className="space-y-2">
              <Label>{t('app.notes')}</Label>
              <Textarea {...form.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('app.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
