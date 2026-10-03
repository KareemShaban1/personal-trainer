import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { authStorage } from '@/lib/auth-storage'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()
  const org = authStorage.getOrganization()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (org?.id) {
    config.headers['X-Organization-Id'] = String(org.id)
  }
  return config
})

function extractErrorMessage(error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) {
  const data = error.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (first?.[0]) return first[0]
  }
  if (data?.message) return data.message
  if (error.message) return error.message
  return 'Something went wrong'
}

function isCredentialAuthRequest(url?: string) {
  if (!url) return false
  return (
    url.includes('/auth/super-admin/login') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register')
  )
}

function loginRedirectPath() {
  return window.location.pathname.startsWith('/super-admin')
    ? '/super-admin/login'
    : '/login'
}

function requestBearerToken(config?: InternalAxiosRequestConfig) {
  const header = config?.headers?.Authorization ?? config?.headers?.authorization
  if (typeof header !== 'string') return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status
    const message = extractErrorMessage(error)
    const requestUrl = error.config?.url
    const isAuthAttempt = isCredentialAuthRequest(requestUrl)

    if (status === 401 && !isAuthAttempt) {
      const failedToken = requestBearerToken(error.config)
      const currentToken = authStorage.getToken()
      // Ignore stale 401s from requests started before a fresh login.
      const isCurrentSession = !failedToken || !currentToken || failedToken === currentToken

      if (isCurrentSession) {
        authStorage.clear()
        const target = loginRedirectPath()
        if (window.location.pathname !== target) {
          window.location.href = target
        }
      }
    }

    if (status !== 401 || isAuthAttempt) {
      toast.error(message)
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return extractErrorMessage(error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>)
  }
  return 'Something went wrong'
}
