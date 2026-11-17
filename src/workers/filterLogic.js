function parseArray(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.map((s) => String(s).toUpperCase().trim())
  return String(val)
    .split(',')
    .map((s) => String(s).toUpperCase().trim())
}

function normalizedDistinct(values) {
  const vals = values
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => v && v !== '-')
  return [...new Set(vals)].sort()
}

function normalizeSegmento(value) {
  return /^off[ -]?line$/i.test(String(value || '').trim()) ? 'SAC - N2' : value
}

function getFilteredData(rawData, filters, excludeKeys = null) {
  let fdf = rawData || []
  const excluded = new Set(
    excludeKeys == null ? [] : Array.isArray(excludeKeys) ? excludeKeys : [excludeKeys]
  )

  const managers = excluded.has('managers') ? [] : parseArray(filters.managers)
  const gestao = excluded.has('gestao') ? [] : parseArray(filters.gestao)
  const segmento = excluded.has('segmento') ? [] : parseArray(filters.segmento)
  const status = excluded.has('status') ? [] : parseArray(filters.status)
  const coordenadores_op = excluded.has('coordenadores_op') ? [] : parseArray(filters.coordenadores_op)
  const coordenadores_atend = excluded.has('coordenadores_atend')
    ? []
    : parseArray(filters.coordenadores_atend)
  const supervisores = excluded.has('supervisores') ? [] : parseArray(filters.supervisores)
  const operadores = excluded.has('operadores') ? [] : parseArray(filters.operadores)
  const horas = excluded.has('horas') ? [] : parseArray(filters.horas)

  if (managers.length > 0) {
    fdf = fdf.filter(
      (d) => d.nome_gerente && managers.includes(d.nome_gerente.toUpperCase().trim())
    )
  }
  if (gestao.length > 0) {
    fdf = fdf.filter((d) => d.gestao && gestao.includes(d.gestao.toUpperCase().trim()))
  }
  if (segmento.length > 0) {
    fdf = fdf.filter((d) => d.segmento && segmento.includes(String(normalizeSegmento(d.segmento)).toUpperCase().trim()))
  }
  if (coordenadores_op.length > 0) {
    fdf = fdf.filter((d) => {
      const cop = (
        d.nome_coordenador_op_filtro ||
        d.nome_coordenador_op ||
        d.nome_coordenador ||
        ''
      )
        .toUpperCase()
        .trim()
      return coordenadores_op.includes(cop)
    })
  }
  if (coordenadores_atend.length > 0) {
    fdf = fdf.filter(
      (d) =>
        d.nome_coordenador_atend &&
        coordenadores_atend.includes(d.nome_coordenador_atend.toUpperCase().trim())
    )
  }
  if (supervisores.length > 0) {
    fdf = fdf.filter(
      (d) => d.nome_supervisor && supervisores.includes(d.nome_supervisor.toUpperCase().trim())
    )
  }
  if (operadores.length > 0) {
    fdf = fdf.filter(
      (d) => d.nome_operador && operadores.includes(d.nome_operador.toUpperCase().trim())
    )
  }
  if (status.length > 0) {
    fdf = fdf.filter((d) => {
      const s = (d.status || '').toUpperCase().trim()
      const sl = (d.status_legivel || '').toUpperCase().trim()
      return status.includes(s) || status.includes(sl)
    })
  }
  if (horas.length > 0) {
    fdf = fdf.filter((d) => {
      const h = d.hora_entrada ? d.hora_entrada.slice(0, 5) : ''
      return horas.includes(h.trim())
    })
  }

  return fdf
}

/** Monta todas as listas de opções do card de filtros em um único job. */
export function buildFilterLists(rawData, filters = {}) {
  const data = rawData || []
  const f = filters || {}

  const rowsManagers = getFilteredData(data, f, 'managers')
  const rowsGestao = getFilteredData(data, f, 'gestao')
  const rowsSegmento = getFilteredData(data, f, 'segmento')
  const rowsCoord = getFilteredData(data, f, ['coordenadores_op', 'coordenadores_atend'])
  const rowsSupervisor = getFilteredData(data, f, 'supervisores')
  const rowsStatus = getFilteredData(data, f, 'status')
  const rowsOperador = getFilteredData(data, f, 'operadores')
  const rowsHoras = getFilteredData(data, f, 'horas')

  const statusSet = new Set()
  rowsStatus.forEach((d) => {
    if (d.status) statusSet.add(d.status.toUpperCase())
    if (d.status_legivel) statusSet.add(d.status_legivel.toUpperCase())
  })

  return {
    managers: normalizedDistinct(rowsManagers.map((d) => d.nome_gerente)),
    gestao: normalizedDistinct(rowsGestao.map((d) => d.gestao)),
    segmento: normalizedDistinct(rowsSegmento.map((d) => normalizeSegmento(d.segmento))),
    coordenadores_op: normalizedDistinct(
      rowsCoord.map(
        (d) => d.nome_coordenador_op_filtro || d.nome_coordenador_op || d.nome_coordenador
      )
    ),
    coordenadores_atend: normalizedDistinct(rowsCoord.map((d) => d.nome_coordenador_atend)),
    supervisores: normalizedDistinct(rowsSupervisor.map((d) => d.nome_supervisor)),
    status: [...statusSet].sort(),
    operadores: normalizedDistinct(rowsOperador.map((d) => d.nome_operador)),
    horas: normalizedDistinct(
      rowsHoras.map((d) => (d.hora_entrada ? d.hora_entrada.slice(0, 5) : null)).filter(Boolean)
    )
  }
}

export const EMPTY_FILTER_LISTS = {
  managers: [],
  gestao: [],
  segmento: [],
  coordenadores_op: [],
  coordenadores_atend: [],
  supervisores: [],
  status: [],
  operadores: [],
  horas: []
}
