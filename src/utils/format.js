import { COLORS, UI_CLASSES } from '../theme'

export function normalizeAbsValue(val) {
  if (val === null || val === undefined || val === '') return null
  const parsed = Number(val)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatMilhar(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return v ?? '0'
  return parseInt(v, 10).toLocaleString('pt-BR')
}

export function formatAbsPercent(val) {
  const absValue = normalizeAbsValue(val)
  return absValue === null ? '-' : `${absValue.toFixed(1)}%`
}

export function formatAbsPercentComma(val) {
  const absValue = normalizeAbsValue(val)
  return absValue === null ? '-' : `${absValue.toFixed(1).replace('.', ',')}%`
}

export function formatSituacaoPercent(val) {
  if (val === null || val === undefined || val === '') return '-'
  const parsed = Number(val)
  if (!Number.isFinite(parsed)) return '-'
  return `${parsed.toFixed(1)}%`
}

export function getAbsBadgeClass(val) {
  const absValue = normalizeAbsValue(val)
  if (absValue === null) return ''
  const variant = absValue <= 5
    ? UI_CLASSES.badgeVariants.success
    : absValue <= 8
      ? UI_CLASSES.badgeVariants.warning
      : UI_CLASSES.badgeVariants.danger
  return `${UI_CLASSES.badgeBase} ${UI_CLASSES.badgeSizes.small} ${variant}`
}

export function getStatusBadgeClass(val) {
  const v = String(val || '').toUpperCase().trim()
  const variant = v === 'PRESENTE'
    ? UI_CLASSES.badgeVariants.success
    : v === 'EM_FALTA'
      ? UI_CLASSES.badgeVariants.danger
      : v === 'AGUARDANDO_JANELA'
        ? UI_CLASSES.badgeVariants.info
        : `${UI_CLASSES.badgeVariants.neutral} font-medium`
  return `${UI_CLASSES.badgeBase} ${UI_CLASSES.badgeSizes.small} ${variant}`
}

export function getTipoLoginBadgeClass(val) {
  if (val === 'LOGIN_ATRASADO') {
    return `${UI_CLASSES.badgeBase} ${UI_CLASSES.badgeSizes.small} ${UI_CLASSES.badgeVariants.danger}`
  }
  if (val === 'LOGIN_ADIANTADO') {
    return `${UI_CLASSES.badgeBase} ${UI_CLASSES.badgeSizes.small} ${UI_CLASSES.badgeVariants.info}`
  }
  if (val === 'ADERENTE') {
    return `${UI_CLASSES.badgeBase} ${UI_CLASSES.badgeSizes.small} ${UI_CLASSES.badgeVariants.success}`
  }
  return ''
}

export function formatTipoLoginText(val) {
  if (val === 'LOGIN_ATRASADO') return 'LOGIN ATRASADO'
  if (val === 'LOGIN_ADIANTADO') return 'LOGIN ADIANTADO'
  if (val === 'ADERENTE') return 'ADERENTE'
  return '-'
}

export function formatTime(isoStr) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export const OPERADOR_COLUMNS = [
  { field: 'matricula', label: 'Matrícula', mono: true },
  { field: 'nome_operador', label: 'Operador', noWrap: true },
  { field: 'nome_supervisor', label: 'Supervisor', noWrap: true },
  { field: 'nome_coordenador_atend', label: 'Coord. Atendimento', noWrap: true },
  { field: 'nome_coordenador_op', label: 'Coord. Operação', noWrap: true },
  { field: 'nome_gerente', label: 'Gerente', noWrap: true },
  { field: 'gestao', label: 'Gestão' },
  { field: 'segmento', label: 'Segmento', noWrap: true },
  { field: 'hora_entrada', label: 'Horário', align: 'center', mono: true },
  { field: 'entradaReal', label: 'Entrada Real', align: 'center', mono: true },
  { field: 'tipoLogin', label: 'Tipo Login', align: 'center' },
  { field: 'hora_limite', label: 'Limite', align: 'center', mono: true },
  { field: 'status', label: 'Status', align: 'center' },
  { field: 'pausa_atual', label: 'Pausa Atual', align: 'center' },
  { field: 'pausas_resumo', label: 'Grade de Pausas', mono: true, noWrap: true }
]

export const SITUACAO_COLUMNS = [
  { field: 'Situação', label: 'Situação' },
  { field: 'Qtd', label: 'Qtd' },
  { field: 'Pct', label: '%' }
]

export const PRIMARY = COLORS.brand.navy

export function formatPct(v) {
  return `${Number(v || 0).toFixed(1)}%`
}

export function formatDateBr(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

export function freqChipColor(freq, absenteismo) {
  const f = String(freq || '').toUpperCase()
  if (f.includes('FALTA')) return 'error'
  if (f.includes('ATESTADO')) return 'warning'
  if (absenteismo) return 'warning'
  if (f.includes('PRESENTE')) return 'success'
  return 'default'
}

export function formatDt(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR')
}

export function formatDuration(ms) {
  if (ms == null) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

export function adminStatusColor(status) {
  if (status === 'success') return 'success'
  if (status === 'error') return 'error'
  if (status === 'running') return 'warning'
  return 'default'
}
