import { useTranslation } from 'react-i18next'

function resolveIsRtl(language?: string) {
  const lng = (language || document.documentElement.lang || 'en').toLowerCase()
  return lng.startsWith('ar') || document.documentElement.dir === 'rtl'
}

export function useLocaleLayout() {
  const { i18n } = useTranslation()
  const isRtl = resolveIsRtl(i18n.resolvedLanguage || i18n.language)

  return {
    isRtl,
    dir: (isRtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    textAlign: isRtl ? 'text-right' : 'text-left',
    flexRow: isRtl ? 'flex-row-reverse' : 'flex-row',
    locale: isRtl ? 'ar' : 'en',
  }
}
