import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  FileBarChart2,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Package,
  QrCode,
  ScanLine,
  Settings,
  StickyNote,
  Users,
  UserRound,
  UsersRound,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useBrandName } from '@/contexts/theme-provider'
import { useLocaleLayout } from '@/hooks/use-locale-layout'

interface NavItem {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string }>
}

function staffNav(): NavItem[] {
  return [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/trainees', labelKey: 'nav.trainees', icon: Users },
    { to: '/parents', labelKey: 'nav.parents', icon: UsersRound },
    { to: '/packages', labelKey: 'nav.packages', icon: Package },
    { to: '/subscriptions', labelKey: 'nav.subscriptions', icon: CreditCard },
    { to: '/attendance', labelKey: 'nav.attendance', icon: ClipboardList },
    { to: '/attendance/report', labelKey: 'nav.attendanceReport', icon: FileBarChart2 },
    { to: '/attendance/scan', labelKey: 'nav.scanQr', icon: ScanLine },
    { to: '/attendance/org-qr', labelKey: 'nav.orgQr', icon: QrCode },
    { to: '/progress', labelKey: 'nav.progress', icon: Activity },
    { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
    { to: '/notes', labelKey: 'nav.notes', icon: StickyNote },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
    { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
  ]
}

function traineeNav(): NavItem[] {
  return [
    { to: '/portal', labelKey: 'nav.myDashboard', icon: LayoutDashboard },
    { to: '/portal/subscription', labelKey: 'nav.mySubscription', icon: CreditCard },
    { to: '/portal/attendance', labelKey: 'nav.myAttendance', icon: ClipboardList },
    { to: '/portal/check-in', labelKey: 'nav.checkIn', icon: ScanLine },
    { to: '/portal/progress', labelKey: 'nav.myProgress', icon: Activity },
    { to: '/portal/qr', labelKey: 'nav.myQr', icon: QrCode },
    { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
  ]
}

function parentNav(): NavItem[] {
  return [
    { to: '/parent', labelKey: 'nav.children', icon: Users },
    { to: '/parent/attendance', labelKey: 'nav.attendance', icon: ClipboardList },
    { to: '/parent/progress', labelKey: 'nav.progress', icon: Activity },
    { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
  ]
}

function superAdminNav(): NavItem[] {
  return [
    { to: '/super-admin/organizations', labelKey: 'nav.organizations', icon: Building2 },
    { to: '/super-admin/stats', labelKey: 'nav.stats', icon: BarChart3 },
    { to: '/super-admin/appearance', labelKey: 'nav.appearance', icon: Palette },
    { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
  ]
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const { hasRole, organization } = useAuth()
  const brandName = useBrandName()
  const { dir, textAlign } = useLocaleLayout()

  const items = hasRole('super_admin')
    ? superAdminNav()
    : hasRole('trainee')
      ? traineeNav()
      : hasRole('parent')
        ? parentNav()
        : staffNav()

  return (
    <aside dir={dir} className={cn('flex h-full flex-col bg-brand-950 text-brand-50', textAlign)}>
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-900/40">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">{brandName}</p>
            <p className="truncate text-xs text-brand-200">
              {organization?.name || t('app.tagline')}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={
                item.to === '/portal' ||
                item.to === '/parent' ||
                item.to === '/dashboard' ||
                item.to === '/attendance'
              }
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-white/12 text-white shadow-inner'
                    : 'text-brand-100/80 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
