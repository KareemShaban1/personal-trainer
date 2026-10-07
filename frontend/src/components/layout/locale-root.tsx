import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { applyDocumentDirection } from '@/i18n'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { cn } from '@/lib/utils'

/**
 * Applies document + root direction from the active language so every portal
 * (staff, trainee, parent, super-admin, guest) aligns content LTR/RTL.
 */
export function LocaleRoot({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { dir, textAlign } = useLocaleLayout()
  const language = i18n.resolvedLanguage || i18n.language || 'en'

  useEffect(() => {
    applyDocumentDirection(language)
  }, [language])

  return (
    <div id="locale-root" dir={dir} lang={language.startsWith('ar') ? 'ar' : 'en'} className={cn('min-h-screen', textAlign)}>
      {children}
    </div>
  )
}
