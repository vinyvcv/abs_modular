import { create } from 'zustand'
import { api } from '../api/client'

export const DISPLAY_TIMEZONE = 'America/Sao_Paulo'

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateLabel(dateKey) {
  if (!dateKey) return '—'
  const [y, m, d] = dateKey.split('-')
  return `${d}/${m}/${y}`
}

function weekdayLabel(dateKey) {
  if (!dateKey) return ''
  const [y, m, d] = dateKey.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(new Date(y, m - 1, d))
    .replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatTimeLabel(value) {
  const date = toDate(value)
  if (!date) return '--:--'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: DISPLAY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function captureCaption(info) {
  if (!info) return '—'
  if (info.live) return 'Ao vivo'

  const time = formatTimeLabel(info.capturedAt)
  const suffix = info.captures > 1 ? ` · ${info.captures} capturas` : ''
  return info.source === 'backup'
    ? `Backup das ${time}${suffix}`
    : `Última captura ${time}${suffix}`
}

function normalizeNextSlot(nextSlot, reference = new Date()) {
  const slot = toDate(nextSlot)
  if (!slot) return null

  while (slot.getTime() <= reference.getTime()) {
    slot.setMinutes(slot.getMinutes() + 30)
  }

  return slot
}

const emptyFilters = () => ({
  managers: [],
  gestao: [],
  segmento: [],
  status: [],
  coordenadores_op: [],
  coordenadores_atend: [],
  supervisores: [],
  operadores: [],
  horas: []
})

const normalizeSegmento = (value) => /^off[ -]?line$/i.test(String(value || '').trim()) ? 'SAC - N2' : value

export const useDashboardStore = create((set, get) => ({
  rawData: [],
  loading: false,
  geralData: {
    kpis: { presentes: 0, previstos: 0, faltas: 0, escalados: 0, abs_pct: 0 },
    resumoSegmento: [],
    situacoes: [],
    intraHora: [],
    operadores: []
  },
  coordenadorData: {
    kpis: { presentes: 0, previstos: 0, faltas: 0, escalados: 0, abs_pct: 0 },
    resumoSegmento: [],
    situacoes: [],
    operadores: []
  },
  coordenadorAtendData: {
    kpis: { presentes: 0, previstos: 0, faltas: 0, escalados: 0, abs_pct: 0 },
    resumoSegmento: [],
    situacoes: [],
    operadores: []
  },
  supervisorData: {
    kpis: { presentes: 0, previstos: 0, faltas: 0, escalados: 0, abs_pct: 0 },
    resumoSupervisor: [],
    operadores: []
  },
  frequenciaYears: [],
  frequenciaYear: null,
  frequenciaMonth: null,
  frequenciaHistorico: {
    series: [],
    anos: []
  },
  frequenciaNomes: [],
  frequenciaNomesTotal: 0,
  frequenciaNomesPage: 1,
  frequenciaNomesPageSize: 20,
  frequenciaNomesTipo: 'todos',
  frequenciaNomesQ: '',
  frequenciaNomesSegmento: null,
  frequenciaNomesGestao: null,
  frequenciaNomesSupervisor: null,
  frequenciaNomesCoordenador: null,
  frequenciaNomesFiltros: {
    segmentos: [],
    gestoes: [],
    supervisores: [],
    coordenadores: []
  },
  frequenciaNomesLoading: false,
  frequenciaData: {
    kpis: {
      registros: 0,
      pessoas: 0,
      pessoasPresente: 0,
      pessoasAbsenteismo: 0,
      pessoasFalta: 0,
      pessoasAtestado: 0,
      pctPessoasAbsenteismo: 0,
      mediaDiasAbsenteismo: 0,
      presentes: 0,
      absenteismos: 0,
      faltas: 0,
      atestados: 0,
      folgas: 0,
      escalados: 0,
      abs_pct: 0
    },
    meses: [],
    frequencias: [],
    segmentos: []
  },
  lastTs: null,
  nextSlot: null,
  countdownText: '--:--',
  timerId: null,
  availableDates: [],
  selectedDate: null,
  isHistorical: false,
  backupDirectory: '',
  filters: emptyFilters(),

  normalizedDistinct(values) {
    const vals = values
      .map(v => (typeof v === 'string' ? v.trim() : v))
      .filter(v => v && v !== '-')

    return [...new Set(vals)].sort()
  },

  getFilteredData(excludeKeys = null) {
    let fdf = get().rawData || []
    const filters = get().filters || {}
    const excluded = new Set(
      excludeKeys == null
        ? []
        : Array.isArray(excludeKeys)
          ? excludeKeys
          : [excludeKeys]
    )

    const parseArray = (val) => {
      if (!val) return []
      if (Array.isArray(val)) return val.map(s => String(s).toUpperCase().trim())
      return String(val).split(',').map(s => String(s).toUpperCase().trim())
    }

    const managers = excluded.has('managers') ? [] : parseArray(filters.managers)
    const gestao = excluded.has('gestao') ? [] : parseArray(filters.gestao)
    const segmento = excluded.has('segmento') ? [] : parseArray(filters.segmento)
    const status = excluded.has('status') ? [] : parseArray(filters.status)
    const coordenadores_op = excluded.has('coordenadores_op') ? [] : parseArray(filters.coordenadores_op)
    const coordenadores_atend = excluded.has('coordenadores_atend') ? [] : parseArray(filters.coordenadores_atend)
    const supervisores = excluded.has('supervisores') ? [] : parseArray(filters.supervisores)
    const operadores = excluded.has('operadores') ? [] : parseArray(filters.operadores)
    const horas = excluded.has('horas') ? [] : parseArray(filters.horas)

    if (managers.length > 0) {
      fdf = fdf.filter(d => d.nome_gerente && managers.includes(d.nome_gerente.toUpperCase().trim()))
    }
    if (gestao.length > 0) {
      fdf = fdf.filter(d => d.gestao && gestao.includes(d.gestao.toUpperCase().trim()))
    }
    if (segmento.length > 0) {
      fdf = fdf.filter(d => d.segmento && segmento.includes(String(normalizeSegmento(d.segmento)).toUpperCase().trim()))
    }
    if (coordenadores_op.length > 0) {
      fdf = fdf.filter(d => {
        const cop = (d.nome_coordenador_op_filtro || d.nome_coordenador_op || d.nome_coordenador || '').toUpperCase().trim()
        return coordenadores_op.includes(cop)
      })
    }
    if (coordenadores_atend.length > 0) {
      fdf = fdf.filter(d => d.nome_coordenador_atend && coordenadores_atend.includes(d.nome_coordenador_atend.toUpperCase().trim()))
    }
    if (supervisores.length > 0) {
      fdf = fdf.filter(d => d.nome_supervisor && supervisores.includes(d.nome_supervisor.toUpperCase().trim()))
    }
    if (operadores.length > 0) {
      fdf = fdf.filter(d => d.nome_operador && operadores.includes(d.nome_operador.toUpperCase().trim()))
    }
    if (status.length > 0) {
      fdf = fdf.filter(d => {
        const s = (d.status || '').toUpperCase().trim()
        const sl = (d.status_legivel || '').toUpperCase().trim()
        return status.includes(s) || status.includes(sl)
      })
    }
    if (horas.length > 0) {
      fdf = fdf.filter(d => {
        const h = d.hora_entrada ? d.hora_entrada.slice(0, 5) : ''
        return horas.includes(h.trim())
      })
    }

    return fdf
  },

  managersList() {
    const rows = get().getFilteredData('managers')
    return get().normalizedDistinct(rows.map(d => d.nome_gerente))
  },

  gestaoList() {
    const rows = get().getFilteredData('gestao')
    return get().normalizedDistinct(rows.map(d => d.gestao))
  },

  segmentoList() {
    const rows = get().getFilteredData('segmento')
    return get().normalizedDistinct(rows.map(d => normalizeSegmento(d.segmento)))
  },

  coordenadorOpList() {
    const rows = get().getFilteredData(['coordenadores_op', 'coordenadores_atend'])
    return get().normalizedDistinct(
      rows.map(d => d.nome_coordenador_op_filtro || d.nome_coordenador_op || d.nome_coordenador)
    )
  },

  coordenadorAtendList() {
    const rows = get().getFilteredData(['coordenadores_op', 'coordenadores_atend'])
    return get().normalizedDistinct(rows.map(d => d.nome_coordenador_atend))
  },

  supervisorList() {
    const rows = get().getFilteredData('supervisores')
    return get().normalizedDistinct(rows.map(d => d.nome_supervisor))
  },

  statusList() {
    const rows = get().getFilteredData('status')
    const statusSet = new Set()
    rows.forEach(d => {
      if (d.status) statusSet.add(d.status.toUpperCase())
      if (d.status_legivel) statusSet.add(d.status_legivel.toUpperCase())
    })
    return [...statusSet].sort()
  },

  operadorList() {
    const rows = get().getFilteredData('operadores')
    return get().normalizedDistinct(rows.map(d => d.nome_operador))
  },

  horasList() {
    const rows = get().getFilteredData('horas')
    return get().normalizedDistinct(
      rows
        .map(d => (d.hora_entrada ? d.hora_entrada.slice(0, 5) : null))
        .filter(Boolean)
    )
  },

  todayKey() {
    const live = get().availableDates.find(d => d.live)
    return live ? live.date : null
  },

  queryParams() {
    const state = get()
    const p = {}
    Object.entries(state.filters).forEach(([key, arr]) => {
      if (arr && arr.length > 0) {
        p[key] = arr.join(',')
      }
    })
    if (state.selectedDate && state.selectedDate !== get().todayKey()) {
      p.date = state.selectedDate
    }
    return p
  },

  selectedDateCaptures() {
    const info = get().availableDates.find(d => d.date === get().selectedDate)
    return info?.captures || 0
  },

  availableDateKeys() {
    return get().availableDates.map(d => d.date)
  },

  selectedDateInfo() {
    const info = get().availableDates.find(d => d.date === get().selectedDate)
    if (!info) return null
    return {
      ...info,
      label: `${weekdayLabel(info.date)}, ${formatDateLabel(info.date)}`,
      caption: captureCaption(info)
    }
  },

  dateOptions() {
    return get().availableDates.map(d => ({
      value: d.date,
      label: `${formatDateLabel(d.date)} · ${weekdayLabel(d.date)}`,
      caption: d.live ? 'Hoje — atualiza automaticamente' : captureCaption(d),
      live: d.live
    }))
  },

  setFilter(key, value) {
    set(state => ({
      filters: { ...state.filters, [key]: value }
    }))
  },

  async fetchDates() {
    try {
      const { data } = await api.get('/api/dates')
      const availableDates = data.dates || []
      const backupDirectory = data.directory || ''
      const state = get()
      let selectedDate = state.selectedDate
      if (!selectedDate || !availableDates.some(d => d.date === selectedDate)) {
        selectedDate = data.today
      }
      set({ availableDates, backupDirectory, selectedDate })
    } catch (err) {
      console.error('Erro ao carregar dias disponíveis:', err)
    }
  },

  async fetchAllData() {
    set({ loading: true })
    try {
      if (get().availableDates.length === 0) {
        await get().fetchDates()
      }

      const params =
        get().selectedDate && get().selectedDate !== get().todayKey()
          ? { date: get().selectedDate }
          : {}

      const [rawRes, statusRes] = await Promise.all([
        api.get('/api/raw', { params }),
        api.get('/api/status', { params })
      ])

      const isHistorical = Boolean(statusRes.data.historical)
      const lastTs = toDate(statusRes.data.lastTs)
      const nextSlot = isHistorical ? null : normalizeNextSlot(statusRes.data.nextSlot)

      set({
        rawData: rawRes.data,
        isHistorical,
        lastTs,
        nextSlot
      })

      if (isHistorical) {
        get().stopCountdown()
        set({ countdownText: '--:--' })
      } else {
        get().startCountdown()
      }
    } catch (err) {
      console.error('Erro ao inicializar filtros e status:', err)
    } finally {
      set({ loading: false })
    }
  },

  async setSelectedDate(dateKey) {
    if (!dateKey || dateKey === get().selectedDate) return
    set({ selectedDate: dateKey })
    await get().fetchAllData()
  },

  async fetchGeral() {
    set({ loading: true })
    try {
      const res = await api.get('/api/geral', { params: get().queryParams() })
      set({ geralData: res.data })
    } catch (error) {
      console.error('Erro ao carregar dados Geral:', error)
    } finally {
      set({ loading: false })
    }
  },

  async fetchCoordenador() {
    set({ loading: true })
    try {
      const res = await api.get('/api/coordenador', { params: get().queryParams() })
      set({ coordenadorData: res.data })
    } catch (error) {
      console.error('Erro ao carregar dados Coordenador:', error)
    } finally {
      set({ loading: false })
    }
  },

  async fetchCoordenadorAtend() {
    set({ loading: true })
    try {
      const res = await api.get('/api/coordenador-at', { params: get().queryParams() })
      set({ coordenadorAtendData: res.data })
    } catch (error) {
      console.error('Erro ao carregar dados Coordenador Atendimento:', error)
    } finally {
      set({ loading: false })
    }
  },

  async fetchSupervisor() {
    set({ loading: true })
    try {
      const res = await api.get('/api/supervisor', { params: get().queryParams() })
      set({ supervisorData: res.data })
    } catch (error) {
      console.error('Erro ao carregar dados Supervisor:', error)
    } finally {
      set({ loading: false })
    }
  },

  async fetchFrequenciaYears() {
    try {
      const { data } = await api.get('/api/frequencia/years')
      const frequenciaYears = data.years || []
      const patch = { frequenciaYears }
      if (!get().frequenciaYear && frequenciaYears.length > 0) {
        patch.frequenciaYear = Number(frequenciaYears[0].year)
      }
      set(patch)
    } catch (error) {
      console.error('Erro ao carregar anos de frequência:', error)
    }
  },

  async fetchFrequenciaHistorico() {
    try {
      const { data } = await api.get('/api/frequencia/historico')
      set({
        frequenciaHistorico: {
          series: data.series || [],
          anos: data.anos || []
        }
      })
    } catch (error) {
      console.error('Erro ao carregar histórico de frequência:', error)
    }
  },

  /**
   * Jobs paralelos da página Histórico:
   * 1) years (rápido) → define ano
   * 2) historico + anual em paralelo
   * 3) nomes/filtros em paralelo (não bloqueiam KPIs)
   */
  async fetchFrequenciaPageJobs() {
    set({ loading: true })
    try {
      await get().fetchFrequenciaYears()
      if (!get().frequenciaYear) return

      const params = { year: get().frequenciaYear }
      if (get().frequenciaMonth) params.month = get().frequenciaMonth

      const anualJob = api.get('/api/frequencia', { params }).then(({ data }) => {
        set({ frequenciaData: data, frequenciaNomesPage: 1 })
      })

      const historicoJob = get().frequenciaHistorico.series.length
        ? Promise.resolve()
        : get().fetchFrequenciaHistorico()

      await Promise.all([anualJob, historicoJob])
    } catch (error) {
      console.error('Erro ao carregar frequência (jobs):', error)
    } finally {
      set({ loading: false })
    }

    // tabela diária / filtros — job separado, UI já mostra KPIs
    await Promise.all([
      get().fetchFrequenciaNomesFiltros(),
      get().fetchFrequenciaNomes()
    ])
  },

  async fetchFrequencia() {
    if (!get().frequenciaYear) {
      await get().fetchFrequenciaYears()
    }
    if (!get().frequenciaYear) return

    set({ loading: true })
    try {
      const params = { year: get().frequenciaYear }
      if (get().frequenciaMonth) params.month = get().frequenciaMonth

      const [anualRes] = await Promise.all([
        api.get('/api/frequencia', { params }),
        get().frequenciaHistorico.series.length
          ? Promise.resolve(null)
          : get().fetchFrequenciaHistorico()
      ])
      set({ frequenciaData: anualRes.data, frequenciaNomesPage: 1 })
    } catch (error) {
      console.error('Erro ao carregar frequência anual:', error)
    } finally {
      set({ loading: false })
    }

    await Promise.all([
      get().fetchFrequenciaNomesFiltros(),
      get().fetchFrequenciaNomes()
    ])
  },

  async fetchFrequenciaNomesFiltros() {
    if (!get().frequenciaYear) return
    try {
      const params = {
        year: get().frequenciaYear,
        tipo: get().frequenciaNomesTipo || 'todos'
      }
      if (get().frequenciaMonth) params.month = get().frequenciaMonth
      const { data } = await api.get('/api/frequencia/nomes/filtros', { params })
      set({
        frequenciaNomesFiltros: {
          segmentos: data.segmentos || [],
          gestoes: data.gestoes || [],
          supervisores: data.supervisores || [],
          coordenadores: data.coordenadores || []
        }
      })
    } catch (error) {
      console.error('Erro ao carregar filtros de nomes:', error)
      set({
        frequenciaNomesFiltros: {
          segmentos: [],
          gestoes: [],
          supervisores: [],
          coordenadores: []
        }
      })
    }
  },

  async fetchFrequenciaNomes() {
    if (!get().frequenciaYear) return

    set({ frequenciaNomesLoading: true })
    try {
      const params = {
        year: get().frequenciaYear,
        page: get().frequenciaNomesPage,
        pageSize: get().frequenciaNomesPageSize,
        tipo: get().frequenciaNomesTipo || 'todos'
      }
      if (get().frequenciaMonth) params.month = get().frequenciaMonth
      if (get().frequenciaNomesQ) params.q = get().frequenciaNomesQ
      if (get().frequenciaNomesSegmento) params.segmento = get().frequenciaNomesSegmento
      if (get().frequenciaNomesGestao) params.gestao = get().frequenciaNomesGestao
      if (get().frequenciaNomesSupervisor) params.supervisor = get().frequenciaNomesSupervisor
      if (get().frequenciaNomesCoordenador) params.coordenador = get().frequenciaNomesCoordenador

      const { data } = await api.get('/api/frequencia/nomes', { params })
      set({
        frequenciaNomes: data.registros || [],
        frequenciaNomesTotal: data.total || 0,
        frequenciaNomesPage: data.page || get().frequenciaNomesPage,
        frequenciaNomesPageSize: data.pageSize || get().frequenciaNomesPageSize
      })
    } catch (error) {
      console.error('Erro ao carregar registros diários de frequência:', error)
      set({ frequenciaNomes: [], frequenciaNomesTotal: 0 })
    } finally {
      set({ frequenciaNomesLoading: false })
    }
  },

  async setFrequenciaNomesPage(page) {
    const next = Math.max(Number(page) || 1, 1)
    if (next === get().frequenciaNomesPage) return
    set({ frequenciaNomesPage: next })
    await get().fetchFrequenciaNomes()
  },

  async setFrequenciaNomesTipo(tipo) {
    const next = tipo || 'todos'
    if (next === get().frequenciaNomesTipo) return
    set({
      frequenciaNomesTipo: next,
      frequenciaNomesPage: 1,
      frequenciaNomesSegmento: null,
      frequenciaNomesGestao: null,
      frequenciaNomesSupervisor: null,
      frequenciaNomesCoordenador: null
    })
    await Promise.all([
      get().fetchFrequenciaNomesFiltros(),
      get().fetchFrequenciaNomes()
    ])
  },

  async setFrequenciaNomesQ(q) {
    set({
      frequenciaNomesQ: String(q || '').trim(),
      frequenciaNomesPage: 1
    })
    await get().fetchFrequenciaNomes()
  },

  async setFrequenciaNomesFilters(partial = {}) {
    const patch = { frequenciaNomesPage: 1 }
    if ('segmento' in partial) patch.frequenciaNomesSegmento = partial.segmento || null
    if ('gestao' in partial) patch.frequenciaNomesGestao = partial.gestao || null
    if ('supervisor' in partial) patch.frequenciaNomesSupervisor = partial.supervisor || null
    if ('coordenador' in partial) patch.frequenciaNomesCoordenador = partial.coordenador || null
    set(patch)
    await get().fetchFrequenciaNomes()
  },

  async clearFrequenciaNomesFilters() {
    set({
      frequenciaNomesQ: '',
      frequenciaNomesSegmento: null,
      frequenciaNomesGestao: null,
      frequenciaNomesSupervisor: null,
      frequenciaNomesCoordenador: null,
      frequenciaNomesPage: 1
    })
    await get().fetchFrequenciaNomes()
  },

  async setFrequenciaYear(year) {
    const next = Number(year)
    if (!next || next === get().frequenciaYear) return
    set({
      frequenciaYear: next,
      frequenciaMonth: null,
      frequenciaNomesPage: 1,
      frequenciaNomesSegmento: null,
      frequenciaNomesGestao: null,
      frequenciaNomesSupervisor: null,
      frequenciaNomesCoordenador: null
    })
    await get().fetchFrequencia()
  },

  async setFrequenciaMonth(month) {
    const next = month == null || month === '' ? null : Number(month)
    if (next === get().frequenciaMonth) return
    set({
      frequenciaMonth: next,
      frequenciaNomesPage: 1,
      frequenciaNomesSegmento: null,
      frequenciaNomesGestao: null,
      frequenciaNomesSupervisor: null,
      frequenciaNomesCoordenador: null
    })
    await get().fetchFrequencia()
  },

  stopCountdown() {
    const { timerId } = get()
    if (timerId) {
      clearInterval(timerId)
      set({ timerId: null })
    }
  },

  startCountdown() {
    get().stopCountdown()
    if (get().isHistorical) return

    const updateTimer = () => {
      const { nextSlot, timerId } = get()
      if (!nextSlot) return

      const now = Date.now()
      const target = nextSlot.getTime()
      const diff = Math.max(0, Math.floor((target - now) / 1000))

      const mm = Math.floor(diff / 60)
      const ss = diff % 60

      set({
        countdownText: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
      })

      if (diff <= 0) {
        clearInterval(timerId)
        get().fetchAllData()
      }
    }

    updateTimer()
    const timerId = setInterval(updateTimer, 1000)
    set({ timerId })
  },

  clearFilters() {
    set({ filters: emptyFilters() })
  }
}))
