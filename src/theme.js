import { createTheme } from '@mui/material'
import {
  COLORS,
  RADII,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  Z_INDEX
} from './styles/designTokens'

export { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY, Z_INDEX }

/**
 * Classes Tailwind compartilhadas entre componentes e páginas
 * Baseadas estritamente na escala de 4px/8px e tokens de tailwind.config.js
 */
export const UI_CLASSES = {
  // Layout & Shell
  pageShell: 'min-h-screen bg-surface-canvas flex',
  sidebarShell: 'w-sidebar-collapsed md:w-sidebar shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-sidebar',
  sidebarHeader: 'p-3 md:px-4 md:py-4 border-b border-slate-100 flex flex-col gap-2',
  sidebarBrandTitle: 'hidden md:block font-display font-bold text-sm text-hapvida-navy tracking-tight leading-tight',
  sidebarSectionTitle: 'hidden md:block px-3 mb-2 text-label font-bold text-slate-500 tracking-wider',
  sidebarFooter: 'hidden md:flex flex-col gap-2 p-4 border-t border-slate-100 bg-surface-zebra',
  syncBox: 'bg-slate-50 text-slate-900 border border-slate-200 rounded-control p-3 cursor-default',
  historicalBox: 'flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-control p-3 text-xs font-semibold tabular-nums',
  mainContentArea: 'flex-1 min-w-0 flex flex-col',
  mainContentPadding: 'px-4 md:px-6 py-5',

  // TopBar
  topbarTitle: 'font-display font-bold text-slate-900 text-subtitle md:text-title leading-tight truncate',
  topbarSubtitle: 'hidden sm:block text-xs font-medium text-slate-600 truncate',
  zoomTrigger: 'inline-flex items-center gap-1 h-control-sm px-3 rounded-control border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold tabular-nums whitespace-nowrap transition-colors duration-150 hover:bg-slate-100 hover:border-slate-300',
  refreshIconBtn: 'w-control-sm h-control-sm rounded-control border border-slate-200 bg-white text-hapvida-navy flex items-center justify-center transition-colors duration-150 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50',

  // Cards & Sections
  cardSurface: 'bg-white border border-slate-200 rounded-card shadow-card overflow-hidden',
  cardHeader: 'bg-slate-50 text-slate-900 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap relative',
  cardHeaderTitle: 'font-display font-bold text-subtitle text-slate-900 tracking-tight leading-snug',
  cardHeaderSubtitle: 'block text-xs text-slate-600 mt-1',
  filterBar: 'mb-6 p-3 bg-white border border-slate-200 rounded-card shadow-card flex items-center gap-3 flex-wrap',

  // KPI Cards
  kpiGrid: 'grid grid-cols-[repeat(auto-fit,minmax(192px,1fr))] gap-4 mb-6',
  kpiCard: 'bg-white rounded-card border border-slate-200 shadow-card overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-slate-300 cursor-default',
  kpiCardAlert: 'bg-white rounded-card border border-red-200 shadow-card overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-red-300 cursor-default',
  kpiMain: 'px-5 pt-4 pb-3 flex justify-between items-start gap-3',
  kpiTitle: 'text-xs font-semibold text-slate-600 tracking-[0.01em] flex items-center gap-2 min-w-0',
  kpiValue: 'text-kpi font-bold leading-[1.15] mt-2 font-display tabular-nums tracking-tight text-slate-900',
  kpiIconBox: 'w-9 h-9 rounded-control flex items-center justify-center shrink-0',
  kpiMeta: 'px-5 pb-4 text-xs font-medium leading-snug flex items-center gap-2',

  // KPI Icon & Meta tone presets
  kpiTones: {
    navy: { iconBox: 'bg-slate-100 text-hapvida-navy', meta: 'text-slate-600', value: 'text-slate-900' },
    blue: { iconBox: 'bg-blue-50 text-hapvida-blue', meta: 'text-blue-800', value: 'text-slate-900' },
    green: { iconBox: 'bg-emerald-50 text-emerald-600', meta: 'text-emerald-800', value: 'text-slate-900' },
    orange: { iconBox: 'bg-amber-50 text-amber-600', meta: 'text-amber-800', value: 'text-slate-900' },
    brandOrange: { iconBox: 'bg-orange-50 text-hapvida-orange', meta: 'text-orange-800', value: 'text-slate-900' },
    red: { iconBox: 'bg-red-50 text-red-600', meta: 'text-red-800', value: 'text-red-800' }
  },

  // Badges & Status Tags
  badgeBase: 'inline-flex items-center justify-center gap-1 rounded-badge font-semibold tabular-nums leading-tight tracking-[0.01em] whitespace-nowrap border',
  badgeSizes: {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-body'
  },
  badgeVariants: {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200'
  },

  // Typography helpers
  tabularNums: 'tabular-nums',
  monoTabular: 'font-mono tabular-nums text-xs',
  switchLabel: 'text-body font-semibold text-slate-700',
  emptyState: 'text-center py-14 text-slate-500 text-sm',

  // Controls & Surfaces
  dropzoneBox: 'p-6 mb-4 border-[1.5px] border-dashed border-slate-300 rounded-control bg-slate-50 text-center transition-colors duration-150 hover:border-hapvida-blue',
  logConsole: 'm-0 max-h-console overflow-auto bg-slate-900 text-slate-200 p-4 rounded-control border border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words',
  statChipBox: 'bg-slate-50 px-3 py-2 rounded-control border border-slate-200 text-xs tabular-nums text-slate-600'
}

/**
 * Tema MUI derivado integralmente dos tokens da marca Hapvida
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: COLORS.brand.navy,
      light: COLORS.brand.blue,
      dark: COLORS.brand.navyDark
    },
    secondary: { main: COLORS.brand.orange },
    success: { main: COLORS.semantic.success },
    warning: { main: COLORS.semantic.warning },
    error: { main: COLORS.semantic.danger },
    background: {
      default: COLORS.surface.canvas,
      paper: COLORS.surface.card
    },
    text: {
      primary: COLORS.text.primary,
      secondary: COLORS.text.muted
    },
    divider: COLORS.border.hairline
  },
  shape: {
    borderRadius: RADII.control
  },
  typography: {
    fontFamily: TYPOGRAPHY.fonts.sans,
    h4: { fontFamily: TYPOGRAPHY.fonts.display, fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontFamily: TYPOGRAPHY.fonts.display, fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontFamily: TYPOGRAPHY.fonts.display, fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontFamily: TYPOGRAPHY.fonts.display, fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADII.control,
          fontWeight: 600,
          whiteSpace: 'nowrap'
        },
        containedPrimary: {
          backgroundColor: COLORS.brand.navy,
          color: COLORS.text.inverse,
          '&:hover': {
            backgroundColor: COLORS.brand.blue
          }
        },
        outlinedInherit: {
          borderColor: COLORS.border.input,
          color: COLORS.text.secondary,
          backgroundColor: COLORS.surface.card
        },
        outlinedPrimary: {
          borderColor: COLORS.border.input,
          color: COLORS.text.secondary,
          backgroundColor: COLORS.surface.card,
          '&:hover': {
            borderColor: COLORS.border.hover,
            backgroundColor: COLORS.surface.canvas
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADII.control,
          backgroundColor: COLORS.surface.card,
          '&.MuiInputBase-sizeSmall': {
            minHeight: SPACING.controlHeight
          }
        },
        notchedOutline: {
          borderColor: COLORS.border.input
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: COLORS.surface.subtle,
          color: COLORS.text.secondary,
          fontWeight: 600,
          fontSize: TYPOGRAPHY.scale.xs,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          borderBottom: `1px solid ${COLORS.border.hairline}`,
          padding: '10px 14px',
          whiteSpace: 'nowrap'
        },
        body: {
          fontSize: TYPOGRAPHY.scale.base,
          color: COLORS.text.strong,
          borderBottom: `1px solid ${COLORS.border.subtle}`,
          fontVariantNumeric: 'tabular-nums'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.text.primary,
          fontSize: TYPOGRAPHY.scale.sm,
          borderRadius: RADII.badge,
          padding: '6px 10px'
        },
        arrow: {
          color: COLORS.text.primary
        }
      }
    }
  }
})
