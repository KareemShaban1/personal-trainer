import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import type { Role } from '@/types'
import { LoadingBlock } from '@/components/common/query-state'

function loginPathFor(pathname: string) {
  return pathname.startsWith('/super-admin') ? '/super-admin/login' : '/login'
}

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { isAuthenticated, isBootstrapping, hasRole } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoadingBlock rows={3} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPathFor(location.pathname)} replace state={{ from: location }} />
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, isBootstrapping, hasRole } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoadingBlock rows={3} />
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    if (hasRole('super_admin')) return <Navigate to="/super-admin/organizations" replace />
    if (hasRole('trainee')) return <Navigate to="/portal" replace />
    if (hasRole('parent')) return <Navigate to="/parent" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
