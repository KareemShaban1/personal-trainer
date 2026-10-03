import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Paginated, ParentProfile, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FormValues {
  first_name: string
  last_name: string
  phone: string
  email?: string
  password?: string
  gender?: string
  date_of_birth?: string
  code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_notes?: string
  parent_ids?: number[]
}

export function TraineeFormPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedParents, setSelectedParents] = useState<string[]>([])

  const form = useForm<FormValues>({
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      password: '',
      gender: '',
      date_of_birth: '',
      code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_notes: '',
    },
  })

  const traineeQuery = useQuery({
    queryKey: ['trainee', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get<{ trainee: Trainee } | Trainee>(`/trainees/${id}`)
      return 'trainee' in data ? data.trainee : data
    },
  })

  const parentsQuery = useQuery({
    queryKey: ['parents-options'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ParentProfile>>('/parents')
      return data.data
    },
  })

  useEffect(() => {
    if (!traineeQuery.data) return
    const trainee = traineeQuery.data
    form.reset({
      first_name: trainee.user?.first_name || '',
      last_name: trainee.user?.last_name || '',
      phone: trainee.user?.phone || '',
      email: trainee.user?.email || '',
      gender: trainee.user?.gender || '',
      date_of_birth: trainee.user?.date_of_birth || '',
      code: trainee.code || '',
      emergency_contact_name: trainee.emergency_contact_name || '',
      emergency_contact_phone: trainee.emergency_contact_phone || '',
      medical_notes: trainee.medical_notes || '',
    })
    setSelectedParents((trainee.parents || []).map((p) => String(p.id)))
  }, [traineeQuery.data, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        parent_ids: selectedParents.map(Number),
        gender: values.gender || undefined,
        email: values.email || undefined,
      }
      if (isEdit) {
        const { password: _password, ...rest } = payload
        await api.put(`/trainees/${id}`, rest)
      } else {
        await api.post('/trainees', payload)
      }
    },
    onSuccess: async () => {
      toast.success(t('app.save'))
      await queryClient.invalidateQueries({ queryKey: ['trainees'] })
      navigate('/trainees')
    },
  })

  if (isEdit && traineeQuery.isLoading) return <LoadingBlock />
  if (isEdit && traineeQuery.isError) return <ErrorBlock onRetry={() => void traineeQuery.refetch()} />

  return (
    <div>
      <PageHeader
        title={isEdit ? t('trainees.edit') : t('trainees.add')}
        actions={
          <Button asChild variant="outline">
            <Link to="/trainees">{t('app.back')}</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
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
          {!isEdit ? (
            <div className="space-y-2">
              <Label>{t('app.password')}</Label>
              <Input type="password" {...form.register('password', { required: true })} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>{t('trainees.gender')}</Label>
            <Select
              value={form.watch('gender') || undefined}
              onValueChange={(v) => form.setValue('gender', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('trainees.gender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('trainees.dob')}</Label>
            <Input type="date" {...form.register('date_of_birth')} />
          </div>
          <div className="space-y-2">
            <Label>{t('trainees.code')}</Label>
            <Input {...form.register('code')} />
          </div>
          <div className="space-y-2">
            <Label>{t('trainees.emergencyContact')}</Label>
            <Input {...form.register('emergency_contact_name')} />
          </div>
          <div className="space-y-2">
            <Label>{t('app.phone')}</Label>
            <Input {...form.register('emergency_contact_phone')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t('trainees.medicalNotes')}</Label>
            <Textarea {...form.register('medical_notes')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t('trainees.linkParents')}</Label>
            <div className="flex flex-wrap gap-2">
              {(parentsQuery.data || []).map((parent) => {
                const selected = selectedParents.includes(String(parent.id))
                return (
                  <Button
                    key={parent.id}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    onClick={() =>
                      setSelectedParents((prev) =>
                        selected
                          ? prev.filter((id) => id !== String(parent.id))
                          : [...prev, String(parent.id)],
                      )
                    }
                  >
                    {parent.user?.name || `#${parent.id}`}
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={mutation.isPending}
              onClick={form.handleSubmit((values) => mutation.mutate(values))}
            >
              {t('app.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
