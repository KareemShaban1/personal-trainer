import type { SystemAppearance } from '@/types'

export const APPEARANCE_STORAGE_KEY = 'trainer_saas_appearance'

export const DEFAULT_APPEARANCE: SystemAppearance = {
  brand_name: 'Trainer SaaS',
  pwa_name: 'Trainer SaaS',
  pwa_short_name: 'Trainer',
  pwa_icon: null,
  pwa_icon_url: null,
  primary: '#0f7473',
  primary_dark: '#0d5c5c',
  primary_light: '#3aadaa',
  accent: '#c45c26',
  surface: '#f4f7f8',
  ink: '#0f172a',
  border: '#d9e3e6',
  font_sans: 'DM Sans',
  font_arabic: 'IBM Plex Sans Arabic',
  font_size_base: '16px',
  border_radius: '0.75rem',
}

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return [15, 116, 115]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

function mix(hex: string, target: string, amount: number) {
  const [r1, g1, b1] = hexToRgb(hex)
  const [r2, g2, b2] = hexToRgb(target)
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  )
}

function brandScale(primary: string, dark: string, light: string) {
  return {
    50: mix(primary, '#ffffff', 0.92),
    100: mix(primary, '#ffffff', 0.8),
    200: mix(light, '#ffffff', 0.45),
    300: mix(light, '#ffffff', 0.15),
    400: light,
    500: mix(primary, light, 0.35),
    600: primary,
    700: dark,
    800: mix(dark, '#000000', 0.2),
    900: mix(dark, '#000000', 0.35),
    950: mix(dark, '#000000', 0.55),
  }
}

const FONT_LINK_ID = 'system-appearance-fonts'
let manifestObjectUrl: string | null = null

function loadGoogleFonts(sans: string, arabic: string) {
  const families = [sans, arabic]
    .filter(Boolean)
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&')

  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  return new URL(url, window.location.origin).href
}

function applyPwaManifest(theme: SystemAppearance) {
  const name = theme.pwa_name?.trim() || theme.brand_name
  const shortName = theme.pwa_short_name?.trim() || name
  const customIcon = theme.pwa_icon_url?.trim()

  const icons = customIcon
    ? [
        { src: absoluteUrl(customIcon), sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: absoluteUrl(customIcon), sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: absoluteUrl(customIcon), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]
    : [
        { src: absoluteUrl('/pwa-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: absoluteUrl('/pwa-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: absoluteUrl('/pwa-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]

  const manifest = {
    name,
    short_name: shortName,
    description: 'Sports academy operations, simplified',
    theme_color: theme.primary,
    background_color: theme.surface,
    display: 'standalone',
    orientation: 'portrait-primary',
    start_url: '/',
    scope: '/',
    lang: document.documentElement.lang || 'en',
    icons,
  }

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
  const nextUrl = URL.createObjectURL(blob)

  let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }

  if (manifestObjectUrl) URL.revokeObjectURL(manifestObjectUrl)
  manifestObjectUrl = nextUrl
  link.href = nextUrl

  const appleIcon = customIcon || '/apple-touch-icon.png'
  let apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null
  if (!apple) {
    apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    document.head.appendChild(apple)
  }
  apple.href = customIcon ? absoluteUrl(customIcon) : appleIcon

  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
  if (appleTitle) appleTitle.setAttribute('content', shortName)
}

export function readCachedAppearance(): SystemAppearance | null {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SystemAppearance>
    return { ...DEFAULT_APPEARANCE, ...parsed }
  } catch {
    return null
  }
}

export function cacheAppearance(appearance: SystemAppearance) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    // ignore quota / private mode
  }
}

export function applyAppearance(appearance: Partial<SystemAppearance>, options?: { persist?: boolean }) {
  const theme = { ...DEFAULT_APPEARANCE, ...appearance }
  const root = document.documentElement
  const scale = brandScale(theme.primary, theme.primary_dark, theme.primary_light)

  root.style.setProperty('--brand', theme.primary)
  root.style.setProperty('--brand-dark', theme.primary_dark)
  root.style.setProperty('--brand-light', theme.primary_light)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--surface', theme.surface)
  root.style.setProperty('--ink', theme.ink)
  root.style.setProperty('--border', theme.border)
  root.style.setProperty('--radius', theme.border_radius)
  root.style.setProperty('--font-sans', `'${theme.font_sans}', '${theme.font_arabic}', ui-sans-serif, system-ui, sans-serif`)
  root.style.setProperty('--font-display', `'${theme.font_sans}', '${theme.font_arabic}', ui-sans-serif, system-ui, sans-serif`)
  root.style.setProperty('font-size', theme.font_size_base)

  Object.entries(scale).forEach(([key, value]) => {
    root.style.setProperty(`--color-brand-${key}`, value)
  })
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-surface', theme.surface)
  root.style.setProperty('--color-border-subtle', theme.border)
  root.style.setProperty('--color-slate-ink', theme.ink)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.primary)

  if (theme.brand_name) {
    document.title = `${theme.brand_name} — Sports Academy Platform`
  }

  applyPwaManifest(theme)
  loadGoogleFonts(theme.font_sans, theme.font_arabic)

  if (options?.persist !== false) {
    cacheAppearance(theme)
  }

  return theme
}

/** Apply cached theme before React mounts to avoid color flash. */
export function applyCachedAppearance() {
  const cached = readCachedAppearance()
  if (cached) applyAppearance(cached, { persist: false })
  return cached
}
