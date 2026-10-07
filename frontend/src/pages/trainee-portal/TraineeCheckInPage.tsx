import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

async function getPosition(): Promise<{ latitude?: number; longitude?: number }> {
  if (!navigator.geolocation) return {}
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })
}

export function TraineeCheckInPage() {
  const { t } = useTranslation()
  const [manualToken, setManualToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({})
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastToken = useRef('')
  const readerId = 'trainee-org-qr-reader'

  useEffect(() => {
    void getPosition().then(setCoords)
  }, [])

  const checkInMutation = useMutation({
    mutationFn: async (orgQrToken: string) => {
      const position = Object.keys(coords).length ? coords : await getPosition()
      await api.post('/attendance/self-check-in', {
        org_qr_token: orgQrToken.trim(),
        latitude: position.latitude,
        longitude: position.longitude,
      })
    },
    onSuccess: () => {
      toast.success(t('traineePortal.checkInSuccess'))
      setManualToken('')
    },
  })

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop().catch(() => undefined)
      }
    }
  }, [])

  async function startScanner() {
    if (scanning) return
    const scanner = new Html5Qrcode(readerId)
    scannerRef.current = scanner
    setScanning(true)
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 250, height: 250 } },
      (decoded) => {
        if (decoded && decoded !== lastToken.current && !checkInMutation.isPending) {
          lastToken.current = decoded
          void checkInMutation.mutateAsync(decoded).finally(() => {
            window.setTimeout(() => {
              lastToken.current = ''
            }, 2500)
          })
        }
      },
      () => undefined,
    )
  }

  async function stopScanner() {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  return (
    <div>
      <PageHeader
        title={t('traineePortal.checkInTitle')}
        description={t('traineePortal.checkInSubtitle')}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div id={readerId} className="overflow-hidden rounded-xl bg-slate-900/5" />
            <div className="flex gap-2">
              {!scanning ? (
                <Button onClick={() => void startScanner()}>
                  {t('traineePortal.startScan')}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => void stopScanner()}>
                  {t('app.cancel')}
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {coords.latitude
                ? `${coords.latitude.toFixed(5)}, ${coords.longitude?.toFixed(5)}`
                : t('attendance.locationRequired')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-5">
            <Label>{t('traineePortal.orgQrToken')}</Label>
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder={t('traineePortal.orgQrPlaceholder')}
            />
            <Button
              disabled={!manualToken.trim() || checkInMutation.isPending}
              onClick={() => checkInMutation.mutate(manualToken)}
            >
              {t('traineePortal.confirmCheckIn')}
            </Button>
            <p className="text-xs leading-relaxed text-slate-500">
              {t('traineePortal.checkInHint')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
