import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Briefcase, Dumbbell, Eye, EyeOff, Loader2, Phone, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { homePathForRoles } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useBrandName } from '@/contexts/theme-provider'

const staffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const portalSchema = z.object({
  phone: z.string().min(4),
  password: z.string().min(1),
})

type StaffForm = z.infer<typeof staffSchema>
type PortalForm = z.infer<typeof portalSchema>

const DEMO_EMAIL = 'owner@demo.academy'
const DEMO_PASSWORD = 'Password123!'

export function LoginPage() {
  const { t } = useTranslation()
  const brandName = useBrandName()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('staff')
  const [submitting, setSubmitting] = useState(false)
  const [showStaffPassword, setShowStaffPassword] = useState(false)
  const [showPortalPassword, setShowPortalPassword] = useState(false)

  const staffForm = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { email: '', password: '' },
  })

  const portalForm = useForm<PortalForm>({
    resolver: zodResolver(portalSchema),
    defaultValues: { phone: '', password: '' },
  })

  async function onStaff(values: StaffForm) {
    setSubmitting(true)
    try {
      const user = await login({ email: values.email, password: values.password })
      navigate(homePathForRoles(user.roles?.map(String)))
    } catch {
      // toast handled by api interceptor
    } finally {
      setSubmitting(false)
    }
  }

  async function onPortal(values: PortalForm) {
    setSubmitting(true)
    try {
      const user = await login({ phone: values.phone, password: values.password })
      navigate(homePathForRoles(user.roles?.map(String)))
    } catch {
      // toast handled by api interceptor
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo() {
    setTab('staff')
    staffForm.reset({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
    toast.message(t('auth.demoFilled'))
  }

  return (
    <div className="login-shell login-visual relative flex">
      {/* Solid color composition — no gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-y-0 start-0 w-full bg-brand-950 lg:w-[58%]" />
        <div className="absolute -start-16 top-16 h-40 w-40 rounded-[2rem] bg-brand-600 lg:start-[42%] lg:top-24" />
        <div className="absolute bottom-24 start-10 hidden h-24 w-24 rounded-full bg-accent lg:block" />
        <div className="absolute end-10 top-28 hidden h-16 w-16 rounded-2xl bg-brand-300 lg:block" />
        <div className="absolute bottom-0 end-0 h-2 w-full bg-brand-600 lg:h-full lg:w-2" />
      </div>

      <div className="absolute end-4 top-4 z-20 sm:end-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center px-6 pb-6 pt-20 text-white sm:px-10 lg:px-14 lg:pb-16 lg:pt-16">
          <div className="animate-fade-up max-w-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
                <Dumbbell className="h-7 w-7" />
              </div>
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">{brandName}</p>
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-brand-100 sm:text-lg">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <div className="animate-fade-up-delay mt-10 hidden max-w-md lg:block">
            <div className="mb-4 h-1 w-14 rounded-full bg-accent" />
            <p className="text-sm leading-relaxed text-brand-200">{t('auth.loginVisualLine')}</p>
          </div>
        </section>

        <section className="flex items-end px-4 pb-8 sm:px-6 lg:items-center lg:px-8 lg:pb-16 lg:pt-16">
          <div className="login-panel animate-fade-up-delay-2 w-full rounded-[1.75rem] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-brand-950">{t('auth.login')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('auth.chooseAccess')}</p>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-brand-50 p-1.5">
                <TabsTrigger value="staff" className="gap-2 py-2.5 data-[state=active]:bg-brand-700 data-[state=active]:text-white">
                  <Briefcase className="h-3.5 w-3.5" />
                  {t('auth.staffTab')}
                </TabsTrigger>
                <TabsTrigger value="portal" className="gap-2 py-2.5 data-[state=active]:bg-brand-700 data-[state=active]:text-white">
                  <Phone className="h-3.5 w-3.5" />
                  {t('auth.portalTab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="mt-5">
                <form className="space-y-4" onSubmit={staffForm.handleSubmit(onStaff)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="you@academy.com"
                      className="h-11"
                      aria-invalid={Boolean(staffForm.formState.errors.email)}
                      {...staffForm.register('email')}
                    />
                    {staffForm.formState.errors.email ? (
                      <p className="text-xs text-danger">{t('auth.invalidEmail')}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showStaffPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="h-11 pe-11"
                        aria-invalid={Boolean(staffForm.formState.errors.password)}
                        {...staffForm.register('password')}
                      />
                      <button
                        type="button"
                        className="absolute end-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                        onClick={() => setShowStaffPassword((v) => !v)}
                        aria-label={showStaffPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {staffForm.formState.errors.password ? (
                      <p className="text-xs text-danger">{t('auth.passwordRequired')}</p>
                    ) : null}
                  </div>

                  <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" /> : null}
                    {submitting ? t('auth.signingIn') : t('auth.login')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="portal" className="mt-5">
                <form className="space-y-4" onSubmit={portalForm.handleSubmit(onPortal)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      autoFocus
                      placeholder="01xxxxxxxxx"
                      className="h-11"
                      aria-invalid={Boolean(portalForm.formState.errors.phone)}
                      {...portalForm.register('phone')}
                    />
                    {portalForm.formState.errors.phone ? (
                      <p className="text-xs text-danger">{t('auth.invalidPhone')}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portal-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="portal-password"
                        type={showPortalPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="h-11 pe-11"
                        aria-invalid={Boolean(portalForm.formState.errors.password)}
                        {...portalForm.register('password')}
                      />
                      <button
                        type="button"
                        className="absolute end-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                        onClick={() => setShowPortalPassword((v) => !v)}
                        aria-label={showPortalPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showPortalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {portalForm.formState.errors.password ? (
                      <p className="text-xs text-danger">{t('auth.passwordRequired')}</p>
                    ) : null}
                  </div>

                  <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" /> : null}
                    {submitting ? t('auth.signingIn') : t('auth.login')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <button
              type="button"
              onClick={fillDemo}
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-800 transition',
                'hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35',
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('auth.tryDemo')}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-700 transition hover:text-brand-900 hover:underline"
                onClick={() => toast.dismiss()}
              >
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
