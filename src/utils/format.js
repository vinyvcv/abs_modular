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

export function getAbsColorStyle(val) {
  const absValue = normalizeAbsValue(val)
  if (absValue === null) return {}
  const base = {
    borderRadius: '9999px',
    px: 1.25,
    py: 0.35,
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.2
  }
  if (absValue <= 5) {
    return { ...base, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
  }
  if (absValue <= 8) {
    return { ...base, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
  }
  return { ...base, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
}

export function getStatusStyle(val) {
  const v = String(val || '').toUpperCase().trim()
  const base = {
    borderRadius: '9999px',
    px: 1.25,
    py: 0.35,
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.2
  }
  if (v === 'PRESENTE') {
    return { ...base, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
  }
  if (v === 'EM_FALTA') {
    return { ...base, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
  }
  if (v === 'AGUARDANDO_JANELA') {
    return { ...base, backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }
  }
  return { ...base, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 500 }
}

export function getTipoLoginStyle(val) {
  const base = {
    borderRadius: '9999px',
    px: 1.25,
    py: 0.35,
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.2
  }
  if (val === 'LOGIN_ATRASADO') {
    return { ...base, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
  }
  if (val === 'LOGIN_ADIANTADO') {
    return { ...base, backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }
  }
  if (val === 'ADERENTE') {
    return { ...base, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
  }
  return {}
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
  { field: 'matricula', label: 'Matrícula' },
  { field: 'nome_operador', label: 'Operador' },
  { field: 'nome_supervisor', label: 'Supervisor' },
  { field: 'nome_coordenador_atend', label: 'Coord. Atendimento' },
  { field: 'nome_coordenador_op', label: 'Coord. Operação' },
  { field: 'nome_gerente', label: 'Gerente' },
  { field: 'gestao', label: 'Gestão' },
  { field: 'segmento', label: 'Segmento' },
  { field: 'hora_entrada', label: 'Horário' },
  { field: 'entradaReal', label: 'Entrada Real' },
  { field: 'tipoLogin', label: 'Tipo Login' },
  { field: 'hora_limite', label: 'Limite' },
  { field: 'status', label: 'Status' },
  { field: 'pausa_atual', label: 'Pausa Atual' },
  { field: 'pausas_resumo', label: 'Grade de Pausas' }
]

export const SITUACAO_COLUMNS = [
  { field: 'Situação', label: 'Situação' },
  { field: 'Qtd', label: 'Qtd' },
  { field: 'Pct', label: '%' }
]

export const PRIMARY = '#093b8f'

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
