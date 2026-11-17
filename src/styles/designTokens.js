/**
 * Hapvida NotreDame Intermédica — Core Design Tokens (Single Source of Truth)
 * Compartilhado entre tailwind.config.js (build CSS) e src/theme.js (MUI + runtime).
 * Mantém-se livre de dependências de UI/DOM para importação direta em ambiente Node/Vite.
 */

export const COLORS = {
  brand: {
    navy: '#002D62',      // Hapvida Azul Profundo Primário
    navyDark: '#001E42',
    blue: '#0B4F9C',
    orange: '#FF6600'     // Hapvida Laranja Corporativo
  },
  semantic: {
    success: '#16A34A',
    successEmerald: '#10B981',
    warning: '#D97706',
    amber: '#F59E0B',
    danger: '#DC2626',
    redCoral: '#EF4444',
    cyan: '#06B6D4',
    purple: '#8B5CF6'
  },
  surface: {
    canvas: '#f8fafc',
    card: '#ffffff',
    subtle: '#f1f5f9',
    zebra: '#fcfdfe',
    alertEven: '#fffafa',
    alertOdd: '#fff5f5',
    alertHover: '#fee2e2',
    activeFilter: '#eff6ff',
    activeFilterHover: '#dbeafe',
    console: '#0f172a',
    consoleBorder: '#1e293b'
  },
  border: {
    hairline: '#e2e8f0',
    subtle: '#f1f5f9',
    input: '#cbd5e1',
    hover: '#94a3b8',
    activeFilter: '#93c5fd',
    activeFilterHover: '#60a5fa'
  },
  text: {
    primary: '#0f172a',
    strong: '#1e293b',
    secondary: '#334155',
    muted: '#475569',
    subtle: '#64748b',
    placeholder: '#94a3b8',
    inverse: '#ffffff'
  }
}

export const TAILWIND_COLORS = {
  hapvida: {
    navy: COLORS.brand.navy,
    'navy-dark': COLORS.brand.navyDark,
    blue: COLORS.brand.blue,
    orange: COLORS.brand.orange
  },
  surface: {
    canvas: COLORS.surface.canvas,
    card: COLORS.surface.card,
    subtle: COLORS.surface.subtle,
    zebra: COLORS.surface.zebra,
    'alert-even': COLORS.surface.alertEven,
    'alert-odd': COLORS.surface.alertOdd,
    'alert-hover': COLORS.surface.alertHover,
    'active-filter': COLORS.surface.activeFilter,
    'active-filter-hover': COLORS.surface.activeFilterHover
  },
  border: {
    hairline: COLORS.border.hairline,
    subtle: COLORS.border.subtle,
    input: COLORS.border.input,
    hover: COLORS.border.hover
  }
}

export const TYPOGRAPHY = {
  fonts: {
    display: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
  },
  fontFamilies: {
    display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
    sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
  },
  scale: {
    '2xs': '0.625rem',
    label: '0.6875rem',
    xs: '0.72rem',
    sm: '0.75rem',
    base: '0.8125rem',
    md: '0.875rem',
    lg: '0.95rem',
    xl: '1.15rem',
    kpi: '1.75rem',
    hero: '5rem',
    heroLg: '7rem'
  },
  tailwindFontSize: {
    '2xs': ['0.625rem', { lineHeight: '1.2' }],
    label: ['0.6875rem', { lineHeight: '1.25' }],
    body: ['0.8125rem', { lineHeight: '1.4' }],
    subtitle: ['0.9375rem', { lineHeight: '1.35' }],
    title: ['1.125rem', { lineHeight: '1.25' }],
    kpi: ['1.75rem', { lineHeight: '1.15' }],
    hero: ['5rem', { lineHeight: '1' }],
    'hero-lg': ['7rem', { lineHeight: '1' }]
  }
}

export const SPACING = {
  unit: 4,
  grid: 8,
  scale: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    15: 60,
    16: 64,
    18: 72,
    20: 80,
    24: 96,
    62: 248
  },
  sidebarWidth: 264,
  sidebarCollapsedWidth: 72,
  topbarHeight: 60,
  controlHeight: 40,
  compactHeight: 36,
  cardHeaderHeight: 48,
  consoleMaxHeight: 416,
  tailwindSpacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    12: '48px',
    14: '56px',
    15: '60px',
    16: '64px',
    18: '72px',
    20: '80px',
    24: '96px',
    62: '248px',
    logo: '24px',
    'control-sm': '36px',
    control: '40px',
    'card-head': '48px',
    topbar: '60px',
    'sidebar-collapsed': '72px',
    sidebar: '264px',
    'panel-sm': '240px',
    'panel-md': '288px',
    console: '416px',
    'modal-sm': '424px',
    'modal-md': '448px'
  }
}

export const RADII = {
  badge: 6,
  control: 8,
  card: 10,
  popover: 14,
  tailwindRadii: {
    badge: '6px',
    control: '8px',
    card: '10px',
    popover: '14px'
  }
}

export const SHADOWS = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04)',
  cardHover: '0 6px 14px -4px rgba(15, 23, 42, 0.08)',
  popover: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
  stickyLeft: '3px 0 6px -2px rgba(15, 23, 42, 0.07)',
  tailwindShadows: {
    card: '0 1px 2px rgba(15, 23, 42, 0.04)',
    'card-hover': '0 6px 14px -4px rgba(15, 23, 42, 0.08)',
    popover: '0 10px 25px -5px rgba(15, 23, 42, 0.1)'
  }
}

export const Z_INDEX = {
  topbar: '1100',
  sidebar: '1200'
}
