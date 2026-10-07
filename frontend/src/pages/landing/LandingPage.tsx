import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Dumbbell, GraduationCap, Users } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBrandName } from '@/contexts/theme-provider'
import { cn } from '@/lib/utils'

type GuideStep = { title: string; body: string }

type RoleKey = 'trainer' | 'trainee' | 'parent'

const ROLE_ICONS = {
  trainer: ClipboardList,
  trainee: GraduationCap,
  parent: Users,
} as const

function HowToPanel({ steps }: { steps: GuideStep[] }) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language.startsWith('ar')

  return (
    <ol dir={isRtl ? 'rtl' : 'ltr'} className="space-y-4 text-start">
      {steps.map((step, index) => (
        <li
          key={`${step.title}-${index}`}
          className={cn(
            'flex gap-4 rounded-2xl border border-border-subtle bg-surface-elevated/90 p-4 shadow-sm sm:p-5',
            isRtl ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-950 text-sm font-bold text-white">
            {index + 1}
          </span>
          <div className={cn('min-w-0 flex-1 space-y-1', isRtl ? 'text-right' : 'text-left')}>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {t('landing.step', { n: index + 1 })}
            </p>
            <h3 className="text-base font-semibold text-brand-950 sm:text-lg">{step.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const brandName = useBrandName()
  const location = useLocation()
  const [role, setRole] = useState<RoleKey>('trainer')

  const trainerSteps = t('landing.trainerSteps', { returnObjects: true }) as GuideStep[]
  const traineeSteps = t('landing.traineeSteps', { returnObjects: true }) as GuideStep[]
  const parentSteps = t('landing.parentSteps', { returnObjects: true }) as GuideStep[]

  useEffect(() => {
    if (location.hash === '#how-to-use') {
      document.getElementById('how-to-use')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface text-brand-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-y-0 start-0 w-full bg-brand-950 lg:w-[46%]" />
        <div className="absolute -start-10 top-24 h-36 w-36 rounded-[2rem] bg-brand-600/80 lg:start-[38%] lg:top-32" />
        <div className="absolute bottom-32 start-12 hidden h-20 w-20 rounded-full bg-accent lg:block" />
        <div className="absolute end-8 top-40 hidden h-14 w-14 rounded-2xl bg-brand-300 lg:block" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-white lg:text-inherit">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm lg:bg-brand-950">
            <Dumbbell className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white lg:text-brand-950">{brandName}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#how-to-use"
            className="hidden text-sm font-medium text-brand-100 transition hover:text-white sm:inline lg:text-brand-800 lg:hover:text-brand-950"
          >
            {t('landing.navHowTo')}
          </a>
          <LanguageSwitcher />
          <Button asChild size="sm" variant="outline" className="hidden border-white/30 bg-white/10 text-white hover:bg-white/20 sm:inline-flex lg:border-brand-200 lg:bg-white lg:text-brand-900 lg:hover:bg-brand-50">
            <Link to="/login">{t('landing.navLogin')}</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-10">
          <div className="space-y-6 text-white lg:pe-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">{brandName}</p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-brand-100 sm:text-lg">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
                <Link to="/login">{t('landing.ctaLogin')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/35 bg-transparent text-white hover:bg-white/10"
              >
                <Link to="/register">{t('landing.ctaRegister')}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-brand-100 hover:bg-white/10 hover:text-white">
                <a href="#how-to-use">{t('landing.ctaHowTo')}</a>
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border-subtle bg-surface-elevated p-5 shadow-xl shadow-brand-950/10 sm:p-7 lg:ms-auto lg:max-w-md">
            <p className="text-sm font-semibold text-brand-700">{t('landing.howToTitle')}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('landing.howToSubtitle')}</p>
            <div className="mt-5 grid gap-3">
              {(['trainer', 'trainee', 'parent'] as RoleKey[]).map((key) => {
                const Icon = ROLE_ICONS[key]
                return (
                  <a
                    key={key}
                    href="#how-to-use"
                    onClick={() => setRole(key)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3.5 py-3 transition',
                      role === key
                        ? 'border-brand-600 bg-brand-50 text-brand-950'
                        : 'border-border-subtle bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/60',
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-950 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold">{t(`landing.${key}`)}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section id="how-to-use" className="scroll-mt-20 border-t border-border-subtle bg-white/70 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-8 space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                {t('landing.howToTitle')}
              </h2>
              <p className="text-sm text-slate-600 sm:text-base">{t('landing.howToSubtitle')}</p>
            </div>

            <Tabs value={role} onValueChange={(value) => setRole(value as RoleKey)}>
              <TabsList className="mb-6 grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-brand-50 p-1.5">
                {(['trainer', 'trainee', 'parent'] as RoleKey[]).map((key) => {
                  const Icon = ROLE_ICONS[key]
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-brand-950 data-[state=active]:text-white sm:text-sm"
                    >
                      <Icon className="hidden h-3.5 w-3.5 sm:block" />
                      {t(`landing.${key}`)}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value="trainer">
                <HowToPanel steps={Array.isArray(trainerSteps) ? trainerSteps : []} />
              </TabsContent>
              <TabsContent value="trainee">
                <HowToPanel steps={Array.isArray(traineeSteps) ? traineeSteps : []} />
              </TabsContent>
              <TabsContent value="parent">
                <HowToPanel steps={Array.isArray(parentSteps) ? parentSteps : []} />
              </TabsContent>
            </Tabs>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link to="/login">{t('landing.ctaLogin')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">{t('landing.ctaRegister')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border-subtle bg-surface px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
        {t('landing.footerTagline')}
      </footer>
    </div>
  )
}
