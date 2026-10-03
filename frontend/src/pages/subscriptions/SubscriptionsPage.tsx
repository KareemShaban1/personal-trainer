import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate, fullName } from '@/lib/utils'
import type { Package, Paginated, Subscription, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export function SubscriptionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [assignOpen, setAssignOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState<Subscription | null>(null)
  const assignForm = useForm({
    defaultValues: { trainee_id: '', package_id: '', started_at: '', notes: '' },
  })
  const paymentForm = useForm({
    defaultValues: { amount: 0, method: 'cash', reference: '', notes: '' },
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Subscription>>('/subscriptions')
      return data
    },
  })

  const traineesQuery = useQuery({
    queryKey: ['trainees-options'],
    queryFn: async () => (await api.get<Paginated<Trainee>>('/trainees')).data.data,
  })

  const packagesQuery = useQuery({
    queryKey: ['packages-options'],
    queryFn: async () => (await api.get<Paginated<Package>>('/packages')).data.data,
  })

  const assignMutation = useMutation({
    mutationFn: async (values: { trainee_id: string; package_id: string; started_at?: string; notes?: string }) => {
      await api.post('/subscriptions', {
        trainee_id: Number(values.trainee_id),
        package_id: Number(values.package_id),
        started_at: values.started_at || undefined,
        notes: values.notes || undefined,
      })
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      setAssignOpen(false)
      assignForm.reset()
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'cancel' | 'suspend' | 'resume' }) => {
      await api.post(`/subscriptions/${id}/${action}`)
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: async (values: { amount: number; method: string; reference?: string; notes?: string }) => {
      if (!paymentOpen) return
      await api.post('/payments', {
        trainee_id: paymentOpen.trainee_id,
        subscription_id: paymentOpen.id,
        amount: values.amount,
        method: values.method,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
        status: 'completed',
      })
    },
    onSuccess: async () => {
      toast.success(t('subscriptions.recordPayment'))
      setPaymentOpen(null)
      paymentForm.reset()
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  return (
    <div>
      <PageHeader
        title={t('subscriptions.title')}
        description={t('subscriptions.subtitle')}
        actions={
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('subscriptions.assign')}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? (
        <EmptyBlock title={t('subscriptions.empty')} />
      ) : null}

      {data?.data?.length ? (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('subscriptions.trainee')}</TableHead>
                <TableHead>{t('subscriptions.package')}</TableHead>
                <TableHead>{t('subscriptions.remaining')}</TableHead>
                <TableHead>{t('app.status')}</TableHead>
                <TableHead>{t('subscriptions.started')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{fullName(sub.trainee?.user)}</TableCell>
                  <TableCell>{sub.package?.name}</TableCell>
                  <TableCell>
                    <Badge variant="warning">{sub.remaining_sessions ?? 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{sub.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(sub.started_at)}</TableCell>
                  <TableCell className="space-x-1 text-end rtl:space-x-reverse">
                    <Button size="sm" variant="outline" onClick={() => setPaymentOpen(sub)}>
                      {t('subscriptions.recordPayment')}
                    </Button>
                    {sub.status === 'active' ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => statusMutation.mutate({ id: sub.id, action: 'suspend' })}
                        >
                          {t('subscriptions.suspend')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => statusMutation.mutate({ id: sub.id, action: 'cancel' })}
                        >
                          {t('subscriptions.cancel')}
                        </Button>
                      </>
                    ) : null}
                    {sub.status === 'suspended' ? (
                      <Button
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: sub.id, action: 'resume' })}
                      >
                        {t('subscriptions.resume')}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('subscriptions.assign')}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={assignForm.handleSubmit((v) => assignMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label>{t('subscriptions.trainee')}</Label>
              <Select
                value={assignForm.watch('trainee_id')}
                onValueChange={(v) => assignForm.setValue('trainee_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('subscriptions.trainee')} />
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
              <Label>{t('subscriptions.package')}</Label>
              <Select
                value={assignForm.watch('package_id')}
                onValueChange={(v) => assignForm.setValue('package_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('subscriptions.package')} />
                </SelectTrigger>
                <SelectContent>
                  {(packagesQuery.data || []).map((pkg) => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('subscriptions.started')}</Label>
              <Input type="date" {...assignForm.register('started_at')} />
            </div>
            <div className="space-y-2">
              <Label>{t('app.notes')}</Label>
              <Textarea {...assignForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={assignMutation.isPending}>
                {t('app.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paymentOpen)} onOpenChange={(v) => !v && setPaymentOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('subscriptions.recordPayment')}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={paymentForm.handleSubmit((v) => paymentMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label>{t('payments.amount')}</Label>
              <Input type="number" step="0.01" {...paymentForm.register('amount', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('payments.method')}</Label>
              <Select
                value={paymentForm.watch('method')}
                onValueChange={(v) => paymentForm.setValue('method', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('payments.cash')}</SelectItem>
                  <SelectItem value="card">{t('payments.card')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('payments.bank')}</SelectItem>
                  <SelectItem value="wallet">{t('payments.wallet')}</SelectItem>
                  <SelectItem value="other">{t('payments.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('payments.reference')}</Label>
              <Input {...paymentForm.register('reference')} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={paymentMutation.isPending}>
                {t('app.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
