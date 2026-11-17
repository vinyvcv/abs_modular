import { TableCell, TableRow } from '@mui/material'
import { UI_CLASSES } from '../../theme'

/**
 * Barra pulsante padronizada em Tailwind (grid 4px/8px)
 */
export function SkeletonBar({ className = 'h-4 w-full', rounded = 'rounded-badge' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 ${rounded} ${className}`.trim()}
    />
  )
}

/**
 * Linhas skeleton padronizadas para tabelas HTML/MUI
 */
export function SkeletonTableRows({ cols = 5, rows = 6, dense = true }) {
  const cellPy = dense ? 'py-3' : 'py-4'
  return Array.from({ length: rows }).map((_, rIdx) => (
    <TableRow
      key={`skeleton-row-${rIdx}`}
      className={rIdx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-zebra'}
    >
      {Array.from({ length: cols }).map((__, cIdx) => {
        const widthClass =
          cIdx === 0 ? 'w-20' : cIdx === 1 ? 'w-3/4' : cIdx % 2 === 0 ? 'w-14 ml-auto' : 'w-16 ml-auto'
        return (
          <TableCell
            key={`skeleton-cell-${rIdx}-${cIdx}`}
            className={`${cellPy} px-4 border-b border-slate-100`}
          >
            <SkeletonBar className={`h-4 ${widthClass}`} />
          </TableCell>
        )
      })}
    </TableRow>
  ))
}

const CHART_BAR_HEIGHTS = ['h-24', 'h-40', 'h-32', 'h-56', 'h-48', 'h-64', 'h-36', 'h-52']

/**
 * SkeletonCard — Componente reutilizável de carregamento baseado em Tailwind animate-pulse
 * e escala de espaçamento de 4px/8px.
 *
 * Variantes:
 * - 'card': Bloco de conteúdo com linhas de texto/resumo
 * - 'kpi': Card de métrica executiva (compatível com KpiCards / KpiBox)
 * - 'chart': Canvas analítico com eixos e barras simuladas
 * - 'table': Cabeçalho + linhas tabulares simuladas
 * - 'console': Bloco de logs monoespaçados
 */
export function SkeletonCard({
  variant = 'card',
  inline = false,
  showHeader = true,
  rows = 4,
  cols = 5,
  heightClass = 'h-80',
  alert = false,
  title,
  icon = null,
  hasMeta = true,
  className = '',
  ariaLabel = 'Carregando dados...'
}) {
  if (variant === 'kpi') {
    const kpiSurface = alert ? UI_CLASSES.kpiCardAlert : UI_CLASSES.kpiCard
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={ariaLabel}
        className={`${kpiSurface} ${className}`.trim()}
      >
        <div className={UI_CLASSES.kpiMain}>
          <div className="flex-1 min-w-0">
            {title ? (
              <div className={UI_CLASSES.kpiTitle}>
                <span className="truncate">{title}</span>
              </div>
            ) : (
              <SkeletonBar className="h-3 w-28" />
            )}
            <SkeletonBar className="h-7 w-24 mt-2" rounded="rounded-control" />
          </div>
          {icon || (
            <div className={`${UI_CLASSES.kpiIconBox} bg-slate-100 animate-pulse`} aria-hidden="true">
              <div className="w-5 h-5 rounded-badge bg-slate-200/80" />
            </div>
          )}
        </div>
        {hasMeta && (
          <div className={UI_CLASSES.kpiMeta}>
            <SkeletonBar className="h-3 w-3/4" />
          </div>
        )}
        <span className="sr-only">{ariaLabel}</span>
      </div>
    )
  }

  const headerNode = !inline && showHeader ? (
    <div className={UI_CLASSES.cardHeader}>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <SkeletonBar className="h-4 w-48" />
        <SkeletonBar className="h-3 w-64 max-w-full" />
      </div>
      <SkeletonBar className="h-8 w-28 shrink-0" rounded="rounded-control" />
    </div>
  ) : null

  let bodyNode = null

  if (variant === 'chart') {
    bodyNode = (
      <div className={`${inline ? '' : 'p-4'} flex flex-col gap-4`}>
        <div
          className={`${heightClass} w-full rounded-control bg-slate-50 border border-slate-100 p-4 flex flex-col justify-between animate-pulse`}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-16 rounded-badge bg-slate-200/80" />
              <div className="h-3 w-16 rounded-badge bg-slate-200/80" />
              <div className="h-3 w-16 rounded-badge bg-slate-200/80" />
            </div>
            <div className="h-3 w-20 rounded-badge bg-slate-200/80" />
          </div>

          <div className="flex-1 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-200/80">
            {CHART_BAR_HEIGHTS.map((barH, idx) => (
              <div
                key={idx}
                className={`flex-1 ${barH} rounded-t-badge bg-slate-200/75`}
              />
            ))}
          </div>

          <div className="flex justify-between gap-3 pt-2 px-2">
            {CHART_BAR_HEIGHTS.map((_, idx) => (
              <div key={idx} className="flex-1 h-2 rounded-badge bg-slate-200/70" />
            ))}
          </div>
        </div>
      </div>
    )
  } else if (variant === 'table') {
    const colIndices = Array.from({ length: cols })
    bodyNode = (
      <div className={inline ? '' : 'p-0'} aria-hidden="true">
        <div className="grid grid-flow-col auto-cols-fr gap-4 px-4 py-3 bg-surface-subtle border-b border-slate-200">
          {colIndices.map((_, idx) => (
            <SkeletonBar key={`th-${idx}`} className="h-3 w-3/4" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div
              key={`tr-${rIdx}`}
              className={`grid grid-flow-col auto-cols-fr gap-4 px-4 py-3 ${
                rIdx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-zebra'
              }`}
            >
              {colIndices.map((__, cIdx) => (
                <SkeletonBar
                  key={`td-${rIdx}-${cIdx}`}
                  className={`h-4 ${cIdx === 0 ? 'w-4/5' : 'w-2/3'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  } else if (variant === 'console') {
    bodyNode = (
      <div
        className={`${UI_CLASSES.logConsole} flex flex-col gap-3 animate-pulse`}
        aria-hidden="true"
      >
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={`log-sk-${idx}`}
            className={`h-3 rounded-badge bg-slate-700/80 ${
              idx % 3 === 0 ? 'w-11/12' : idx % 3 === 1 ? 'w-3/4' : 'w-4/5'
            }`}
          />
        ))}
      </div>
    )
  } else {
    bodyNode = (
      <div className={`${inline ? 'py-2' : 'p-5'} flex flex-col gap-4`} aria-hidden="true">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={`line-${idx}`} className="flex flex-col gap-2">
            <SkeletonBar className={`h-4 ${idx % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
            {idx === 0 && <SkeletonBar className="h-3 w-1/2" />}
          </div>
        ))}
      </div>
    )
  }

  if (inline) {
    return (
      <div role="status" aria-busy="true" aria-label={ariaLabel} className={className}>
        {bodyNode}
        <span className="sr-only">{ariaLabel}</span>
      </div>
    )
  }

  return (
    <section
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`${UI_CLASSES.cardSurface} mb-6 ${className}`.trim()}
    >
      {headerNode}
      {bodyNode}
      <span className="sr-only">{ariaLabel}</span>
    </section>
  )
}

export default SkeletonCard
