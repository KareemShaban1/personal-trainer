import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Dumbbell, Eye, EyeOff, Loader2, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { homePathForRoles } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useBrandName } from '@/contexts/theme-provider'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function SuperAdminLoginPage() {
  const { t } = useTranslation()
  const brandName = useBrandName()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const user = await login(
        { email: values.email, password: values.password },
        { superAdmin: true },
      )
      navigate(homePathForRoles(user.roles?.map(String)))
    } catch {
      // toast via interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell relative flex min-h-screen bg-[#f3f6f4]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-y-0 start-0 w-full bg-slate-ink lg:w-[52%]" />
        <div className="absolute start-8 top-20 h-28 w-28 rounded-3xl bg-brand-600 lg:start-[40%] lg:top-28" />
        <div className="absolute bottom-20 start-16 hidden h-16 w-16 rounded-full bg-accent lg:block" />
        <div className="absolute bottom-0 end-0 h-2 w-full bg-brand-700 lg:h-full lg:w-2" />
      </div>

      <div className="absolute end-4 top-4 z-20 sm:end-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 lg:grid-cols-[1fr_1fr]">
        <section className="flex flex-col justify-center px-6 pb-6 pt-20 text-white sm:px-10 lg:px-14 lg:pb-16 lg:pt-16">
          <div className="animate-fade-up max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{brandName}</p>
                <p className="text-sm text-slate-300">{t('auth.superAdminBadge')}</p>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {t('auth.superAdminLogin')}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {t('auth.superAdminSubtitle')}
            </p>
          </div>
        </section>

        <section className="flex items-end px-4 pb-8 sm:px-6 lg:items-center lg:px-8 lg:pb-16 lg:pt-16">
          <div className="login-panel animate-fade-up-delay w-full rounded-[1.75rem] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-brand-950">{t('auth.superAdminLogin')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('auth.superAdminFormHint')}</p>
            </div>

            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="sa-email">{t('auth.email')}</Label>
                <Input
                  id="sa-email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  placeholder="admin@trainer.saas"
                  className="h-11"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register('email')}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-danger">{t('auth.invalidEmail')}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sa-password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="sa-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 pe-11"
                    aria-invalid={Boolean(form.formState.errors.password)}
                    {...form.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute end-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="text-xs text-danger">{t('auth.passwordRequired')}</p>
                ) : null}
              </div>

              <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Shield className="h-4 w-4" />}
                {submitting ? t('auth.signingIn') : t('auth.superAdminLogin')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t('auth.academyLoginInstead')}{' '}
              <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                <Dumbbell className="h-3.5 w-3.5" />
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
