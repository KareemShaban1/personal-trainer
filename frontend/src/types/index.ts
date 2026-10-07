export type Role =
  | 'super_admin'
  | 'organization_owner'
  | 'trainer'
  | 'staff'
  | 'trainee'
  | 'parent'

export interface OrganizationStats {
  users_count: number
  owners_count: number
  trainers_count: number
  staff_count: number
  trainees_count: number
  parents_count: number
  branches_count: number
  packages_count: number
  subscriptions_count: number
  active_subscriptions_count: number
  payments_count: number
  attendance_count: number
}

export interface Organization {
  id: number
  name: string
  slug: string
  email?: string | null
  phone?: string | null
  country?: string | null
  city?: string | null
  timezone?: string | null
  currency?: string | null
  status?: string | null
  logo?: string | null
  trial_ends_at?: string | null
  settings?: OrganizationSettings | null
  stats?: OrganizationStats | null
  created_at?: string
  updated_at?: string
}

export interface SystemAppearance {
  brand_name: string
  pwa_name: string
  pwa_short_name: string
  pwa_icon?: string | null
  pwa_icon_url?: string | null
  primary: string
  primary_dark: string
  primary_light: string
  accent: string
  surface: string
  ink: string
  border: string
  font_sans: string
  font_arabic: string
  font_size_base: string
  border_radius: string
}

export interface OrganizationSettings {
  id?: number
  organization_id?: number
  check_in_radius_meters?: number
  require_geolocation?: boolean
  attendance_qr_ttl_seconds?: number
  settings?: Record<string, unknown> | null
}

export interface User {
  id: number
  first_name: string
  last_name: string
  name: string
  email?: string | null
  phone?: string | null
  gender?: string | null
  date_of_birth?: string | null
  avatar?: string | null
  status?: string | null
  bio?: string | null
  roles?: Role[] | string[]
  organizations?: Organization[]
  created_at?: string
}

export interface Trainee {
  id: number
  organization_id: number
  code?: string | null
  status?: string | null
  branch_id?: number | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  medical_notes?: string | null
  user?: User
  subscriptions?: Subscription[]
  parents?: ParentProfile[]
  created_at?: string
}

export interface ParentProfile {
  id: number
  organization_id: number
  status?: string | null
  user?: User
  trainees?: Trainee[]
  created_at?: string
}

export interface Package {
  id: number
  name: string
  description?: string | null
  sessions_count: number
  duration_days?: number | null
  price: number | string
  currency: string
  is_active: boolean
  created_at?: string
}

export interface Subscription {
  id: number
  trainee_id: number
  package_id: number
  status?: string | null
  started_at?: string | null
  ends_at?: string | null
  remaining_sessions?: number | null
  notes?: string | null
  trainee?: Trainee
  package?: Package
  created_at?: string
}

export interface Attendance {
  id: number
  trainee_id: number
  subscription_id?: number | null
  branch_id?: number | null
  status?: string | null
  attendance_date?: string | null
  checked_in_at?: string | null
  check_in_method?: string | null
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  trainee?: Trainee
  subscription?: Subscription
  created_at?: string
}

export interface ProgressRecord {
  id: number
  trainee_id: number
  notes?: string | null
  recorded_at?: string | null
  skills?: ProgressSkill[]
  trainee?: Trainee
  created_at?: string
}

export interface ProgressSkill {
  id?: number
  skill_category_id?: number | null
  skill_name: string
  rating?: number | null
  notes?: string | null
}

export interface Note {
  id: number
  notable_type: string
  notable_id: number
  body: string
  visibility?: string | null
  author?: User
  created_at?: string
}

export interface Payment {
  id: number
  subscription_id?: number | null
  trainee_id: number
  amount: number | string
  currency: string
  method?: string | null
  status?: string | null
  paid_at?: string | null
  reference?: string | null
  notes?: string | null
  trainee?: Trainee
  created_at?: string
}

export interface Paginated<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links?: Record<string, string | null>
}

export interface DashboardData {
  stats: {
    trainees_count: number
    active_subscriptions: number
    attendance_today: number
    present_today: number
    revenue_this_month: number
  }
  low_session_subscriptions: Subscription[]
  recent_attendance: Attendance[]
}

export interface AuthResponse {
  token: string
  token_type: string
  user: User
  organization?: Organization
  message?: string
}

export interface AppNotification {
  id: string
  type: string
  data: Record<string, unknown>
  read_at?: string | null
  created_at: string
}

export interface SearchResult {
  trainees: Trainee[]
  packages: Package[]
}
