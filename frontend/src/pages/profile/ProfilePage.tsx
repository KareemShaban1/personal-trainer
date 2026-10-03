import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { User } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'

export function ProfilePage() {
  const { t } = useTranslation()
  const { refreshMe } = useAuth()
  const queryClient = useQueryClient()

  const profileForm = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      bio: '',
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>('/profile')
      return data.user
    },
  })

  useEffect(() => {
    if (!profileQuery.data) return
    profileForm.reset({
      first_name: profileQuery.data.first_name || '',
      last_name: profileQuery.data.last_name || '',
      email: profileQuery.data.email || '',
      phone: profileQuery.data.phone || '',
      bio: profileQuery.data.bio || '',
    })
  }, [profileQuery.data, profileForm])

  const updateMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      await api.put('/profile', values)
    },
    onSuccess: async () => {
      toast.success(t('profile.updated'))
      await refreshMe()
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async (values: {
      current_password: string
      password: string
      password_confirmation: string
    }) => {
      await api.post('/auth/change-password', values)
    },
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'))
      passwordForm.reset()
    },
  })

  if (profileQuery.isLoading) return <LoadingBlock />
  if (profileQuery.isError) return <ErrorBlock onRetry={() => void profileQuery.refetch()} />

  return (
    <div>
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={profileForm.handleSubmit((v) => updateMutation.mutate(v))}
            >
              <div className="space-y-2">
                <Label>{t('auth.firstName')}</Label>
                <Input {...profileForm.register('first_name')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.lastName')}</Label>
                <Input {...profileForm.register('last_name')} />
              </div>
              <div className="space-y-2">
                <Label>{t('app.email')}</Label>
                <Input type="email" {...profileForm.register('email')} />
              </div>
              <div className="space-y-2">
                <Label>{t('app.phone')}</Label>
                <Input {...profileForm.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>{t('profile.bio')}</Label>
                <Textarea {...profileForm.register('bio')} />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {t('app.save')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.changePassword')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutate(v))}
            >
              <div className="space-y-2">
                <Label>{t('profile.currentPassword')}</Label>
                <Input type="password" {...passwordForm.register('current_password', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>{t('profile.newPassword')}</Label>
                <Input type="password" {...passwordForm.register('password', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>{t('profile.confirmPassword')}</Label>
                <Input
                  type="password"
                  {...passwordForm.register('password_confirmation', { required: true })}
                />
              </div>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {t('profile.changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
