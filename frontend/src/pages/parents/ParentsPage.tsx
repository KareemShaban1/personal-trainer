import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { fullName } from '@/lib/utils'
import type { Paginated, ParentProfile, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface FormValues {
  first_name: string
  last_name: string
  phone: string
  email?: string
  password?: string
}

export function ParentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ParentProfile | null>(null)
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([])
  const form = useForm<FormValues>()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parents'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ParentProfile>>('/parents')
      return data
    },
  })

  const traineesQuery = useQuery({
    queryKey: ['trainees-options'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Trainee>>('/trainees')
      return data.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        trainee_ids: selectedTrainees.map(Number),
        email: values.email || undefined,
      }
      if (editing) {
        const { password: _p, ...rest } = payload
        await api.put(`/parents/${editing.id}`, rest)
      } else {
        await api.post('/parents', payload)
      }
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      setOpen(false)
      setEditing(null)
      form.reset()
      setSelectedTrainees([])
      await queryClient.invalidateQueries({ queryKey: ['parents'] })
    },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ first_name: '', last_name: '', phone: '', email: '', password: '' })
    setSelectedTrainees([])
    setOpen(true)
  }

  function openEdit(parent: ParentProfile) {
    setEditing(parent)
    form.reset({
      first_name: parent.user?.first_name || '',
      last_name: parent.user?.last_name || '',
      phone: parent.user?.phone || '',
      email: parent.user?.email || '',
      password: '',
    })
    setSelectedTrainees((parent.trainees || []).map((tr) => String(tr.id)))
    setOpen(true)
  }

  return (
    <div>
      <PageHeader
        title={t('parents.title')}
        description={t('parents.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('parents.add')}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? <EmptyBlock title={t('parents.empty')} /> : null}

      {data?.data?.length ? (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('app.name')}</TableHead>
                <TableHead>{t('app.phone')}</TableHead>
                <TableHead>{t('parents.children')}</TableHead>
                <TableHead>{t('app.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell className="font-medium">{fullName(parent.user)}</TableCell>
                  <TableCell>{parent.user?.phone || '—'}</TableCell>
                  <TableCell>{parent.trainees?.length ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{parent.status || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button size="sm" variant="outline" onClick={() => openEdit(parent)}>
                      {t('app.edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('parents.edit') : t('parents.add')}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label>{t('auth.firstName')}</Label>
              <Input {...form.register('first_name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.lastName')}</Label>
              <Input {...form.register('last_name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('app.phone')}</Label>
              <Input {...form.register('phone', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('app.email')}</Label>
              <Input type="email" {...form.register('email')} />
            </div>
            {!editing ? (
              <div className="space-y-2">
                <Label>{t('app.password')}</Label>
                <Input type="password" {...form.register('password', { required: true })} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{t('parents.linkChildren')}</Label>
              <div className="flex max-h-36 flex-wrap gap-2 overflow-auto">
                {(traineesQuery.data || []).map((trainee) => {
                  const selected = selectedTrainees.includes(String(trainee.id))
                  return (
                    <Button
                      key={trainee.id}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() =>
                        setSelectedTrainees((prev) =>
                          selected
                            ? prev.filter((id) => id !== String(trainee.id))
                            : [...prev, String(trainee.id)],
                        )
                      }
                    >
                      {fullName(trainee.user)}
                    </Button>
                  )
                })}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('app.cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {t('app.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
