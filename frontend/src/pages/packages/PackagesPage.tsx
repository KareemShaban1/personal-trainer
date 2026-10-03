import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Package, Paginated } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface FormValues {
  name: string
  description?: string
  sessions_count: number
  duration_days?: number
  price: number
  currency?: string
  is_active?: boolean
}

export function PackagesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      sessions_count: 8,
      duration_days: 30,
      price: 0,
      currency: 'EGP',
      is_active: true,
    },
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Package>>('/packages')
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) await api.put(`/packages/${editing.id}`, values)
      else await api.post('/packages', values)
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      setOpen(false)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/packages/${id}`),
    onSuccess: async () => {
      toast.success(t('app.delete'))
      await queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })

  function openCreate() {
    setEditing(null)
    form.reset({
      name: '',
      description: '',
      sessions_count: 8,
      duration_days: 30,
      price: 0,
      currency: 'EGP',
      is_active: true,
    })
    setOpen(true)
  }

  function openEdit(pkg: Package) {
    setEditing(pkg)
    form.reset({
      name: pkg.name,
      description: pkg.description || '',
      sessions_count: pkg.sessions_count,
      duration_days: pkg.duration_days || undefined,
      price: Number(pkg.price),
      currency: pkg.currency,
      is_active: pkg.is_active,
    })
    setOpen(true)
  }

  return (
    <div>
      <PageHeader
        title={t('packages.title')}
        description={t('packages.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('packages.add')}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? <EmptyBlock title={t('packages.empty')} /> : null}

      {data?.data?.length ? (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('app.name')}</TableHead>
                <TableHead>{t('packages.sessions')}</TableHead>
                <TableHead>{t('packages.duration')}</TableHead>
                <TableHead>{t('packages.price')}</TableHead>
                <TableHead>{t('app.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.sessions_count}</TableCell>
                  <TableCell>{pkg.duration_days || '—'}</TableCell>
                  <TableCell>{formatCurrency(pkg.price, pkg.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={pkg.is_active ? 'success' : 'secondary'}>
                      {pkg.is_active ? t('app.active') : t('app.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-end rtl:space-x-reverse">
                    <Button size="sm" variant="outline" onClick={() => openEdit(pkg)}>
                      {t('app.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm(t('app.confirm'))) deleteMutation.mutate(pkg.id)
                      }}
                    >
                      {t('app.delete')}
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
            <DialogTitle>{editing ? t('packages.edit') : t('packages.add')}</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <div className="space-y-2">
              <Label>{t('app.name')}</Label>
              <Input {...form.register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('packages.description')}</Label>
              <Textarea {...form.register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('packages.sessions')}</Label>
                <Input type="number" {...form.register('sessions_count', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>{t('packages.duration')}</Label>
                <Input type="number" {...form.register('duration_days', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('packages.price')}</Label>
                <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.currency')}</Label>
                <Input {...form.register('currency')} maxLength={3} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={Boolean(form.watch('is_active'))}
                onCheckedChange={(v) => form.setValue('is_active', Boolean(v))}
              />
              {t('app.active')}
            </label>
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
