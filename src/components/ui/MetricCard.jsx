import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import TrendingFlatOutlinedIcon from '@mui/icons-material/TrendingFlatOutlined'
import { Tooltip } from '@mui/material'
import { UI_CLASSES } from '../../theme'
import SkeletonCard from './SkeletonCard'

const PROGRESS_TONE_CLASSES = {
  navy: 'bg-hapvida-navy',
  blue: 'bg-hapvida-blue',
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  brandOrange: 'bg-hapvida-orange',
  red: 'bg-red-500'
}

const TREND_TONE_CLASSES = {
  good: 'text-emerald-800',
  bad: 'text-red-800',
  warning: 'text-amber-800',
  neutral: 'text-slate-600'
}

const TREND_ICONS = {
  up: TrendingUpOutlinedIcon,
  down: TrendingDownOutlinedIcon,
  flat: TrendingFlatOutlinedIcon
}

function normalizeVariant(variant) {
  const v = String(variant || 'simple').toLowerCase().trim()
  if (v === 'progress-bar' || v === 'progress') return 'progress'
  if (v === 'trend') return 'trend'
  return 'simple'
}

/**
 * Grid responsivo padronizado para MetricCards (4px/8px grid tokens).
 */
export function MetricGrid({ children, className = '' }) {
  return (
    <div className={`${UI_CLASSES.kpiGrid} ${className}`.trim()}>
      {children}
    </div>
  )
}

/**
 * Card executivo unificado de KPI com variantes Simple, Progress-Bar e Trend.
 */
export function MetricCard({
  variant = 'simple',
  title,
  value,
  tip,
  Icon,
  tone = 'blue',
  alert = false,
  featured = false,
  loading = false,
  metaText,
  metaIcon: MetaIcon,
  metaClass,
  progress,
  trend,
  className = ''
}) {
  const normalizedVariant = normalizeVariant(variant)
  const effectiveTone = alert ? 'red' : tone
  const toneClasses = UI_CLASSES.kpiTones[effectiveTone] || UI_CLASSES.kpiTones.blue

  if (loading) {
    return (
      <SkeletonCard
        variant="kpi"
        alert={alert}
        title={title}
        hasMeta={Boolean(metaText || progress || trend)}
        ariaLabel={`Carregando ${title}`}
        className={`h-full ${className}`.trim()}
        icon={
          Icon ? (
            <div className={`${UI_CLASSES.kpiIconBox} ${toneClasses.iconBox}`}>
              <Icon sx={{ fontSize: 19 }} />
            </div>
          ) : null
        }
      />
    )
  }

  const baseCardClass = alert ? UI_CLASSES.kpiCardAlert : UI_CLASSES.kpiCard
  const cardClass = [
    baseCardClass,
    'h-full',
    featured ? 'ring-1 ring-hapvida-orange/20' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const progressPct =
    typeof progress === 'number'
      ? Math.min(100, Math.max(0, progress))
      : progress && typeof progress.pct === 'number'
        ? Math.min(100, Math.max(0, progress.pct))
        : null

  const progressBarClass =
    (progress && progress.barClass) ||
    PROGRESS_TONE_CLASSES[effectiveTone] ||
    PROGRESS_TONE_CLASSES.blue

  const trendDir = trend?.direction || 'flat'
  const TrendIcon = trend?.Icon || TREND_ICONS[trendDir] || TrendingFlatOutlinedIcon
  const trendToneClass =
    TREND_TONE_CLASSES[trend?.tone] || metaClass || toneClasses.meta

  const resolvedMetaClass = metaClass || toneClasses.meta
  const resolvedValueClass = alert ? toneClasses.value : 'text-slate-900'

  return (
    <div className={cardClass}>
      <div className={UI_CLASSES.kpiMain}>
        <div className="flex-1 min-w-0">
          <div className={UI_CLASSES.kpiTitle}>
            <span className="truncate">{title}</span>
            {tip && (
              <Tooltip title={tip} arrow placement="top">
                <InfoOutlinedIcon
                  sx={{ fontSize: 14 }}
                  className="text-slate-400 cursor-help shrink-0 transition-colors duration-150 hover:text-hapvida-blue"
                />
              </Tooltip>
            )}
          </div>
          <div className={`${UI_CLASSES.kpiValue} ${resolvedValueClass}`}>{value}</div>
        </div>

        {Icon && (
          <div className={`${UI_CLASSES.kpiIconBox} ${toneClasses.iconBox}`}>
            <Icon sx={{ fontSize: 19 }} />
          </div>
        )}
      </div>

      <div className="px-5 pb-4 flex flex-col gap-2">
        {normalizedVariant === 'progress' && progressPct !== null && (
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${progressBarClass}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {normalizedVariant === 'trend' && trend ? (
          <div className={`text-xs font-semibold leading-snug flex items-center gap-2 ${trendToneClass}`}>
            <TrendIcon sx={{ fontSize: 15 }} className="shrink-0" />
            <span className="truncate tabular-nums">
              {trend.delta ? `${trend.delta} · ` : ''}
              {trend.label}
            </span>
          </div>
        ) : metaText ? (
          <div className={`text-xs font-medium leading-snug flex items-center gap-2 ${resolvedMetaClass}`}>
            {MetaIcon && <MetaIcon sx={{ fontSize: 14 }} className="shrink-0" />}
            <span className="truncate">{metaText}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MetricCard
