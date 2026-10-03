import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface OrgQrResponse {
  token: string
  type: string
  expires_at?: string
}

export function OrgQrPage() {
  const { t } = useTranslation()

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<OrgQrResponse>('/attendance/org-qr')
      return data
    },
  })

  return (
    <div>
      <PageHeader
        title={t('attendance.orgQrTitle')}
        description={t('attendance.orgQrSubtitle')}
        actions={
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {t('attendance.generateQr')}
          </Button>
        }
      />
      <Card className="max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          {mutation.data ? (
            <>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-border-subtle">
                <QRCodeSVG value={mutation.data.token} size={220} />
              </div>
              <p className="text-center text-sm text-slate-500">
                {mutation.data.type}
                {mutation.data.expires_at ? ` · ${formatDate(mutation.data.expires_at)}` : ''}
              </p>
              <code className="max-w-full break-all rounded-lg bg-slate-100 px-3 py-2 text-xs">
                {mutation.data.token}
              </code>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t('attendance.orgQrSubtitle')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
