import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, FileBarChart2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { cn, formatDate, fullName } from '@/lib/utils'
import type { Attendance, Paginated, Trainee } from '@/types'
import { PageHeader } from '@/components/common/page-header'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/common/query-state'
import { VoiceNotesInput } from '@/components/attendance/voice-notes-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AttendanceStatusChoice = 'present' | 'absent'

type RowDraft = {
  status: AttendanceStatusChoice | null
  notes: string
}

function todayIso() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function activeSubscriptionId(trainee: Trainee): number | null {
  const active = (trainee.subscriptions || []).find((s) => s.status === 'active')
  return active?.id ?? null
}

function asStatusChoice(status?: string | null): AttendanceStatusChoice | null {
  return status === 'present' || status === 'absent' ? status : null
}

export function AttendancePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayIso)
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})

  const draftKey = (traineeId: number) => `${date}:${traineeId}`

  const traineesQuery = useQuery({
    queryKey: ['trainees-attendance'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Trainee>>('/trainees', {
        params: { per_page: 200 },
      })
      return data.data
    },
  })

  const attendanceQuery = useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Attendance>>('/attendance', {
        params: { date: date || undefined, per_page: 200 },
      })
      return data
    },
  })

  const existingByTrainee = useMemo(() => {
    const map = new Map<number, Attendance>()
    for (const row of attendanceQuery.data?.data || []) {
      map.set(row.trainee_id, row)
    }
    return map
  }, [attendanceQuery.data])

  const getDraft = (traineeId: number): RowDraft => {
    const key = draftKey(traineeId)
    if (drafts[key]) return drafts[key]

    const existing = existingByTrainee.get(traineeId)
    return {
      status: asStatusChoice(existing?.status),
      notes: existing?.notes || '',
    }
  }

  const setRowStatus = (traineeId: number, status: AttendanceStatusChoice) => {
    const key = draftKey(traineeId)
    const current = getDraft(traineeId)
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        status: current.status === status ? null : status,
        notes: current.notes,
      },
    }))
  }

  const setRowNotes = (traineeId: number, notes: string) => {
    const key = draftKey(traineeId)
    const current = getDraft(traineeId)
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        status: current.status,
        notes,
      },
    }))
  }

  const canEditRow = (trainee: Trainee) =>
    Boolean(activeSubscriptionId(trainee) || existingByTrainee.has(trainee.id))

  const pendingRecords = useMemo(() => {
    const trainees = traineesQuery.data || []
    return trainees
      .map((trainee) => {
        const existing = existingByTrainee.get(trainee.id)
        const draft = getDraft(trainee.id)
        if (!draft.status) return null

        const subscriptionId = activeSubscriptionId(trainee) ?? existing?.subscription_id ?? null
        if (!existing && !subscriptionId) return null

        const unchanged =
          existing &&
          asStatusChoice(existing.status) === draft.status &&
          (existing.notes || '') === (draft.notes || '')

        if (unchanged) return null

        return {
          trainee_id: trainee.id,
          subscription_id: subscriptionId,
          status: draft.status,
          notes: draft.notes || undefined,
        }
      })
      .filter(Boolean) as Array<{
      trainee_id: number
      subscription_id: number | null
      status: AttendanceStatusChoice
      notes?: string
    }>
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getDraft reads drafts/date/existing
  }, [traineesQuery.data, drafts, existingByTrainee, date])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        recorded_count: number
        error_count: number
        errors: Array<{ trainee_id: number; message: string }>
        message: string
      }>('/attendance/bulk', {
        attendance_date: date,
        records: pendingRecords,
      })
      return data
    },
    onSuccess: async (data) => {
      if (data.recorded_count > 0) {
        toast.success(t('attendance.bulkSuccess', { count: data.recorded_count }))
      }
      if (data.error_count > 0) {
        toast.error(t('attendance.bulkPartial', { count: data.error_count }))
      }
      setDrafts((prev) => {
        const next = { ...prev }
        for (const record of pendingRecords) {
          delete next[draftKey(record.trainee_id)]
        }
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: () => {
      toast.error(t('app.somethingWrong'))
    },
  })

  const trainees = traineesQuery.data || []
  const isLoading = traineesQuery.isLoading || attendanceQuery.isLoading
  const isError = traineesQuery.isError || attendanceQuery.isError
  const refetch = () => {
    void traineesQuery.refetch()
    void attendanceQuery.refetch()
  }

  const markAll = (status: AttendanceStatusChoice) => {
    setDrafts((prev) => {
      const next = { ...prev }
      for (const trainee of trainees) {
        if (!canEditRow(trainee)) continue
        const key = draftKey(trainee.id)
        next[key] = {
          status,
          notes: getDraft(trainee.id).notes,
        }
      }
      return next
    })
  }

  const renderStatusControls = (
    traineeId: number,
    draft: RowDraft,
    editable: boolean,
    fullWidth = false,
  ) => (
    <div className={cn(fullWidth ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2')}>
      <Button
        type="button"
        size="sm"
        variant={draft.status === 'present' ? 'default' : 'outline'}
        className={cn(
          fullWidth && 'w-full',
          draft.status === 'present' && 'bg-emerald-600 hover:bg-emerald-700',
        )}
        disabled={!editable}
        onClick={() => setRowStatus(traineeId, 'present')}
      >
        <Check className="h-3.5 w-3.5" />
        {t('attendance.present')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={draft.status === 'absent' ? 'danger' : 'outline'}
        className={cn(fullWidth && 'w-full')}
        disabled={!editable}
        onClick={() => setRowStatus(traineeId, 'absent')}
      >
        <X className="h-3.5 w-3.5" />
        {t('attendance.absent')}
      </Button>
    </div>
  )

  return (
    <div>
      <PageHeader
        title={t('attendance.title')}
        description={t('attendance.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/attendance/report">
                <FileBarChart2 className="h-4 w-4" />
                {t('attendance.report.title')}
              </Link>
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || pendingRecords.length === 0}
            >
              <Save className="h-4 w-4" />
              {t('attendance.saveBulk')}
              {pendingRecords.length > 0 ? ` (${pendingRecords.length})` : ''}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Label className="mb-2 block">{t('app.date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => markAll('present')}>
            {t('attendance.markAllPresent')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => markAll('absent')}>
            {t('attendance.markAllAbsent')}
          </Button>
        </div>
      </div>

      {isLoading ? <LoadingBlock /> : null}
      {isError ? <ErrorBlock onRetry={refetch} /> : null}
      {!isLoading && !isError && !trainees.length ? <EmptyBlock title={t('trainees.empty')} /> : null}

      {!isLoading && !isError && trainees.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {trainees.map((trainee) => {
              const existing = existingByTrainee.get(trainee.id)
              const draft = getDraft(trainee.id)
              const editable = canEditRow(trainee)

              return (
                <div
                  key={trainee.id}
                  className="rounded-2xl border border-border-subtle bg-white p-4"
                >
                  <div className="mb-3">
                    <div className="font-medium">{fullName(trainee.user)}</div>
                    <div className="text-xs text-slate-500">
                      {editable
                        ? existing
                          ? t('attendance.savedForDate', { date: formatDate(existing.attendance_date) })
                          : t('attendance.hasSubscription')
                        : t('attendance.noSubscription')}
                    </div>
                  </div>

                  <div className="mb-3">
                    {renderStatusControls(trainee.id, draft, editable, true)}
                  </div>

                  <VoiceNotesInput
                    value={draft.notes}
                    onChange={(notes) => setRowNotes(trainee.id, notes)}
                    disabled={!editable}
                  />
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border-subtle bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('subscriptions.trainee')}</TableHead>
                  <TableHead>{t('attendance.status')}</TableHead>
                  <TableHead className="w-2/5">{t('app.notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainees.map((trainee) => {
                  const existing = existingByTrainee.get(trainee.id)
                  const draft = getDraft(trainee.id)
                  const editable = canEditRow(trainee)

                  return (
                    <TableRow key={trainee.id}>
                      <TableCell>
                        <div className="font-medium">{fullName(trainee.user)}</div>
                        <div className="text-xs text-slate-500">
                          {editable
                            ? existing
                              ? t('attendance.savedForDate', {
                                  date: formatDate(existing.attendance_date),
                                })
                              : t('attendance.hasSubscription')
                            : t('attendance.noSubscription')}
                        </div>
                      </TableCell>
                      <TableCell>{renderStatusControls(trainee.id, draft, editable)}</TableCell>
                      <TableCell>
                        <VoiceNotesInput
                          value={draft.notes}
                          onChange={(notes) => setRowNotes(trainee.id, notes)}
                          disabled={!editable}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  )
}
