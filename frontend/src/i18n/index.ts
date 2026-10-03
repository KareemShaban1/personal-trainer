import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '@/i18n/locales/en.json'
import ar from '@/i18n/locales/ar.json'

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

export function applyDocumentDirection(lng: string) {
  const dir = lng.startsWith('ar') ? 'rtl' : 'ltr'
  document.documentElement.lang = lng.startsWith('ar') ? 'ar' : 'en'
  document.documentElement.dir = dir
}

applyDocumentDirection(i18n.language || 'en')
i18n.on('languageChanged', applyDocumentDirection)

export default i18n
