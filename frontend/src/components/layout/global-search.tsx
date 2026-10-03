import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'
import { fullName } from '@/lib/utils'
import type { SearchResult } from '@/types'
import { Input } from '@/components/ui/input'

export function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 300)
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['search', debounced],
    enabled: debounced.trim().length >= 2,
    queryFn: async () => {
      const { data } = await api.get<SearchResult>('/search', { params: { q: debounced } })
      return data
    },
  })

  const hasResults = useMemo(
    () => Boolean((data?.trainees?.length || 0) + (data?.packages?.length || 0)),
    [data],
  )

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={t('nav.searchPlaceholder')}
        className="ps-9"
      />
      {open && debounced.trim().length >= 2 ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border-subtle bg-white shadow-xl">
          {!hasResults ? (
            <p className="px-3 py-4 text-sm text-slate-500">{t('app.noResults')}</p>
          ) : (
            <div className="max-h-72 overflow-auto py-1">
              {data?.trainees?.map((trainee) => (
                <button
                  key={`t-${trainee.id}`}
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-start hover:bg-brand-50"
                  onMouseDown={() => {
                    navigate(`/trainees/${trainee.id}`)
                    setOpen(false)
                    setQ('')
                  }}
                >
                  <span className="text-sm font-medium">{fullName(trainee.user)}</span>
                  <span className="text-xs text-slate-500">{trainee.code || trainee.user?.phone}</span>
                </button>
              ))}
              {data?.packages?.map((pkg) => (
                <button
                  key={`p-${pkg.id}`}
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-start hover:bg-brand-50"
                  onMouseDown={() => {
                    navigate('/packages')
                    setOpen(false)
                    setQ('')
                  }}
                >
                  <span className="text-sm font-medium">{pkg.name}</span>
                  <span className="text-xs text-slate-500">{pkg.sessions_count} sessions</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
