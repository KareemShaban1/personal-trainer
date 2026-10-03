import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, BarChart3, Building2, ClipboardList, Home, Palette, UserRound, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

interface BottomNavItem {
  to: string
  labelKey: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

function getBottomNavItems(role: 'super_admin' | 'trainee' | 'parent' | 'staff'): BottomNavItem[] {
  if (role === 'trainee') {
    return [
      { to: '/portal', labelKey: 'nav.home', icon: Home, end: true },
      { to: '/portal/progress', labelKey: 'nav.progress', icon: Activity },
      { to: '/portal/attendance', labelKey: 'nav.attendance', icon: ClipboardList },
      { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
    ]
  }

  if (role === 'parent') {
    return [
      { to: '/parent', labelKey: 'nav.home', icon: Home, end: true },
      { to: '/parent/progress', labelKey: 'nav.progress', icon: Activity },
      { to: '/parent/attendance', labelKey: 'nav.attendance', icon: ClipboardList },
      { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
    ]
  }

  if (role === 'super_admin') {
    return [
      { to: '/super-admin/organizations', labelKey: 'nav.organizations', icon: Building2 },
      { to: '/super-admin/stats', labelKey: 'nav.stats', icon: BarChart3 },
      { to: '/super-admin/appearance', labelKey: 'nav.appearance', icon: Palette },
      { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
    ]
  }

  return [
    { to: '/dashboard', labelKey: 'nav.home', icon: Home, end: true },
    { to: '/trainees', labelKey: 'nav.trainees', icon: Users },
    { to: '/attendance', labelKey: 'nav.attendance', icon: ClipboardList },
    { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
  ]
}

export function MobileBottomNav() {
  const { t } = useTranslation()
  const { hasRole } = useAuth()

  const role = hasRole('super_admin')
    ? 'super_admin'
    : hasRole('trainee')
      ? 'trainee'
      : hasRole('parent')
        ? 'parent'
        : 'staff'

  const items = getBottomNavItems(role)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle/80 bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label={t('nav.mobileNav')}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={`${item.to}-${item.labelKey}`}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-500 hover:bg-brand-50/60 hover:text-brand-700',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
