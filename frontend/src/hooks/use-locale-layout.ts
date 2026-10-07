import { useTranslation } from 'react-i18next'

function resolveIsRtl(language?: string) {
  const lng = (language || document.documentElement.lang || 'en').toLowerCase()
  return lng.startsWith('ar')
}

/**
 * Locale-aware layout helpers.
 * Prefer setting `dir` on a parent and using logical CSS (`text-start`, `ms-*`, `justify-start`)
 * instead of manually reversing flex rows — `dir="rtl"` already flips inline start/end.
 */
export function useLocaleLayout() {
  const { i18n } = useTranslation()
  const isRtl = resolveIsRtl(i18n.resolvedLanguage || i18n.language)

  return {
    isRtl,
    dir: (isRtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    textAlign: isRtl ? 'text-right' : 'text-left',
    /** Keep row direction normal; `dir` handles start/end flipping. */
    flexRow: 'flex-row' as const,
    locale: isRtl ? 'ar' : 'en',
  }
}
