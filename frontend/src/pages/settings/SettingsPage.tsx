import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Organization, OrganizationSettings } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'

export function SettingsPage() {
  const { t } = useTranslation()
  const { setOrganization } = useAuth()
  const queryClient = useQueryClient()

  const orgForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      timezone: '',
      currency: 'EGP',
    },
  })

  const settingsForm = useForm({
    defaultValues: {
      check_in_radius_meters: 100,
      require_geolocation: true,
      attendance_qr_ttl_seconds: 120,
    },
  })

  const orgQuery = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data } = await api.get<{ organization: Organization }>('/organization')
      return data.organization
    },
  })

  const settingsQuery = useQuery({
    queryKey: ['organization-settings'],
    queryFn: async () => {
      const { data } = await api.get<{ settings: OrganizationSettings }>('/organization/settings')
      return data.settings
    },
  })

  useEffect(() => {
    if (!orgQuery.data) return
    orgForm.reset({
      name: orgQuery.data.name || '',
      email: orgQuery.data.email || '',
      phone: orgQuery.data.phone || '',
      country: orgQuery.data.country || '',
      city: orgQuery.data.city || '',
      timezone: orgQuery.data.timezone || '',
      currency: orgQuery.data.currency || 'EGP',
    })
  }, [orgQuery.data, orgForm])

  useEffect(() => {
    if (!settingsQuery.data) return
    settingsForm.reset({
      check_in_radius_meters: settingsQuery.data.check_in_radius_meters ?? 100,
      require_geolocation: Boolean(settingsQuery.data.require_geolocation),
      attendance_qr_ttl_seconds: settingsQuery.data.attendance_qr_ttl_seconds ?? 120,
    })
  }, [settingsQuery.data, settingsForm])

  const orgMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data } = await api.put<{ organization: Organization }>('/organization', values)
      return data.organization
    },
    onSuccess: async (organization) => {
      toast.success(t('settings.saved'))
      setOrganization(organization)
      await queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })

  const settingsMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      await api.put('/organization/settings', values)
    },
    onSuccess: async () => {
      toast.success(t('settings.saved'))
      await queryClient.invalidateQueries({ queryKey: ['organization-settings'] })
    },
  })

  if (orgQuery.isLoading || settingsQuery.isLoading) return <LoadingBlock />
  if (orgQuery.isError || settingsQuery.isError)
    return <ErrorBlock onRetry={() => void Promise.all([orgQuery.refetch(), settingsQuery.refetch()])} />

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.orgInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={orgForm.handleSubmit((v) => orgMutation.mutate(v))}
            >
              {(['name', 'email', 'phone', 'country', 'city', 'timezone', 'currency'] as const).map(
                (field) => (
                  <div key={field} className="space-y-2">
                    <Label>{t(field === 'name' ? 'app.name' : field === 'currency' || field === 'timezone' || field === 'country' || field === 'city' ? `auth.${field}` : `app.${field}`)}</Label>
                    <Input {...orgForm.register(field)} />
                  </div>
                ),
              )}
              <Button type="submit" disabled={orgMutation.isPending}>
                {t('app.save')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.attendanceRules')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={settingsForm.handleSubmit((v) => settingsMutation.mutate(v))}
            >
              <div className="space-y-2">
                <Label>{t('settings.radius')}</Label>
                <Input
                  type="number"
                  {...settingsForm.register('check_in_radius_meters', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.qrTtl')}</Label>
                <Input
                  type="number"
                  {...settingsForm.register('attendance_qr_ttl_seconds', { valueAsNumber: true })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(settingsForm.watch('require_geolocation'))}
                  onCheckedChange={(v) => settingsForm.setValue('require_geolocation', Boolean(v))}
                />
                {t('settings.requireLocation')}
              </label>
              <Button type="submit" disabled={settingsMutation.isPending}>
                {t('app.save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
