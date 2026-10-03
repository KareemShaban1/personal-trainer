import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Building2,
  ClipboardList,
  CreditCard,
  Package,
  Palette,
  Users,
  UsersRound,
  UserRound,
} from 'lucide-react'
import { api } from '@/lib/api'
import { applyAppearance, DEFAULT_APPEARANCE } from '@/lib/appearance'
import { formatDate } from '@/lib/utils'
import type { Organization, OrganizationStats, Paginated, SystemAppearance } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBrandName } from '@/contexts/theme-provider'

const FONT_OPTIONS = [
  'DM Sans',
  'Inter',
  'Poppins',
  'Nunito',
  'Outfit',
  'Manrope',
  'Source Sans 3',
  'IBM Plex Sans',
]

const ARABIC_FONT_OPTIONS = [
  'IBM Plex Sans Arabic',
  'Noto Sans Arabic',
  'Cairo',
  'Tajawal',
  'Almarai',
  'Rubik',
]

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface px-2.5 py-1.5 text-xs text-slate-600">
      <Icon className="h-3.5 w-3.5 text-brand-600" />
      <span className="font-medium text-slate-ink">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  )
}

function emptyStats(): OrganizationStats {
  return {
    users_count: 0,
    owners_count: 0,
    trainers_count: 0,
    staff_count: 0,
    trainees_count: 0,
    parents_count: 0,
    branches_count: 0,
    packages_count: 0,
    subscriptions_count: 0,
    active_subscriptions_count: 0,
    payments_count: 0,
    attendance_count: 0,
  }
}

export function SuperAdminOrganizationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['super-admin-orgs', q],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Organization>>('/super-admin/organizations', {
        params: { q: q || undefined },
      })
      return data
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/super-admin/organizations/${id}/status`, { status })
    },
    onSuccess: async () => {
      toast.success(t('superAdmin.updateStatus'))
      await queryClient.invalidateQueries({ queryKey: ['super-admin-orgs'] })
    },
  })

  return (
    <div>
      <PageHeader title={t('superAdmin.organizations')} description={t('superAdmin.subtitle')} />
      <div className="mb-4 max-w-sm">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('app.search')} />
      </div>

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && !data?.data?.length ? (
        <EmptyBlock title={t('superAdmin.empty')} />
      ) : null}

      {data?.data?.length ? (
        <div className="space-y-4">
          {data.data.map((org) => {
            const stats = org.stats ?? emptyStats()
            return (
              <Card key={org.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 border-b border-border-subtle p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-900">{org.name}</h3>
                        <Badge>{org.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {org.slug} · {org.email || '—'} · {org.phone || '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[org.city, org.country].filter(Boolean).join(', ') || '—'}
                        {' · '}
                        {org.timezone || '—'}
                        {' · '}
                        {org.currency || '—'}
                        {' · '}
                        {t('superAdmin.created')}: {formatDate(org.created_at)}
                      </p>
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                      <Label className="text-xs text-slate-500">{t('superAdmin.updateStatus')}</Label>
                      <Select
                        value={org.status || 'active'}
                        onValueChange={(status) => statusMutation.mutate({ id: org.id, status })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">active</SelectItem>
                          <SelectItem value="inactive">inactive</SelectItem>
                          <SelectItem value="suspended">suspended</SelectItem>
                          <SelectItem value="trial">trial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-brand-50/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                        {t('superAdmin.people')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatChip icon={UserRound} label={t('superAdmin.owners')} value={stats.owners_count} />
                        <StatChip icon={Users} label={t('superAdmin.trainers')} value={stats.trainers_count} />
                        <StatChip icon={UsersRound} label={t('superAdmin.staff')} value={stats.staff_count} />
                        <StatChip icon={Users} label={t('nav.trainees')} value={stats.trainees_count} />
                        <StatChip icon={UsersRound} label={t('nav.parents')} value={stats.parents_count} />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {t('superAdmin.operations')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatChip icon={Building2} label={t('superAdmin.branches')} value={stats.branches_count} />
                        <StatChip icon={Package} label={t('nav.packages')} value={stats.packages_count} />
                        <StatChip
                          icon={CreditCard}
                          label={t('nav.subscriptions')}
                          value={stats.subscriptions_count}
                        />
                        <StatChip
                          icon={CreditCard}
                          label={t('superAdmin.activeSubscriptions')}
                          value={stats.active_subscriptions_count}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface p-3 sm:col-span-2 xl:col-span-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {t('superAdmin.activity')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatChip icon={Users} label={t('superAdmin.members')} value={stats.users_count} />
                        <StatChip
                          icon={CreditCard}
                          label={t('superAdmin.payments')}
                          value={stats.payments_count}
                        />
                        <StatChip
                          icon={ClipboardList}
                          label={t('nav.attendance')}
                          value={stats.attendance_count}
                        />
                        {org.trial_ends_at ? (
                          <div className="rounded-xl bg-white px-2.5 py-1.5 text-xs text-slate-600">
                            {t('superAdmin.trialEnds')}: {formatDate(org.trial_ends_at)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function SuperAdminStatsPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Organization>>('/super-admin/organizations', {
        params: { per_page: 100 },
      })
      return data
    },
  })

  const stats = useMemo(() => {
    const orgs = data?.data || []
    const totals = orgs.reduce(
      (acc, org) => {
        const s = org.stats ?? emptyStats()
        acc.trainers += s.trainers_count
        acc.trainees += s.trainees_count
        acc.parents += s.parents_count
        acc.subscriptions += s.active_subscriptions_count
        return acc
      },
      { trainers: 0, trainees: 0, parents: 0, subscriptions: 0 },
    )

    return {
      organizations: data?.meta?.total ?? orgs.length,
      active: orgs.filter((o) => o.status === 'active').length,
      trial: orgs.filter((o) => o.status === 'trial').length,
      suspended: orgs.filter((o) => o.status === 'suspended').length,
      trainers: totals.trainers,
      trainees: totals.trainees,
      parents: totals.parents,
      activeSubscriptions: totals.subscriptions,
    }
  }, [data])

  if (isLoading) return <LoadingBlock />
  if (isError) return <ErrorBlock onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title={t('superAdmin.stats')} description={t('superAdmin.subtitle')} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(stats).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t(`superAdmin.statLabels.${key}`, { defaultValue: key })}
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={() => void refetch()}>
        {t('app.tryAgain')}
      </Button>
    </div>
  )
}

export function SuperAdminAppearancePage() {
  const { t } = useTranslation()
  const brandName = useBrandName()
  const queryClient = useQueryClient()
  const form = useForm<SystemAppearance>({ defaultValues: DEFAULT_APPEARANCE })

  const query = useQuery({
    queryKey: ['system-appearance'],
    queryFn: async () => {
      const { data } = await api.get<{ appearance: SystemAppearance }>('/system/appearance')
      return data.appearance
    },
  })

  useEffect(() => {
    if (query.data) form.reset({ ...DEFAULT_APPEARANCE, ...query.data })
  }, [query.data, form])

  const mutation = useMutation({
    mutationFn: async (values: SystemAppearance) => {
      const { data } = await api.put<{ appearance: SystemAppearance }>('/super-admin/appearance', values)
      return data.appearance
    },
    onSuccess: async (appearance) => {
      applyAppearance(appearance)
      toast.success(t('superAdmin.appearanceSaved'))
      await queryClient.invalidateQueries({ queryKey: ['system-appearance'] })
    },
  })

  const watched = form.watch()

  if (query.isLoading) return <LoadingBlock />
  if (query.isError) return <ErrorBlock onRetry={() => void query.refetch()} />

  return (
    <div>
      <PageHeader title={t('superAdmin.appearance')} description={t('superAdmin.appearanceSubtitle')} />

      <form
        className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('superAdmin.branding')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="brand_name">{t('superAdmin.brandName')}</Label>
              <Input
                id="brand_name"
                className="h-11"
                placeholder={DEFAULT_APPEARANCE.brand_name}
                {...form.register('brand_name', { required: true, minLength: 2 })}
              />
              <p className="text-xs text-slate-500">{t('superAdmin.brandNameHint')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t('superAdmin.colors')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['primary', 'superAdmin.primary'],
                  ['primary_dark', 'superAdmin.primaryDark'],
                  ['primary_light', 'superAdmin.primaryLight'],
                  ['accent', 'superAdmin.accent'],
                  ['surface', 'superAdmin.surface'],
                  ['ink', 'superAdmin.ink'],
                  ['border', 'superAdmin.border'],
                ] as const
              ).map(([field, labelKey]) => (
                <div key={field} className="space-y-2">
                  <Label>{t(labelKey)}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="h-10 w-14 cursor-pointer p-1"
                      value={watched[field]}
                      onChange={(e) => form.setValue(field, e.target.value)}
                    />
                    <Input {...form.register(field)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('superAdmin.fonts')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="space-y-2">
                <Label>{t('superAdmin.fontSans')}</Label>
                <Select value={watched.font_sans} onValueChange={(v) => form.setValue('font_sans', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('superAdmin.fontArabic')}</Label>
                <Select
                  value={watched.font_arabic}
                  onValueChange={(v) => form.setValue('font_arabic', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARABIC_FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('superAdmin.fontSize')}</Label>
                <Select
                  value={watched.font_size_base}
                  onValueChange={(v) => form.setValue('font_size_base', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['14px', '15px', '16px', '17px', '18px'].map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('superAdmin.radius')}</Label>
                <Select
                  value={watched.border_radius}
                  onValueChange={(v) => form.setValue('border_radius', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['0.5rem', '0.75rem', '1rem', '1.25rem'].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('superAdmin.preview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-hidden border p-4"
                style={{
                  background: watched.surface,
                  borderColor: watched.border,
                  color: watched.ink,
                  fontFamily: `'${watched.font_sans}', '${watched.font_arabic}', sans-serif`,
                  fontSize: watched.font_size_base,
                  borderRadius: watched.border_radius,
                }}
              >
                <div
                  className="mb-3 px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: watched.primary, borderRadius: watched.border_radius }}
                >
                  {watched.brand_name || brandName}
                </div>
                <p className="mb-3 text-sm opacity-80">{t('superAdmin.previewBody')}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-medium text-white"
                    style={{ background: watched.primary, borderRadius: watched.border_radius }}
                  >
                    {t('app.save')}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-medium text-white"
                    style={{ background: watched.accent, borderRadius: watched.border_radius }}
                  >
                    {t('superAdmin.accent')}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {t('app.save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset(DEFAULT_APPEARANCE)
                    applyAppearance(DEFAULT_APPEARANCE)
                  }}
                >
                  {t('superAdmin.resetDefaults')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
