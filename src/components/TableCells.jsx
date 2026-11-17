import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutlined'
import { UI_CLASSES } from '../theme'
import {
  formatAbsPercent,
  formatAbsPercentComma,
  formatMilhar,
  formatSituacaoPercent,
  formatTime,
  formatTipoLoginText,
  normalizeAbsValue
} from '../utils/format'

export function renderResumoCell(col, row, raw, { useComma = false } = {}) {
  const isTotal = row.Segmento === 'TOTAL GERAL'
  const totalClass = isTotal ? 'font-bold text-slate-900' : ''

  if (col.field === 'ABS') {
    const absValue = normalizeAbsValue(raw)
    if (absValue === null) return <span className="text-slate-400">—</span>
    const formatted = useComma ? formatAbsPercentComma(raw) : formatAbsPercent(raw)
    const clampedPct = Math.min(100, Math.max(0, (absValue / 15) * 100))

    const toneText =
      absValue <= 5
        ? 'text-emerald-700'
        : absValue <= 8
          ? 'text-amber-700'
          : 'text-red-700'
    const toneBar =
      absValue <= 5
        ? 'bg-emerald-500'
        : absValue <= 8
          ? 'bg-amber-500'
          : 'bg-red-500'

    return (
      <div className="inline-flex items-center justify-end gap-2 min-w-[96px]">
        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0" aria-hidden="true">
          <div
            className={`h-full rounded-full ${toneBar}`}
            style={{ width: `${Math.max(8, clampedPct)}%` }}
          />
        </div>
        <span className={`font-mono tabular-nums text-xs font-bold ${toneText}`}>
          {formatted}
        </span>
      </div>
    )
  }

  if (['Total', 'Previstos', 'Escalados', 'Faltas', 'Presentes'].includes(col.field)) {
    return (
      <span className={`${UI_CLASSES.tabularNums} ${totalClass}`.trim()}>
        {formatMilhar(raw)}
      </span>
    )
  }

  return (
    <span className={totalClass || undefined}>
      {raw ?? ''}
    </span>
  )
}

export function renderSituacaoCell(col, row, raw) {
  const isTotal = row.Situação === 'TOTAL'
  const totalClass = isTotal ? 'font-bold text-slate-900' : ''

  if (col.field === 'Pct') {
    return (
      <span className={`${UI_CLASSES.tabularNums} ${totalClass}`.trim()}>
        {formatSituacaoPercent(row.Pct)}
      </span>
    )
  }
  if (col.field === 'Qtd') {
    return (
      <span className={`${UI_CLASSES.tabularNums} ${totalClass}`.trim()}>
        {formatMilhar(raw)}
      </span>
    )
  }
  return <span className={totalClass || undefined}>{raw ?? ''}</span>
}

export function renderOperadorCell(col, row, raw) {
  if (col.field === 'status') {
    const v = String(raw || '').toUpperCase().trim()
    const label = raw ? String(raw).replace(/_/g, ' ') : '—'

    if (v === 'PRESENTE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
          <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} className="text-emerald-600 shrink-0" />
          {label}
        </span>
      )
    }
    if (v === 'EM_FALTA') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <CancelOutlinedIcon sx={{ fontSize: 14 }} className="text-red-600 shrink-0" />
          {label}
        </span>
      )
    }
    if (v === 'AGUARDANDO_JANELA') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-hapvida-blue whitespace-nowrap">
          <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} className="text-hapvida-blue shrink-0" />
          {label}
        </span>
      )
    }
    return <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{label}</span>
  }

  if (col.field === 'tipoLogin') {
    const label = formatTipoLoginText(raw)
    if (label === '-') return <span className="text-slate-400 text-xs">—</span>
    const toneClass =
      raw === 'LOGIN_ATRASADO'
        ? 'text-red-700 font-semibold'
        : raw === 'LOGIN_ADIANTADO'
          ? 'text-hapvida-blue font-semibold'
          : 'text-emerald-700 font-semibold'
    return <span className={`text-xs whitespace-nowrap ${toneClass}`}>{label}</span>
  }

  if (col.field === 'entradaReal') {
    const time = formatTime(raw)
    if (time === '-') return <span className="text-slate-400 text-xs">—</span>
    const toneClass =
      row.tipoLogin === 'LOGIN_ATRASADO'
        ? 'text-red-700 font-bold'
        : row.tipoLogin === 'LOGIN_ADIANTADO'
          ? 'text-hapvida-blue font-semibold'
          : 'text-slate-900 font-semibold'
    return <span className={`font-mono tabular-nums text-xs ${toneClass}`}>{time}</span>
  }

  if (col.field === 'pausa_atual') {
    if (!raw) {
      if (row.status === 'PRESENTE') {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
            Em atendimento
          </span>
        )
      }
      return <span className="text-slate-400 text-xs">—</span>
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 whitespace-nowrap">
        <PauseCircleOutlineIcon sx={{ fontSize: 14 }} className="text-amber-600 shrink-0" />
        {raw}
      </span>
    )
  }

  if (col.field === 'pausas_resumo') {
    return (
      <span className={`${UI_CLASSES.monoTabular} text-slate-600 whitespace-nowrap`}>
        {raw ?? '—'}
      </span>
    )
  }

  return raw ?? ''
}
