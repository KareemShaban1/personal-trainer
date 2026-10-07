import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '@/i18n/locales/en.json'
import ar from '@/i18n/locales/ar.json'

export function applyDocumentDirection(lng: string) {
  const isAr = (lng || 'en').toLowerCase().startsWith('ar')
  document.documentElement.lang = isAr ? 'ar' : 'en'
  document.documentElement.dir = isAr ? 'rtl' : 'ltr'
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
  .then(() => {
    applyDocumentDirection(i18n.language || 'en')
  })

applyDocumentDirection(i18n.language || 'en')
i18n.on('languageChanged', applyDocumentDirection)

export default i18n