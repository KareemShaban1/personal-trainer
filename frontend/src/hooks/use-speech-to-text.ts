import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternativeLike
}

type SpeechRecognitionEventLike = Event & {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

type SpeechRecognitionErrorEventLike = Event & {
  error: string
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function isSpeechToTextSupported() {
  return Boolean(getSpeechRecognitionCtor())
}

type UseSpeechToTextOptions = {
  lang: string
  value: string
  onChange: (value: string) => void
  onError?: (message: string) => void
  disabled?: boolean
}

export function useSpeechToText({
  lang,
  value,
  onChange,
  onError,
  disabled = false,
}: UseSpeechToTextOptions) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => isSpeechToTextSupported())

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const baseValueRef = useRef(value)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onErrorRef = useRef(onError)
  const shouldRestartRef = useRef(false)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const stop = useCallback(() => {
    shouldRestartRef.current = false
    const recognition = recognitionRef.current
    if (!recognition) {
      setListening(false)
      return
    }
    try {
      recognition.stop()
    } catch {
      // already stopped
    }
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (disabled || !supported) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      onErrorRef.current?.('unsupported')
      return
    }

    // Stop any previous instance cleanly.
    if (recognitionRef.current) {
      shouldRestartRef.current = false
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    baseValueRef.current = valueRef.current.trim()
    shouldRestartRef.current = true
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let finalChunk = ''
      let interimChunk = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = result[0]?.transcript?.trim() || ''
        if (!transcript) continue
        if (result.isFinal) {
          finalChunk = [finalChunk, transcript].filter(Boolean).join(' ')
        } else {
          interimChunk = [interimChunk, transcript].filter(Boolean).join(' ')
        }
      }

      if (finalChunk) {
        baseValueRef.current = [baseValueRef.current, finalChunk].filter(Boolean).join(' ')
      }

      const next = [baseValueRef.current, interimChunk].filter(Boolean).join(' ')
      onChangeRef.current(next)
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return
      shouldRestartRef.current = false
      setListening(false)
      onErrorRef.current?.(event.error)
    }

    recognition.onend = () => {
      if (shouldRestartRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start()
          return
        } catch {
          shouldRestartRef.current = false
        }
      }
      setListening(false)
    }

    try {
      recognition.start()
      setListening(true)
    } catch {
      shouldRestartRef.current = false
      setListening(false)
      onErrorRef.current?.('start-failed')
    }
  }, [disabled, lang, supported])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (disabled && listening) stop()
  }, [disabled, listening, stop])

  return {
    supported,
    listening,
    start,
    stop,
    toggle,
  }
}
