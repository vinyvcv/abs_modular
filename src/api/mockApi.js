// In-memory stub API for offline / standalone execution when backend services are not attached

const TODAY = new Date()
const pad2 = (n) => String(n).padStart(2, '0')
const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

const shiftDateKey = (days) => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

const TODAY_KEY = toDateKey(TODAY)

const SEGMENTS = [
  'SAC - N1',
  'SAC - N2',
  'AGENDAMENTO',
  'AUTORIZAÇÃO',
  'OUVIDORIA',
  'RETENÇÃO'
]

const SUPERVISORS = [
  { sup: 'ANA PAULA COSTA', coordOp: 'CARLOS EDUARDO', coordAt: 'FERNANDA LIMA', gerente: 'ROBERTO MENDES', gestao: 'PROPRIA' },
  { sup: 'BRUNO HENRIQUE', coordOp: 'CARLOS EDUARDO', coordAt: 'FERNANDA LIMA', gerente: 'ROBERTO MENDES', gestao: 'PROPRIA' },
  { sup: 'CAMILA FERREIRA', coordOp: 'MARIANA SOUZA', coordAt: 'RICARDO ALVES', gerente: 'ROBERTO MENDES', gestao: 'PROPRIA' },
  { sup: 'DIEGO SANTOS', coordOp: 'MARIANA SOUZA', coordAt: 'RICARDO ALVES', gerente: 'PATRICIA ROCHA', gestao: 'TERCEIRA' },
  { sup: 'EDUARDA OLIVEIRA', coordOp: 'LUCAS MARTINS', coordAt: 'JULIANA NUNES', gerente: 'PATRICIA ROCHA', gestao: 'TERCEIRA' },
  { sup: 'FELIPE RIBEIRO', coordOp: 'LUCAS MARTINS', coordAt: 'JULIANA NUNES', gerente: 'ROBERTO MENDES', gestao: 'PROPRIA' }
]

const FIRST_NAMES = [
  'Lucas', 'Mariana', 'Gabriel', 'Beatriz', 'Rafael', 'Larissa', 'Mateus', 'Amanda',
  'Felipe', 'Juliana', 'Bruno', 'Camila', 'Gustavo', 'Letícia', 'Thiago', 'Natália',
  'Rodrigo', 'Vanessa', 'Vinícius', 'Carolina', 'Leonardo', 'Isabela', 'Caio', 'Bianca'
]
const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida',
  'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha'
]

const HOURS = ['07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00']

function createSeededOperators(dateKey) {
  const seedOffset = dateKey.split('-').reduce((acc, part) => acc + Number(part), 0)
  const rows = []
  let idx = 0

  for (let i = 0; i < 96; i++) {
    const team = SUPERVISORS[(i + seedOffset) % SUPERVISORS.length]
    const segmento = SEGMENTS[(i * 3 + seedOffset) % SEGMENTS.length]
    const horaEntrada = HOURS[(i + seedOffset) % HOURS.length]
    const [hh, mm] = horaEntrada.split(':').map(Number)
    const horaLimite = `${pad2((hh + 6) % 24)}:${pad2(mm)}`

    const roll = (i * 17 + seedOffset * 7) % 100
    let status = 'PRESENTE'
    let statusLegivel = 'PRESENTE'
    let tipoLogin = 'ADERENTE'
    let entradaReal = null
    let pausaAtual = null

    if (roll < 72) {
      status = 'PRESENTE'
      statusLegivel = 'PRESENTE'
      const loginRoll = (i + seedOffset) % 10
      const deltaMin = loginRoll === 0 ? 12 : loginRoll === 1 ? -7 : (loginRoll % 4) - 1
      tipoLogin = deltaMin > 5 ? 'LOGIN_ATRASADO' : deltaMin < -5 ? 'LOGIN_ADIANTADO' : 'ADERENTE'
      const ent = new Date(`${dateKey}T${horaEntrada}:00`)
      ent.setMinutes(ent.getMinutes() + deltaMin)
      entradaReal = ent.toISOString()
      if ((i + seedOffset) % 7 === 0) pausaAtual = 'Descanso 10m'
      else if ((i + seedOffset) % 11 === 0) pausaAtual = 'Lanche 20m'
    } else if (roll < 82) {
      status = 'EM_FALTA'
      statusLegivel = 'FALTA'
      tipoLogin = null
    } else if (roll < 90) {
      status = 'AGUARDANDO_JANELA'
      statusLegivel = 'AGUARDANDO JANELA'
      tipoLogin = null
    } else if (roll < 95) {
      status = 'ATESTADO'
      statusLegivel = 'ATESTADO'
      tipoLogin = null
    } else {
      status = 'FOLGA'
      statusLegivel = 'FOLGA'
      tipoLogin = null
    }

    const firstName = FIRST_NAMES[(i + seedOffset) % FIRST_NAMES.length]
    const lastName = LAST_NAMES[(i * 3 + seedOffset) % LAST_NAMES.length]
    const mat = `MAT${String(10001 + idx).padStart(5, '0')}`
    idx++

    rows.push({
      matricula: mat,
      nome_operador: `${firstName} ${lastName}`.toUpperCase(),
      nome_supervisor: team.sup,
      nome_coordenador_atend: team.coordAt,
      nome_coordenador_op: team.coordOp,
      nome_coordenador_op_filtro: team.coordOp,
      nome_gerente: team.gerente,
      gestao: team.gestao,
      segmento,
      hora_entrada: horaEntrada,
      entradaReal,
      tipoLogin,
      hora_limite: horaLimite,
      status,
      status_legivel: statusLegivel,
      pausa_atual: pausaAtual,
      pausas_resumo: `${pad2((hh + 1) % 24)}:40 | ${pad2((hh + 3) % 24)}:10 | ${pad2((hh + 5) % 24)}:00`
    })
  }

  return rows
}

const rawCache = new Map()
function getRawForDate(dateKey) {
  const key = dateKey || TODAY_KEY
  if (!rawCache.has(key)) {
    rawCache.set(key, createSeededOperators(key))
  }
  return rawCache.get(key)
}

function parseListParam(val) {
  if (!val) return []
  return String(val).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
}

function applyQueryFilters(rows, params = {}) {
  let out = rows
  const managers = parseListParam(params.managers)
  const gestao = parseListParam(params.gestao)
  const segmento = parseListParam(params.segmento)
  const coordOp = parseListParam(params.coordenadores_op)
  const coordAt = parseListParam(params.coordenadores_atend)
  const supervisores = parseListParam(params.supervisores)
  const operadores = parseListParam(params.operadores)
  const status = parseListParam(params.status)
  const horas = parseListParam(params.horas)

  if (managers.length) out = out.filter((d) => managers.includes((d.nome_gerente || '').toUpperCase().trim()))
  if (gestao.length) out = out.filter((d) => gestao.includes((d.gestao || '').toUpperCase().trim()))
  if (segmento.length) out = out.filter((d) => segmento.includes((d.segmento || '').toUpperCase().trim()))
  if (coordOp.length) out = out.filter((d) => coordOp.includes((d.nome_coordenador_op || '').toUpperCase().trim()))
  if (coordAt.length) out = out.filter((d) => coordAt.includes((d.nome_coordenador_atend || '').toUpperCase().trim()))
  if (supervisores.length) out = out.filter((d) => supervisores.includes((d.nome_supervisor || '').toUpperCase().trim()))
  if (operadores.length) out = out.filter((d) => operadores.includes((d.nome_operador || '').toUpperCase().trim()))
  if (status.length) {
    out = out.filter((d) =>
      status.includes((d.status || '').toUpperCase().trim()) ||
      status.includes((d.status_legivel || '').toUpperCase().trim())
    )
  }
  if (horas.length) out = out.filter((d) => horas.includes((d.hora_entrada || '').slice(0, 5)))
  return out
}

function computeKpis(rows) {
  let presentes = 0
  let faltas = 0
  let previstos = 0

  for (const r of rows) {
    if (r.status === 'PRESENTE') presentes++
    else if (r.status === 'EM_FALTA' || r.status === 'ATESTADO') faltas++
    else if (r.status === 'AGUARDANDO_JANELA') previstos++
  }

  const escalados = presentes + faltas
  const abs_pct = escalados > 0 ? Number(((faltas / escalados) * 100).toFixed(2)) : 0
  return { presentes, previstos, faltas, escalados, abs_pct }
}

function computeSituacoes(rows) {
  const counts = new Map()
  for (const r of rows) {
    const label = r.status_legivel || r.status || 'OUTROS'
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  const total = rows.length || 1
  const list = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sit, qtd]) => ({
      Situação: sit,
      Qtd: qtd,
      Pct: Number(((qtd / total) * 100).toFixed(1))
    }))

  list.push({
    Situação: 'TOTAL',
    Qtd: rows.length,
    Pct: rows.length > 0 ? 100.0 : 0.0
  })
  return list
}

function groupResumo(rows, keySelector, includeTotal = true) {
  const groups = new Map()
  for (const r of rows) {
    const k = keySelector(r) || 'NÃO INFORMADO'
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(r)
  }

  const summary = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, items]) => {
      const k = computeKpis(items)
      return {
        Segmento: label,
        Total: items.length,
        Previstos: k.previstos,
        Escalados: k.escalados,
        Faltas: k.faltas,
        Presentes: k.presentes,
        ABS: k.abs_pct
      }
    })

  if (includeTotal && summary.length) {
    const k = computeKpis(rows)
    summary.push({
      Segmento: 'TOTAL GERAL',
      Total: rows.length,
      Previstos: k.previstos,
      Escalados: k.escalados,
      Faltas: k.faltas,
      Presentes: k.presentes,
      ABS: k.abs_pct
    })
  }
  return summary
}

function computeIntraHora(rows) {
  const byHour = new Map()
  for (const r of rows) {
    const h = (r.hora_entrada || '').slice(0, 5)
    if (!h) continue
    if (!byHour.has(h)) byHour.set(h, [])
    byHour.get(h).push(r)
  }
  return [...byHour.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hora, items]) => {
      const k = computeKpis(items)
      return {
        Hora: hora,
        Escalados: k.escalados,
        Faltas: k.faltas,
        ABS: k.abs_pct
      }
    })
}

// --- Frequência Histórica (Optimus) ---
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function buildFrequenciaAnual(year, month) {
  const y = Number(year) || TODAY.getFullYear()
  const maxMonth = y === TODAY.getFullYear() ? Math.max(TODAY.getMonth() + 1, 6) : 12
  const meses = []
  for (let m = 1; m <= maxMonth; m++) {
    const pessoas = 410 + ((y + m * 7) % 45)
    const absPct = Number((4.1 + ((y * 3 + m * 1.3) % 3.6)).toFixed(2))
    const pessoasAbsenteismo = Math.round((pessoas * absPct) / 100)
    meses.push({
      mes: `${y}-${pad2(m)}`,
      label: MESES_PT[m - 1],
      pessoas,
      pessoasAbsenteismo,
      abs_pct: absPct
    })
  }
  const filteredMeses = month ? meses.filter((x) => Number(x.mes.slice(5, 7)) === Number(month)) : meses
  const avgAbs = filteredMeses.length
    ? filteredMeses.reduce((a, b) => a + b.abs_pct, 0) / filteredMeses.length
    : 0
  const maxPessoas = filteredMeses.length ? Math.max(...filteredMeses.map((x) => x.pessoas)) : 0

  return {
    kpis: {
      registros: maxPessoas * 22,
      pessoas: maxPessoas,
      pessoasPresente: Math.round(maxPessoas * (1 - avgAbs / 100)),
      pessoasAbsenteismo: Math.round((maxPessoas * avgAbs) / 100),
      abs_pct: Number(avgAbs.toFixed(2))
    },
    meses
  }
}

function buildFrequenciaNomes(year, month) {
  const y = Number(year) || TODAY.getFullYear()
  const m = Number(month) || 1
  const baseRows = getRawForDate(TODAY_KEY)
  const freqTypes = [
    { label: 'FALTA INJUSTIFICADA', abs: true, sit: 'Falta' },
    { label: 'ATESTADO MÉDICO', abs: true, sit: 'Atestado' },
    { label: 'PRESENTE', abs: false, sit: 'Trabalhado' },
    { label: 'PRESENTE', abs: false, sit: 'Trabalhado' },
    { label: 'FALTA JUSTIFICADA', abs: true, sit: 'Falta' }
  ]

  return baseRows.slice(0, 60).map((r, i) => {
    const day = pad2(((i * 2) % 27) + 1)
    const mm = pad2(month ? m : ((i % 10) + 1))
    const f = freqTypes[i % freqTypes.length]
    return {
      data: `${y}-${mm}-${day}`,
      matricula: r.matricula,
      nome_operador: r.nome_operador,
      nome_supervisor: r.nome_supervisor,
      nome_coordenador: r.nome_coordenador_op,
      gestao: r.gestao,
      segmento: r.segmento,
      Frequencia: f.label,
      absenteismo: f.abs,
      horario: r.hora_entrada,
      situacao: f.sit
    }
  })
}

// --- Pausas NR-17 ---
const extraImportedPausas = new Map()

function buildPausasData(dataRef) {
  const raw = getRawForDate(dataRef || TODAY_KEY)
  const tipos = [
    { tipo: 'Descanso', duracao: '00:10:00', planMin: 10 },
    { tipo: 'Lanche', duracao: '00:20:00', planMin: 20 },
    { tipo: 'Almoço', duracao: '00:20:00', planMin: 20 }
  ]

  const rows = raw.slice(0, 75).map((op, i) => {
    const t = tipos[i % tipos.length]
    const ofensorInicio = i % 6 === 0
    const excedidoSeg = i % 5 === 0 ? 180 + (i % 4) * 60 : 0
    const desvioMin = ofensorInicio ? 12 + (i % 7) : i % 3 === 0 ? 4 : -1
    const desvioStr = desvioMin > 0 ? `+${desvioMin}m` : `${desvioMin}m`
    const isOfensor = ofensorInicio || excedidoSeg > 0
    const hBase = 9 + (i % 7)
    const mBase = (i * 15) % 60
    const plan = `${pad2(hBase)}:${pad2(mBase)}`
    const realDate = new Date(`2026-01-01T${plan}:00`)
    realDate.setMinutes(realDate.getMinutes() + desvioMin)
    const real = `${pad2(realDate.getHours())}:${pad2(realDate.getMinutes())}`

    return {
      id: `${dataRef}-${i}`,
      data: dataRef || TODAY_KEY,
      login_genesys: op.matricula.toLowerCase(),
      nome_operador: op.nome_operador,
      supervisor: op.nome_supervisor,
      coordenador: op.nome_coordenador_op,
      tipo_pausa: t.tipo,
      tempo_status: excedidoSeg > 0 ? `00:${pad2(t.planMin + Math.floor(excedidoSeg / 60))}:15` : t.duracao,
      horario_planejado: plan,
      horario_realizado: real,
      desvio_inicio: desvioStr,
      tempo_excedido_seg: excedidoSeg,
      is_ofensor: isOfensor,
      is_ofensor_inicio: ofensorInicio
    }
  })

  const extra = extraImportedPausas.get(dataRef || TODAY_KEY) || 0
  return { rows, extra }
}

function formatSeconds(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

// --- Admin D0 state ---
let adminRuns = [
  {
    id: 'run-20261117-0830',
    type: 'full',
    trigger: 'cron',
    status: 'success',
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    durationMs: 58200,
    error: null,
    details: {
      loginLogout: { recordsProcessed: 1842 },
      d0: { loadId: 4092 }
    }
  },
  {
    id: 'run-20261117-0800',
    type: 'd0',
    trigger: 'manual',
    status: 'success',
    startedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
    durationMs: 21400,
    error: null,
    details: { loadId: 4091 }
  }
]

const adminLogs = {
  'sync-d0-latest.log': `[INFO] Iniciando sincronização D0 Genesys...\n[INFO] Conectado ao pool de leitura\n[INFO] 1842 eventos processados\n[INFO] Carga D0 finalizada com sucesso (loadId=4092)`,
  'login-logout.log': `[INFO] MSTR -> OneDrive -> HIST sync iniciado\n[INFO] 1842 registros de login/logout validados\n[INFO] Concluído em 36.8s`
}

export async function handleMockRequest(config) {
  const baseURL = config.baseURL || ''
  const rawUrl = config.url || ''
  const [pathOnly, qs] = rawUrl.split('?')
  const urlPath = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
  const method = (config.method || 'get').toLowerCase()
  const params = { ...(config.params || {}) }
  if (qs) {
    for (const [k, v] of new URLSearchParams(qs).entries()) {
      params[k] = v
    }
  }

  let bodyData = config.data
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData) } catch { /* ignore */ }
  }

  // Simulate minimal realistic async latency
  await new Promise((r) => setTimeout(r, 40))

  // --- /api-d0 (Admin) ---
  if (baseURL.includes('/api-d0') || urlPath.startsWith('/api/admin')) {
    if (urlPath === '/api/admin/login' && method === 'post') {
      const user = (bodyData?.user || '').trim() || 'admin'
      return { token: 'demo-admin-token', user }
    }
    if (urlPath === '/api/admin/logout' && method === 'post') {
      return { ok: true }
    }
    if (urlPath === '/api/admin/me') {
      return { user: localStorage.getItem('abs_d0_admin_user') || 'admin', onedrivePath: '/OneDrive/Hapvida/D0' }
    }
    if (urlPath === '/api/admin/runs') {
      return { activeRunId: null, latest: adminRuns[0] || null, runs: adminRuns }
    }
    if (urlPath === '/api/admin/run' && method === 'post') {
      const type = bodyData?.type || 'full'
      const now = new Date()
      const newRun = {
        id: `run-${Date.now()}`,
        type,
        trigger: 'manual',
        status: 'success',
        startedAt: now.toISOString(),
        finishedAt: new Date(now.getTime() + 12000).toISOString(),
        durationMs: 12000,
        error: null,
        details: { recordsProcessed: 1842, loadId: 4093 }
      }
      adminRuns = [newRun, ...adminRuns]
      return { run: newRun }
    }
    if (urlPath === '/api/admin/logs') {
      return { files: Object.keys(adminLogs).map((name) => ({ name })) }
    }
    if (urlPath.startsWith('/api/admin/logs/')) {
      const file = decodeURIComponent(urlPath.replace('/api/admin/logs/', ''))
      return { content: adminLogs[file] || 'Log vazio.' }
    }
  }

  // --- /api-abs ---
  if (urlPath === '/api/dates') {
    const dates = [0, -1, -2, -3, -4].map((offset) => {
      const date = shiftDateKey(offset)
      return {
        date,
        live: offset === 0,
        capturedAt: new Date(TODAY.getTime() + offset * 86400000).toISOString(),
        captures: offset === 0 ? 14 : 24,
        source: offset === 0 ? 'live' : 'backup'
      }
    })
    return { today: TODAY_KEY, directory: 'demo-in-memory', dates }
  }

  if (urlPath === '/api/status') {
    const isHist = Boolean(params.date && params.date !== TODAY_KEY)
    const nextSlot = new Date(Date.now() + 15 * 60 * 1000)
    return {
      historical: isHist,
      lastTs: new Date().toISOString(),
      nextSlot: nextSlot.toISOString()
    }
  }

  if (urlPath === '/api/raw') {
    return getRawForDate(params.date || TODAY_KEY)
  }

  if (urlPath === '/api/geral') {
    const filtered = applyQueryFilters(getRawForDate(params.date), params)
    return {
      kpis: computeKpis(filtered),
      resumoSegmento: groupResumo(filtered, (r) => r.segmento, true),
      situacoes: computeSituacoes(filtered),
      intraHora: computeIntraHora(filtered),
      operadores: filtered
    }
  }

  if (urlPath === '/api/coordenador') {
    const filtered = applyQueryFilters(getRawForDate(params.date), params)
    return {
      kpis: computeKpis(filtered),
      resumoSegmento: groupResumo(filtered, (r) => r.nome_coordenador_op, true),
      situacoes: computeSituacoes(filtered),
      operadores: filtered
    }
  }

  if (urlPath === '/api/coordenador-at') {
    const filtered = applyQueryFilters(getRawForDate(params.date), params)
    return {
      kpis: computeKpis(filtered),
      resumoSegmento: groupResumo(filtered, (r) => r.nome_coordenador_atend, true),
      situacoes: computeSituacoes(filtered),
      operadores: filtered
    }
  }

  if (urlPath === '/api/supervisor') {
    const filtered = applyQueryFilters(getRawForDate(params.date), params)
    const groups = new Map()
    for (const r of filtered) {
      const sup = r.nome_supervisor || 'NÃO INFORMADO'
      if (!groups.has(sup)) groups.set(sup, [])
      groups.get(sup).push(r)
    }
    const resumoSupervisor = [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sup, items]) => {
        const k = computeKpis(items)
        return {
          Supervisor: sup,
          Previstos: k.previstos,
          Escalados: k.escalados,
          Faltas: k.faltas,
          Presentes: k.presentes,
          ABS: k.abs_pct
        }
      })

    return {
      kpis: computeKpis(filtered),
      resumoSupervisor,
      operadores: filtered
    }
  }

  // --- Frequência ---
  if (urlPath === '/api/frequencia/years') {
    const y = TODAY.getFullYear()
    return { years: [{ year: y }, { year: y - 1 }, { year: y - 2 }] }
  }

  if (urlPath === '/api/frequencia/historico') {
    const y = TODAY.getFullYear()
    const anos = [y - 2, y - 1, y]
    const series = []
    for (const yr of anos) {
      const maxM = yr === y ? Math.max(TODAY.getMonth() + 1, 6) : 12
      for (let m = 1; m <= maxM; m++) {
        series.push({
          year: yr,
          month: m,
          abs_pct: Number((4.0 + ((yr * 5 + m * 1.4) % 3.8)).toFixed(2))
        })
      }
    }
    return { anos, series }
  }

  if (urlPath === '/api/frequencia') {
    return buildFrequenciaAnual(params.year, params.month)
  }

  if (urlPath === '/api/frequencia/nomes/filtros') {
    const list = buildFrequenciaNomes(params.year, params.month)
    return {
      segmentos: [...new Set(list.map((r) => r.segmento))].sort(),
      gestoes: [...new Set(list.map((r) => r.gestao))].sort(),
      supervisores: [...new Set(list.map((r) => r.nome_supervisor))].sort(),
      coordenadores: [...new Set(list.map((r) => r.nome_coordenador))].sort()
    }
  }

  if (urlPath === '/api/frequencia/nomes') {
    let list = buildFrequenciaNomes(params.year, params.month)
    const tipo = params.tipo || 'todos'
    if (tipo === 'ausencia') list = list.filter((r) => r.absenteismo)
    else if (tipo === 'falta') list = list.filter((r) => r.Frequencia.includes('FALTA'))
    else if (tipo === 'atestado') list = list.filter((r) => r.Frequencia.includes('ATESTADO'))
    else if (tipo === 'presente') list = list.filter((r) => r.Frequencia === 'PRESENTE')

    if (params.q) {
      const q = String(params.q).toLowerCase()
      list = list.filter((r) =>
        r.nome_operador.toLowerCase().includes(q) ||
        r.segmento.toLowerCase().includes(q) ||
        r.Frequencia.toLowerCase().includes(q)
      )
    }
    if (params.segmento) list = list.filter((r) => r.segmento === params.segmento)
    if (params.gestao) list = list.filter((r) => r.gestao === params.gestao)
    if (params.supervisor) list = list.filter((r) => r.nome_supervisor === params.supervisor)
    if (params.coordenador) list = list.filter((r) => r.nome_coordenador === params.coordenador)

    const page = Math.max(Number(params.page) || 1, 1)
    const pageSize = Math.max(Number(params.pageSize) || 20, 1)
    const start = (page - 1) * pageSize
    return {
      registros: list.slice(start, start + pageSize),
      total: list.length,
      page,
      pageSize
    }
  }

  // --- Pausas ---
  if (urlPath === '/api/pausas/consolidado') {
    const { rows } = buildPausasData(params.data)
    const total = rows.length
    const comDesvio = rows.filter((r) => r.is_ofensor_inicio).length
    const dentro = total - comDesvio
    const excedidoTotal = rows.reduce((a, r) => a + r.tempo_excedido_seg, 0)
    const ofensores = rows.filter((r) => r.is_ofensor).length

    const aggBy = (keyFn, extraFn = () => ({})) => {
      const map = new Map()
      for (const r of rows) {
        const k = keyFn(r)
        if (!map.has(k)) map.set(k, [])
        map.get(k).push(r)
      }
      return [...map.entries()].map(([k, items]) => {
        const tot = items.length
        const desv = items.filter((x) => x.is_ofensor_inicio).length
        const ader = tot - desv
        const exc = items.reduce((a, x) => a + x.tempo_excedido_seg, 0)
        const ofen = items.filter((x) => x.is_ofensor).length
        return {
          ...extraFn(k, items),
          total_pausas: tot,
          pct_dentro_planejado: tot ? (ader / tot) * 100 : 0,
          pct_com_desvio: tot ? (desv / tot) * 100 : 0,
          tempo_excedido_formatado: formatSeconds(exc),
          total_ofensores: ofen
        }
      })
    }

    return {
      kpis: {
        total_pausas: total,
        dentro_planejado: dentro,
        pct_dentro_planejado: total ? (dentro / total) * 100 : 0,
        com_desvio: comDesvio,
        pct_com_desvio: total ? (comDesvio / total) * 100 : 0,
        tempo_excedido_formatado: formatSeconds(excedidoTotal),
        total_ofensores: ofensores
      },
      porSupervisor: aggBy((r) => r.supervisor, (sup, items) => ({
        supervisor: sup,
        coordenador: items[0]?.coordenador || ''
      })),
      porTipoPausa: aggBy((r) => r.tipo_pausa, (tipo) => ({ tipo_pausa: tipo })),
      porCoordenador: aggBy((r) => r.coordenador, (coord) => ({ coordenador: coord }))
    }
  }

  if (urlPath === '/api/pausas/reincidencia') {
    const { rows } = buildPausasData(params.dataFim)
    const ofensores = rows.filter((r) => r.is_ofensor)
    const ranking = ofensores.slice(0, 20).map((r, i) => {
      const totalOcc = i < 6 ? 3 + (i % 4) : 1 + (i % 2)
      return {
        login_genesys: r.login_genesys,
        nome_operador: r.nome_operador,
        supervisor: r.supervisor,
        coordenador: r.coordenador,
        dias_com_ocorrencia: Math.min(totalOcc, 5),
        total_ocorrencias: totalOcc,
        qtd_descanso: Math.ceil(totalOcc / 2),
        qtd_lanche: Math.floor(totalOcc / 2),
        qtd_almoco: totalOcc >= 4 ? 1 : 0,
        tempo_total_excedido_formatado: formatSeconds(totalOcc * 240),
        is_reincidente: totalOcc >= 3
      }
    })

    const supMap = new Map()
    for (const r of ranking) {
      if (!supMap.has(r.supervisor)) {
        supMap.set(r.supervisor, {
          supervisor: r.supervisor,
          coordenador: r.coordenador,
          total_ofensores: 0,
          reincidentes: 0,
          total_ocorrencias: 0
        })
      }
      const entry = supMap.get(r.supervisor)
      entry.total_ofensores++
      if (r.is_reincidente) entry.reincidentes++
      entry.total_ocorrencias += r.total_ocorrencias
    }

    return {
      totalOfensores: ranking.length,
      totalReincidentes: ranking.filter((r) => r.is_reincidente).length,
      ranking,
      porSupervisor: [...supMap.values()]
    }
  }

  if (urlPath === '/api/pausas/detalhado') {
    let { rows } = buildPausasData(params.data)
    if (params.coordenador && params.coordenador !== 'TODOS') {
      rows = rows.filter((r) => r.coordenador === params.coordenador)
    }
    if (params.supervisor && params.supervisor !== 'TODOS') {
      rows = rows.filter((r) => r.supervisor === params.supervisor)
    }
    if (params.tipoPausa && params.tipoPausa !== 'TODOS') {
      rows = rows.filter((r) => r.tipo_pausa === params.tipoPausa)
    }
    if (String(params.apenasOfensores) === 'true') {
      rows = rows.filter((r) => r.is_ofensor)
    }
    if (params.busca) {
      const q = String(params.busca).toLowerCase()
      rows = rows.filter((r) =>
        r.nome_operador.toLowerCase().includes(q) ||
        r.login_genesys.toLowerCase().includes(q)
      )
    }
    const page = Math.max(Number(params.page) || 1, 1)
    const pageSize = Math.max(Number(params.pageSize) || 50, 1)
    const start = (page - 1) * pageSize
    return {
      rows: rows.slice(start, start + pageSize),
      total: rows.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize))
    }
  }

  if (urlPath === '/api/pausas/importar' && method === 'post') {
    const key = TODAY_KEY
    extraImportedPausas.set(key, (extraImportedPausas.get(key) || 0) + 12)
    return { totalInseridos: 12 }
  }

  return {}
}
