import type { Role } from '@/types'

export const STAFF_ROLES: Role[] = ['organization_owner', 'trainer', 'staff']
export const TRAINEE_ROLES: Role[] = ['trainee']
export const PARENT_ROLES: Role[] = ['parent']
export const SUPER_ADMIN_ROLES: Role[] = ['super_admin']

export function homePathForRoles(roles: string[] = []) {
  if (roles.includes('super_admin')) return '/super-admin/organizations'
  if (roles.includes('trainee')) return '/portal'
  if (roles.includes('parent')) return '/parent'
  return '/dashboard'
}
