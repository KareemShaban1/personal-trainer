import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const isAr = i18n.language.startsWith('ar')

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t('app.language')}
      onClick={() => void i18n.changeLanguage(isAr ? 'en' : 'ar')}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      {isAr ? 'EN' : 'عربي'}
    </Button>
  )
}
