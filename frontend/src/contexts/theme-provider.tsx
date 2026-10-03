import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  readCachedAppearance,
} from '@/lib/appearance'
import type { SystemAppearance } from '@/types'

interface ThemeContextValue {
  appearance: SystemAppearance
  brandName: string
  isLoading: boolean
}

const bootAppearance = readCachedAppearance() ?? DEFAULT_APPEARANCE

const ThemeContext = createContext<ThemeContextValue>({
  appearance: bootAppearance,
  brandName: bootAppearance.brand_name,
  isLoading: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const cached = useMemo(() => readCachedAppearance(), [])

  const { data, isFetching } = useQuery({
    queryKey: ['system-appearance'],
    queryFn: async () => {
      const { data } = await api.get<{ appearance: SystemAppearance }>('/system/appearance')
      return { ...DEFAULT_APPEARANCE, ...data.appearance }
    },
    placeholderData: cached ?? DEFAULT_APPEARANCE,
    staleTime: 60_000,
  })

  const appearance = useMemo(
    () => ({ ...DEFAULT_APPEARANCE, ...(data ?? cached ?? {}) }),
    [data, cached],
  )

  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])

  const value = useMemo<ThemeContextValue>(
    () => ({
      appearance,
      brandName: appearance.brand_name?.trim() || DEFAULT_APPEARANCE.brand_name,
      isLoading: isFetching && !cached && !data,
    }),
    [appearance, isFetching, cached, data],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeSettings() {
  return useContext(ThemeContext)
}

export function useBrandName() {
  return useThemeSettings().brandName
}
