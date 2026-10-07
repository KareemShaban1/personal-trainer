import { useTranslation } from 'react-i18next'
import { Mic, MicOff } from 'lucide-react'
import { toast } from 'sonner'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { useSpeechToText } from '@/hooks/use-speech-to-text'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type VoiceNotesInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function VoiceNotesInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
}: VoiceNotesInputProps) {
  const { t } = useTranslation()
  const { locale } = useLocaleLayout()
  const speechLang = locale === 'ar' ? 'ar-SA' : 'en-US'

  const { supported, listening, toggle, stop } = useSpeechToText({
    lang: speechLang,
    value,
    onChange,
    disabled,
    onError: (error) => {
      if (error === 'not-allowed') {
        toast.error(t('attendance.voice.micDenied'))
        return
      }
      if (error === 'unsupported') {
        toast.error(t('attendance.voice.unsupported'))
        return
      }
      toast.error(t('attendance.voice.error'))
    },
  })

  return (
    <div className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(e) => {
          if (listening) stop()
          onChange(e.target.value)
        }}
        placeholder={
          listening
            ? t('attendance.voice.listening')
            : placeholder || t('attendance.voice.placeholder')
        }
        disabled={disabled}
        className={cn('pe-11', listening && 'border-brand-500 ring-2 ring-brand-500/25')}
        aria-label={t('app.notes')}
      />
      {supported ? (
        <Button
          type="button"
          size="icon"
          variant={listening ? 'danger' : 'ghost'}
          className={cn(
            'absolute inset-e-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg',
            listening && 'animate-pulse',
          )}
          disabled={disabled}
          onClick={toggle}
          aria-pressed={listening}
          aria-label={
            listening ? t('attendance.voice.stop') : t('attendance.voice.start')
          }
          title={listening ? t('attendance.voice.stop') : t('attendance.voice.start')}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      ) : null}
    </div>
  )
}
