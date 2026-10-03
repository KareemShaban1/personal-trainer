import type { Organization, User } from '@/types'

const TOKEN_KEY = 'trainer_saas_token'
const USER_KEY = 'trainer_saas_user'
const ORG_KEY = 'trainer_saas_organization'

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  getOrganization(): Organization | null {
    const raw = localStorage.getItem(ORG_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Organization
    } catch {
      return null
    }
  },
  setOrganization(org: Organization | null) {
    if (!org) {
      localStorage.removeItem(ORG_KEY)
      return
    }
    localStorage.setItem(ORG_KEY, JSON.stringify(org))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ORG_KEY)
  },
}
