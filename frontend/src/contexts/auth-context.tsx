import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import type { AuthResponse, Organization, Role, User } from '@/types'

interface AuthContextValue {
  user: User | null
  organization: Organization | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  roles: string[]
  hasRole: (...roles: Role[]) => boolean
  isStaff: boolean
  login: (payload: { email?: string; phone?: string; password: string }, options?: { superAdmin?: boolean }) => Promise<User>
  register: (payload: Record<string, unknown>) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
  setOrganization: (org: Organization | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function pickOrganization(user: User, preferred?: Organization | null): Organization | null {
  if (preferred && user.organizations?.some((o) => o.id === preferred.id)) return preferred
  return user.organizations?.[0] ?? preferred ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => authStorage.getToken())
  const [user, setUser] = useState<User | null>(() => authStorage.getUser())
  const [organization, setOrganizationState] = useState<Organization | null>(() =>
    authStorage.getOrganization(),
  )
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(authStorage.getToken()))

  const persistSession = useCallback((nextToken: string, nextUser: User, org?: Organization | null) => {
    const selected = pickOrganization(nextUser, org ?? authStorage.getOrganization())
    authStorage.setToken(nextToken)
    authStorage.setUser(nextUser)
    authStorage.setOrganization(selected)
    setToken(nextToken)
    setUser(nextUser)
    setOrganizationState(selected)
  }, [])

  const setOrganization = useCallback((org: Organization | null) => {
    authStorage.setOrganization(org)
    setOrganizationState(org)
  }, [])

  const refreshMe = useCallback(async () => {
    const { data } = await api.get<{ user: User }>('/auth/me')
    const selected = pickOrganization(data.user, authStorage.getOrganization())
    authStorage.setUser(data.user)
    authStorage.setOrganization(selected)
    setUser(data.user)
    setOrganizationState(selected)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false)
      return
    }
    let cancelled = false
    const tokenAtStart = token
    ;(async () => {
      try {
        await refreshMe()
      } catch {
        // Only wipe the session if this token is still current (avoid races after re-login).
        if (!cancelled && authStorage.getToken() === tokenAtStart) {
          authStorage.clear()
          setToken(null)
          setUser(null)
          setOrganizationState(null)
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, refreshMe])

  const login = useCallback(
    async (
      payload: { email?: string; phone?: string; password: string },
      options?: { superAdmin?: boolean },
    ) => {
      const endpoint = options?.superAdmin ? '/auth/super-admin/login' : '/auth/login'
      const { data } = await api.post<AuthResponse>(endpoint, {
        ...payload,
        device_name: 'web',
      })
      persistSession(data.token, data.user, data.organization)
      return data.user
    },
    [persistSession],
  )

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload)
      persistSession(data.token, data.user, data.organization)
    },
    [persistSession],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network/logout errors
    } finally {
      authStorage.clear()
      setToken(null)
      setUser(null)
      setOrganizationState(null)
      queryClient.clear()
    }
  }, [queryClient])

  const roles = useMemo(() => (user?.roles ?? []).map(String), [user])

  const hasRole = useCallback(
    (...wanted: Role[]) => wanted.some((role) => roles.includes(role)),
    [roles],
  )

  const isStaff = hasRole('organization_owner', 'trainer', 'staff')

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organization,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      roles,
      hasRole,
      isStaff,
      login,
      register,
      logout,
      refreshMe,
      setOrganization,
    }),
    [
      user,
      organization,
      token,
      isBootstrapping,
      roles,
      hasRole,
      isStaff,
      login,
      register,
      logout,
      refreshMe,
      setOrganization,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
