import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { GuestRoute, ProtectedRoute } from '@/components/common/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { homePathForRoles, PARENT_ROLES, STAFF_ROLES, SUPER_ADMIN_ROLES, TRAINEE_ROLES } from '@/lib/roles'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { SuperAdminLoginPage } from '@/pages/auth/SuperAdminLoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TraineesPage } from '@/pages/trainees/TraineesPage'
import { TraineeFormPage } from '@/pages/trainees/TraineeFormPage'
import { TraineeDetailPage } from '@/pages/trainees/TraineeDetailPage'
import { ParentsPage } from '@/pages/parents/ParentsPage'
import { PackagesPage } from '@/pages/packages/PackagesPage'
import { SubscriptionsPage } from '@/pages/subscriptions/SubscriptionsPage'
import { AttendancePage } from '@/pages/attendance/AttendancePage'
import { ScanQrPage } from '@/pages/attendance/ScanQrPage'
import { OrgQrPage } from '@/pages/attendance/OrgQrPage'
import { ProgressPage } from '@/pages/progress/ProgressPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { NotesPage } from '@/pages/notes/NotesPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import {
  TraineeAttendancePage,
  TraineeDashboardPage,
  TraineeProgressPage,
  TraineeQrPage,
  TraineeSubscriptionPage,
} from '@/pages/trainee-portal/TraineePortalPages'
import {
  ParentAttendancePage,
  ParentChildrenPage,
  ParentProgressPage,
} from '@/pages/parent-portal/ParentPortalPages'
import {
  SuperAdminAppearancePage,
  SuperAdminOrganizationsPage,
  SuperAdminStatsPage,
} from '@/pages/super-admin/SuperAdminPages'

function HomeRedirect() {
  const { roles } = useAuth()
  return <Navigate to={homePathForRoles(roles)} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          <Route element={<ProtectedRoute roles={[...STAFF_ROLES, ...PARENT_ROLES]} />}>
            <Route path="/trainees/:id" element={<TraineeDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trainees" element={<TraineesPage />} />
            <Route path="/trainees/new" element={<TraineeFormPage />} />
            <Route path="/trainees/:id/edit" element={<TraineeFormPage />} />
            <Route path="/parents" element={<ParentsPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/scan" element={<ScanQrPage />} />
            <Route path="/attendance/org-qr" element={<OrgQrPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={TRAINEE_ROLES} />}>
            <Route path="/portal" element={<TraineeDashboardPage />} />
            <Route path="/portal/subscription" element={<TraineeSubscriptionPage />} />
            <Route path="/portal/attendance" element={<TraineeAttendancePage />} />
            <Route path="/portal/progress" element={<TraineeProgressPage />} />
            <Route path="/portal/qr" element={<TraineeQrPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={PARENT_ROLES} />}>
            <Route path="/parent" element={<ParentChildrenPage />} />
            <Route path="/parent/attendance" element={<ParentAttendancePage />} />
            <Route path="/parent/progress" element={<ParentProgressPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={SUPER_ADMIN_ROLES} />}>
            <Route path="/super-admin/organizations" element={<SuperAdminOrganizationsPage />} />
            <Route path="/super-admin/stats" element={<SuperAdminStatsPage />} />
            <Route path="/super-admin/appearance" element={<SuperAdminAppearancePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
