import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate, fullName } from '@/lib/utils'
import type { Note, Paginated, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function NotesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      notable_id: '',
      body: '',
      visibility: 'internal',
    },
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => (await api.get<Paginated<Note>>('/notes')).data,
  })

  const traineesQuery = useQuery({
    queryKey: ['trainees-options'],
    queryFn: async () => (await api.get<Paginated<Trainee>>('/trainees')).data.data,
  })

  const createMutation = useMutation({
    mutationFn: async (values: { notable_id: string; body: string; visibility: string }) => {
      await api.post('/notes', {
        notable_type: 'App\\Models\\Trainee',
        notable_id: Number(values.notable_id),
        body: values.body,
        visibility: values.visibility,
      })
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      setOpen(false)
      form.reset({ notable_id: '', body: '', visibility: 'internal' })
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/notes/${id}`),
    onSuccess: async () => {
      toast.success(t('app.delete'))
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  return (
    <div>
      <PageHeader
        title={t('notes.title')}
        description={t('notes.subtitle')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('notes.add')}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? <EmptyBlock title={t('notes.empty')} /> : null}

      <div className="space-y-3">
        {data?.data?.map((note) => (
          <Card key={note.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm">{note.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {fullName(note.author)} · {formatDate(note.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{note.visibility}</Badge>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm(t('app.confirm'))) deleteMutation.mutate(note.id)
                  }}
                >
                  {t('app.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('notes.add')}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}>
            <div className="space-y-2">
              <Label>{t('subscriptions.trainee')}</Label>
              <Select
                value={form.watch('notable_id')}
                onValueChange={(v) => form.setValue('notable_id', v)}
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
              <Label>{t('notes.visibility')}</Label>
              <Select
                value={form.watch('visibility')}
                onValueChange={(v) => form.setValue('visibility', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t('notes.internal')}</SelectItem>
                  <SelectItem value="shared_with_parent">{t('notes.shared')}</SelectItem>
                  <SelectItem value="private">{t('notes.private')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('notes.body')}</Label>
              <Textarea {...form.register('body', { required: true })} />
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
