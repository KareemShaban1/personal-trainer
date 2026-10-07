import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

const schema = z
  .object({
    organization_name: z.string().min(2),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
    country: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().length(3).optional().or(z.literal('')),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: 'Passwords must match',
    path: ['password_confirmation'],
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { t } = useTranslation()
  const { register: registerOrg } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_name: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      country: '',
      city: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: 'EGP',
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await registerOrg({
        ...values,
        currency: values.currency || 'EGP',
      })
      navigate('/dashboard')
    } catch {
      // toast via interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#042424_0%,#0f7473_50%,#1a3d42_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <Card className="w-full animate-fade-up border-white/20 bg-white/95 shadow-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-white">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{t('auth.register')}</CardTitle>
                <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
              </div>
            </div>
            <LanguageSwitcher />
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t('auth.orgName')}</Label>
                <Input {...form.register('organization_name')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.firstName')}</Label>
                <Input {...form.register('first_name')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.lastName')}</Label>
                <Input {...form.register('last_name')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input type="email" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.phone')}</Label>
                <Input {...form.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.password')}</Label>
                <Input type="password" {...form.register('password')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.confirmPassword')}</Label>
                <Input type="password" {...form.register('password_confirmation')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.country')}</Label>
                <Input {...form.register('country')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.city')}</Label>
                <Input {...form.register('city')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.timezone')}</Label>
                <Input {...form.register('timezone')} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.currency')}</Label>
                <Input {...form.register('currency')} maxLength={3} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {t('auth.register')}
                </Button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                {t('auth.login')}
              </Link>
            </p>
            <p className="mt-3 text-center text-sm text-slate-500">
              <Link to="/#how-to-use" className="font-semibold text-brand-700 hover:underline">
                {t('landing.navHowTo')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
