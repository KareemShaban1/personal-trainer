import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { applyDocumentDirection } from '@/i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t('app.language')}
      onClick={() => {
        const next = isAr ? 'en' : 'ar'
        void i18n.changeLanguage(next).then(() => applyDocumentDirection(next))
      }}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      {isAr ? 'EN' : 'عربي'}
    </Button>
  )
}
