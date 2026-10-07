import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, MicOff } from 'lucide-react'
import { toast } from 'sonner'
import { useLocaleLayout } from '@/hooks/use-locale-layout'
import { useSpeechToText } from '@/hooks/use-speech-to-text'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const NOTES_MAX_LENGTH = 2000

type VoiceNotesInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  maxLength?: number
}

export function VoiceNotesInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  maxLength = NOTES_MAX_LENGTH,
}: VoiceNotesInputProps) {
  const { t } = useTranslation()
  const { locale } = useLocaleLayout()
  const charCountId = useId()
  const speechLang = locale === 'ar' ? 'ar-SA' : 'en-US'
  const characterCount = value.length
  const nearLimit = characterCount >= maxLength * 0.9

  const setClampedValue = (next: string) => {
    onChange(next.slice(0, maxLength))
  }

  const { supported, listening, toggle, stop } = useSpeechToText({
    lang: speechLang,
    value,
    onChange: setClampedValue,
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
    <div className={cn('space-y-1.5', className)}>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => {
            if (listening) stop()
            setClampedValue(e.target.value)
          }}
          placeholder={
            listening
              ? t('attendance.voice.listening')
              : placeholder || t('attendance.voice.placeholder')
          }
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          className={cn(
            'min-h-[84px] resize-y pe-11',
            listening && 'border-brand-500 ring-2 ring-brand-500/25',
          )}
          aria-label={t('app.notes')}
          aria-describedby={charCountId}
        />
        {supported ? (
          <Button
            type="button"
            size="icon"
            variant={listening ? 'danger' : 'ghost'}
            className={cn(
              'absolute inset-e-1 top-1 h-8 w-8 rounded-lg',
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
      <p
        id={charCountId}
        className={cn(
          'text-end text-xs tabular-nums text-slate-500',
          nearLimit && 'text-amber-600',
          characterCount >= maxLength && 'text-danger',
        )}
      >
        {t('attendance.voice.charCount', {
          current: characterCount,
          max: maxLength,
        })}
      </p>
    </div>
  )
}
