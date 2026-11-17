import { useCallback, useEffect, useMemo, useState, startTransition } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  ListSubheader,
  MenuItem,
  Popover,
  Select,
  TextField,
  Toolbar,
  Tooltip
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupsIcon from '@mui/icons-material/Groups'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SettingsIcon from '@mui/icons-material/Settings'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import RefreshIcon from '@mui/icons-material/Refresh'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import HistoryIcon from '@mui/icons-material/History'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import FolderIcon from '@mui/icons-material/Folder'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleAltOutlined'
import RuleIcon from '@mui/icons-material/Rule'
import BadgeIcon from '@mui/icons-material/Badge'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SyncIcon from '@mui/icons-material/Sync'
import TuneIcon from '@mui/icons-material/Tune'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import CloseIcon from '@mui/icons-material/Close'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { COLORS, RADII, SHADOWS, SPACING, UI_CLASSES } from '../theme'
import Sidebar from '../components/ui/Sidebar'
import { useDashboardStore, DISPLAY_TIMEZONE } from '../stores/dashboard'
import { useFilterLists } from '../hooks/useFilterLists'

const NAV_SECTIONS = [
  {
    title: 'Operações D-0',
    items: [
      { to: '/segmento', label: 'Por Segmento', sublabel: 'Visão D-0 · Segmentos', Icon: DashboardIcon },
      { to: '/coordenador-at', label: 'Coord. Atendimento', sublabel: 'D-0 · Atendimento', Icon: GroupsIcon },
      { to: '/coordenador', label: 'Coord. Operação', sublabel: 'D-0 · Operação', Icon: PeopleIcon },
      { to: '/supervisor', label: 'Por Supervisor', sublabel: 'D-0 · Equipes', Icon: PersonIcon }
    ]
  },
  {
    title: 'Aderência & Gestão',
    items: [
      { to: '/pausas', label: 'Aderência às Pausas', sublabel: 'Controle NR-17', Icon: ScheduleIcon },
      { to: '/frequencia', label: 'Histórico Anual', sublabel: 'Consolidado Optimus', Icon: CalendarMonthIcon }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { to: '/admin', label: 'Administração', sublabel: 'Sincronização · Logs', Icon: SettingsIcon }
    ]
  }
]

function routeMeta(path) {
  if (path.includes('pausas')) {
    return {
      section: 'Aderência & Gestão',
      title: 'Aderência às Pausas',
      subtitle: 'Relatório consolidado de desvios de início, tempo excedido e reincidência de ofensores'
    }
  }
  if (path.includes('coordenador-at')) {
    return {
      section: 'Operações D-0',
      title: 'Dashboard por Coordenador Atend.',
      subtitle: 'Acompanhamento de solicitações e presença por coordenação de atendimento'
    }
  }
  if (path.includes('coordenador')) {
    return {
      section: 'Operações D-0',
      title: 'Dashboard por Coordenador Op.',
      subtitle: 'Acompanhamento de solicitações e presença por coordenação de operação'
    }
  }
  if (path.includes('supervisor')) {
    return {
      section: 'Operações D-0',
      title: 'Dashboard por Supervisor',
      subtitle: 'Acompanhamento de solicitações e presença por supervisão'
    }
  }
  if (path.includes('frequencia')) {
    return {
      section: 'Aderência & Gestão',
      title: 'Histórico Anual',
      subtitle: 'Consolidado anual a partir de fatos_frequencia (Optimus)'
    }
  }
  if (path.includes('admin')) {
    return {
      section: 'Sistema',
      title: 'Painel Administrativo',
      subtitle: 'Sincronização Genesys, logs e histórico de execuções do sync'
    }
  }
  return {
    section: 'Operações D-0',
    title: 'Absenteísmo Call Center',
    subtitle: 'Acompanhamento de solicitações de absenteísmo por segmento'
  }
}

function formatParts(date) {
  if (!date) return null
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: DISPLAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)
}

function getPart(date, type) {
  return formatParts(date)?.find(p => p.type === type)?.value || null
}

function labelStatus(o) {
  return String(o || '').replace(/_/g, ' ')
}

const FILTER_MENU_MAX = 120

function FilterSelect({
  label,
  options,
  value,
  onChange,
  Icon,
  formatOption,
  forceSearchAbove = null,
  minSearchChars = 1,
  maxVisible = FILTER_MENU_MAX,
  sx = {}
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = Array.isArray(value) ? value : []
  const labelOf = useCallback(
    (o) => (formatOption ? formatOption(o) : String(o ?? '')),
    [formatOption]
  )

  const total = options?.length || 0
  const forceSearch = forceSearchAbove != null && total >= forceSearchAbove
  const q = query.trim()
  const searchReady = !forceSearch || q.length >= minSearchChars

  const { visible, truncated } = useMemo(() => {
    const list = options || []

    if (forceSearch && q.length < minSearchChars) {
      const kept = selected.filter((s) => list.includes(s))
      return { visible: kept, truncated: 0 }
    }

    const matched = !q
      ? list
      : list.filter((o) => labelOf(o).toLowerCase().includes(q.toLowerCase()))

    return {
      visible: matched.slice(0, maxVisible),
      truncated: Math.max(0, matched.length - maxVisible)
    }
  }, [options, q, selected, forceSearch, minSearchChars, labelOf, maxVisible])

  return (
    <FormControl
      size="small"
      fullWidth
      sx={{
        minWidth: 0,
        bgcolor: COLORS.surface.card,
        ...sx
      }}
    >
      <InputLabel
        shrink
        size="small"
        sx={{
          fontSize: '0.75rem',
          bgcolor: COLORS.surface.card,
          px: 0.5,
          color: selected.length ? COLORS.brand.navy : COLORS.text.subtle,
          fontWeight: selected.length ? 700 : 500,
          '&.Mui-focused': { color: COLORS.brand.navy }
        }}
      >
        {label}
      </InputLabel>
      <Select
        size="small"
        multiple
        displayEmpty
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false)
          setQuery('')
        }}
        label={label}
        value={selected}
        onChange={(e) => {
          const next = e.target.value
          const vals = typeof next === 'string' ? next.split(',') : next
          startTransition(() => onChange(vals))
        }}
        renderValue={(vals) => {
          if (!vals.length) {
            return (
              <div className="flex items-center gap-2 text-slate-400 text-body">
                {Icon ? <Icon sx={{ fontSize: 16 }} className="text-slate-400 shrink-0" /> : null}
                <span>Todos</span>
              </div>
            )
          }
          const text =
            vals.length === 1 ? labelOf(vals[0]) : `${vals.length} selecionados`
          return (
            <div className="flex items-center gap-2 min-w-0 overflow-hidden w-full">
              {Icon ? <Icon sx={{ fontSize: 16 }} className="text-hapvida-navy shrink-0" /> : null}
              <span className="truncate text-slate-900 text-body font-semibold leading-tight">
                {text}
              </span>
            </div>
          )
        }}
        MenuProps={{
          autoFocus: false,
          PaperProps: {
            sx: {
              maxHeight: 260,
              borderRadius: `${RADII.control}px`,
              boxShadow: SHADOWS.popover,
              '& .MuiList-root': { maxHeight: 260, overflow: 'auto', py: 0.5 }
            }
          }
        }}
        sx={{
          height: SPACING.controlHeight,
          borderRadius: `${RADII.control}px`,
          fontSize: '0.8125rem',
          bgcolor: selected.length ? COLORS.surface.canvas : COLORS.surface.card,
          '& .MuiSelect-select': {
            py: 0,
            px: 1.25,
            height: SPACING.controlHeight,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: selected.length ? COLORS.brand.blue : COLORS.border.input
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.text.subtle
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.brand.navy
          }
        }}
      >
        {open && (
          <ListSubheader
            sx={{
              bgcolor: 'background.paper',
              lineHeight: 1,
              py: 0.75,
              px: 1,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder={forceSearch ? 'Refine a busca...' : 'Pesquisar...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              InputProps={{ sx: { fontSize: 12, height: 32 } }}
              sx={{
                '& .MuiInputBase-input': { fontSize: 12, py: 0.75 }
              }}
            />
          </ListSubheader>
        )}
        {open && searchReady && visible.length === 0 && (
          <MenuItem dense disabled sx={{ minHeight: 32, fontSize: 12, py: 0.5, px: 1.5 }}>
            Nenhum resultado
          </MenuItem>
        )}
        {open &&
          visible.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <MenuItem
                dense
                key={String(opt)}
                value={opt}
                sx={{
                  minHeight: 32,
                  fontSize: 12,
                  py: 0.25,
                  px: 1.5,
                  gap: 0.5
                }}
              >
                <Checkbox
                  size="small"
                  disableRipple
                  tabIndex={-1}
                  checked={checked}
                  sx={{ p: 0.5, ml: 0, '& .MuiSvgIcon-root': { fontSize: 16 } }}
                />
                <ListItemText
                  primary={labelOf(opt)}
                  primaryTypographyProps={{ fontSize: 12, lineHeight: 1.25, noWrap: true }}
                />
              </MenuItem>
            )
          })}
        {open && truncated > 0 && (
          <MenuItem dense disabled sx={{ minHeight: 32, fontSize: 11, opacity: 0.7, py: 0.25, px: 1.5 }}>
            +{truncated.toLocaleString('pt-BR')} resultados
          </MenuItem>
        )}
      </Select>
    </FormControl>
  )
}

const SECONDARY_FILTER_KEYS = [
  'gestao',
  'managers',
  'coordenadores_atend',
  'coordenadores_op',
  'status',
  'operadores',
  'horas'
]

export default function MainLayout() {
  const location = useLocation()
  const path = location.pathname

  const loading = useDashboardStore(s => s.loading)
  const lastTs = useDashboardStore(s => s.lastTs)
  const nextSlot = useDashboardStore(s => s.nextSlot)
  const countdownText = useDashboardStore(s => s.countdownText)
  const filters = useDashboardStore(s => s.filters)
  const selectedDate = useDashboardStore(s => s.selectedDate)
  const isHistorical = useDashboardStore(s => s.isHistorical)
  const availableDates = useDashboardStore(s => s.availableDates)
  const rawData = useDashboardStore(s => s.rawData)

  const fetchAllData = useDashboardStore(s => s.fetchAllData)
  const fetchGeral = useDashboardStore(s => s.fetchGeral)
  const fetchCoordenador = useDashboardStore(s => s.fetchCoordenador)
  const fetchCoordenadorAtend = useDashboardStore(s => s.fetchCoordenadorAtend)
  const fetchSupervisor = useDashboardStore(s => s.fetchSupervisor)
  const fetchFrequencia = useDashboardStore(s => s.fetchFrequencia)
  const setSelectedDate = useDashboardStore(s => s.setSelectedDate)
  const clearFilters = useDashboardStore(s => s.clearFilters)
  const setFilter = useDashboardStore(s => s.setFilter)

  const store = useDashboardStore

  const [zoomFactor, setZoomFactor] = useState(() => {
    try {
      const saved = localStorage.getItem('abs-dashboard-zoom')
      return saved ? parseFloat(saved) : 1
    } catch {
      return 1
    }
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('abs-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [dateAnchor, setDateAnchor] = useState(null)
  const [zoomAnchor, setZoomAnchor] = useState(null)
  const [moreFiltersAnchor, setMoreFiltersAnchor] = useState(null)

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('abs-sidebar-collapsed', String(next))
      } catch (_) {}
      return next
    })
  }

  const filterLists = useFilterLists(rawData, filters)
  const {
    managers: managersList,
    gestao: gestaoList,
    segmento: segmentoList,
    coordenadores_op: coordenadorOpList,
    coordenadores_atend: coordenadorAtendList,
    supervisores: supervisorList,
    status: statusList,
    operadores: operadorList,
    horas: horasList
  } = filterLists

  const availableDateKeys = useMemo(() => availableDates.map(d => d.date), [availableDates])
  const selectedDateInfo = useMemo(() => store.getState().selectedDateInfo(), [store, availableDates, selectedDate])
  const selectedDateCaptures = useMemo(() => store.getState().selectedDateCaptures(), [store, availableDates, selectedDate])

  const meta = routeMeta(path)
  const hideFilters = path.includes('/admin') || path.includes('/frequencia') || path.includes('/pausas')

  const activeFilterCount = useMemo(
    () => Object.values(filters).reduce((t, arr) => t + (Array.isArray(arr) ? arr.length : 0), 0),
    [filters]
  )

  const secondaryFilterCount = useMemo(() => {
    return SECONDARY_FILTER_KEYS.reduce((acc, key) => {
      const val = filters[key]
      return acc + (Array.isArray(val) ? val.length : 0)
    }, 0)
  }, [filters])

  const formattedLastTsDate = lastTs
    ? `${getPart(lastTs, 'day')}/${getPart(lastTs, 'month')}/${getPart(lastTs, 'year')}`
    : '00/00/0000'
  const formattedLastTsTime = lastTs
    ? `${getPart(lastTs, 'hour')}:${getPart(lastTs, 'minute')}`
    : '00:00'
  const formattedNextSlotTime = nextSlot
    ? `${getPart(nextSlot, 'hour')}:${getPart(nextSlot, 'minute')}`
    : '00:00'

  const saveZoom = (z) => {
    setZoomFactor(z)
    try {
      localStorage.setItem('abs-dashboard-zoom', String(z))
    } catch (_) {}
  }

  const refreshRouteData = useCallback(async () => {
    if (path.includes('frequencia')) return fetchFrequencia()
    if (path.includes('coordenador-at')) return fetchCoordenadorAtend()
    if (path.includes('coordenador')) return fetchCoordenador()
    if (path.includes('supervisor')) return fetchSupervisor()
    return fetchGeral()
  }, [path, fetchFrequencia, fetchCoordenadorAtend, fetchCoordenador, fetchSupervisor, fetchGeral])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const filtersKey = JSON.stringify(filters)
  useEffect(() => {
    const t = window.setTimeout(() => {
      refreshRouteData()
    }, 250)
    return () => window.clearTimeout(t)
  }, [refreshRouteData, filtersKey])

  const onDateChange = async (dayjsVal) => {
    if (!dayjsVal) return
    const key = dayjsVal.format('YYYY-MM-DD')
    setDateAnchor(null)
    await setSelectedDate(key)
    await refreshRouteData()
  }

  const minDate = availableDateKeys.length
    ? dayjs(availableDateKeys.slice().sort()[0])
    : undefined
  const maxDate = availableDateKeys.length
    ? dayjs(availableDateKeys.slice().sort().at(-1))
    : undefined

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <div
        className={UI_CLASSES.pageShell}
        style={zoomFactor !== 1 ? { zoom: zoomFactor } : undefined}
      >
        {/* SIDEBAR ESQUERDA CORPORATIVA HAPVIDA */}
        <Sidebar
          sections={NAV_SECTIONS}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          syncStatus={{
            isHistorical,
            formattedLastTsDate,
            formattedLastTsTime,
            formattedNextSlotTime,
            countdownText
          }}
        />

        {/* ÁREA PRINCIPAL DE CONTEÚDO */}
        <div className={UI_CLASSES.mainContentArea}>
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: COLORS.surface.card,
              color: COLORS.text.primary,
              borderBottom: `1px solid ${COLORS.border.hairline}`,
              zIndex: 1100
            }}
          >
            <Toolbar
              sx={{
                minHeight: { xs: 56, md: SPACING.topbarHeight },
                px: { xs: 2, md: 3 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              <div className="min-w-0">
                <div className="hidden sm:flex items-center gap-2 text-label font-medium text-slate-500 leading-tight mb-1">
                  <span>{meta.section}</span>
                  <span aria-hidden="true">/</span>
                  <span className="text-slate-700 font-semibold truncate">{meta.title}</span>
                </div>
                <h1 className={UI_CLASSES.topbarTitle}>{meta.title}</h1>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 tabular-nums mr-2 whitespace-nowrap">
                  {isHistorical ? (
                    <>
                      <HistoryIcon sx={{ fontSize: 15 }} className="text-amber-600" />
                      <span className="font-semibold text-amber-800">
                        Histórico · {formattedLastTsDate}
                      </span>
                    </>
                  ) : (
                    <>
                      <SyncIcon sx={{ fontSize: 15 }} className="text-emerald-600" />
                      <span>
                        Sincronizado <strong className="text-slate-900">{formattedLastTsTime}</strong>
                      </span>
                    </>
                  )}
                </div>

                <Tooltip title="Ajuste de visualização (Zoom)">
                  <button
                    type="button"
                    aria-label={`Ajustar zoom (${Math.round(zoomFactor * 100)}%)`}
                    onClick={(e) => setZoomAnchor(e.currentTarget)}
                    className={UI_CLASSES.zoomTrigger}
                  >
                    <ZoomInIcon sx={{ fontSize: 16 }} className="text-slate-500" />
                    <span>{Math.round(zoomFactor * 100)}%</span>
                    <KeyboardArrowDownIcon sx={{ fontSize: 14 }} className="text-slate-400" />
                  </button>
                </Tooltip>

                <Popover
                  open={Boolean(zoomAnchor)}
                  anchorEl={zoomAnchor}
                  onClose={() => setZoomAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      p: 1.5,
                      width: 224,
                      borderRadius: `${RADII.card}px`,
                      border: `1px solid ${COLORS.border.hairline}`,
                      boxShadow: SHADOWS.popover
                    }
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">
                      Escala da Interface
                    </span>
                    <IconButton size="small" onClick={() => saveZoom(1)} sx={{ p: 0.25 }} aria-label="Resetar zoom para 100%" title="Resetar para 100%">
                      <RestartAltIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Button
                      size="small"
                      variant="outlined"
                      aria-label="Diminuir zoom"
                      onClick={() => zoomFactor > 0.6 && saveZoom(Math.max(0.6, +(zoomFactor - 0.1).toFixed(1)))}
                      disabled={zoomFactor <= 0.6}
                      sx={{ minWidth: 36, height: 34, p: 0 }}
                    >
                      <ZoomOutIcon fontSize="small" />
                    </Button>
                    <span className="text-sm font-bold min-w-12 text-center tabular-nums">
                      {Math.round(zoomFactor * 100)}%
                    </span>
                    <Button
                      size="small"
                      variant="outlined"
                      aria-label="Aumentar zoom"
                      onClick={() => zoomFactor < 1.5 && saveZoom(Math.min(1.5, +(zoomFactor + 0.1).toFixed(1)))}
                      disabled={zoomFactor >= 1.5}
                      sx={{ minWidth: 36, height: 34, p: 0 }}
                    >
                      <ZoomInIcon fontSize="small" />
                    </Button>
                  </div>
                  <Divider sx={{ my: 1 }} />
                  <div className="flex gap-1 justify-center">
                    {[80, 90, 100, 110, 125].map((pct) => (
                      <Button
                        key={pct}
                        size="small"
                        variant={Math.round(zoomFactor * 100) === pct ? 'contained' : 'text'}
                        onClick={() => saveZoom(pct / 100)}
                        sx={{
                          minWidth: 34,
                          px: 0.75,
                          py: 0.25,
                          fontSize: '0.7rem',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                </Popover>

                <Tooltip title="Atualizar dados agora">
                  <button
                    type="button"
                    aria-label="Atualizar dados agora"
                    onClick={() => {
                      fetchAllData()
                      refreshRouteData()
                    }}
                    disabled={loading}
                    className={UI_CLASSES.refreshIconBtn}
                  >
                    {loading ? <CircularProgress size={16} color="primary" /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                  </button>
                </Tooltip>
              </div>
            </Toolbar>
          </AppBar>

          {/* Conteúdo Principal da Rota */}
          <div className={UI_CLASSES.mainContentPadding}>
            {!hideFilters && (
              <div className={UI_CLASSES.filterBar}>
                {/* Filtro de Data */}
                <div>
                  <ButtonBase
                    onClick={(e) => setDateAnchor(e.currentTarget)}
                    className={`h-control px-3 rounded-control border flex items-center gap-2 transition-colors duration-150 ${
                      isHistorical
                        ? 'border-amber-500 bg-amber-50 hover:border-amber-600 hover:bg-amber-100'
                        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarMonthIcon
                      sx={{ fontSize: 18 }}
                      className={isHistorical ? 'text-amber-600' : 'text-hapvida-navy'}
                    />
                    <div className="text-left leading-[1.15]">
                      <div
                        className={`text-2xs font-bold tracking-wider ${
                          isHistorical ? 'text-amber-700' : 'text-slate-500'
                        }`}
                      >
                        Data
                      </div>
                      <div
                        className={`text-body font-semibold whitespace-nowrap tabular-nums ${
                          isHistorical ? 'text-amber-900' : 'text-slate-900'
                        }`}
                      >
                        {selectedDateInfo ? selectedDateInfo.label : 'Hoje'}
                      </div>
                    </div>
                    <KeyboardArrowDownIcon sx={{ fontSize: 16 }} className="text-slate-400 ml-1" />
                  </ButtonBase>

                  <Popover
                    open={Boolean(dateAnchor)}
                    anchorEl={dateAnchor}
                    onClose={() => setDateAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    PaperProps={{
                      sx: {
                        p: 1,
                        borderRadius: `${RADII.card}px`,
                        border: `1px solid ${COLORS.border.hairline}`,
                        boxShadow: SHADOWS.popover
                      }
                    }}
                  >
                    <div className="p-1">
                      <DateCalendar
                        value={selectedDate ? dayjs(selectedDate) : null}
                        onChange={onDateChange}
                        minDate={minDate}
                        maxDate={maxDate}
                        shouldDisableDate={(d) => !availableDateKeys.includes(d.format('YYYY-MM-DD'))}
                      />
                      <Divider />
                      <div className="flex items-center p-3 text-slate-600 text-xs tabular-nums">
                        <InfoOutlinedIcon sx={{ fontSize: 15 }} className="mr-2 text-hapvida-blue" />
                        Somente dias com dados salvos ficam habilitados ({availableDateKeys.length} disponíveis).
                      </div>
                    </div>
                  </Popover>
                </div>

                {/* Filtro de Segmento */}
                <FilterSelect
                  label="Segmento"
                  options={segmentoList}
                  value={filters.segmento}
                  onChange={v => setFilter('segmento', v)}
                  Icon={AnalyticsIcon}
                  sx={{ minWidth: 160, flex: '1 1 180px', maxWidth: { xs: '100%', sm: 220 } }}
                />

                {/* Filtro de Supervisor */}
                <FilterSelect
                  label="Supervisor"
                  options={supervisorList}
                  value={filters.supervisores}
                  onChange={v => setFilter('supervisores', v)}
                  Icon={PersonIcon}
                  sx={{ minWidth: 180, flex: '1 1 200px', maxWidth: { xs: '100%', sm: 260 } }}
                />

                {/* Botão + Mais Filtros */}
                <Button
                  size="small"
                  variant={secondaryFilterCount > 0 ? 'contained' : 'outlined'}
                  onClick={(e) => setMoreFiltersAnchor(e.currentTarget)}
                  startIcon={<TuneIcon sx={{ fontSize: 17 }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    height: SPACING.controlHeight,
                    px: 1.75,
                    fontSize: '0.8125rem',
                    ...(secondaryFilterCount > 0
                      ? {
                          bgcolor: COLORS.surface.activeFilter,
                          color: COLORS.brand.blue,
                          border: `1px solid ${COLORS.border.activeFilter}`,
                          '&:hover': {
                            bgcolor: COLORS.surface.activeFilterHover,
                            borderColor: COLORS.border.activeFilterHover
                          }
                        }
                      : {})
                  }}
                >
                  {secondaryFilterCount > 0 ? `+ Filtros (${secondaryFilterCount})` : '+ Mais Filtros'}
                </Button>

                {/* Popover dos Filtros Adicionais */}
                <Popover
                  open={Boolean(moreFiltersAnchor)}
                  anchorEl={moreFiltersAnchor}
                  onClose={() => setMoreFiltersAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      p: 2.5,
                      width: { xs: '92vw', sm: 600, md: 680 },
                      maxWidth: '100%',
                      borderRadius: `${RADII.popover}px`,
                      boxShadow: SHADOWS.popover,
                      border: `1px solid ${COLORS.border.hairline}`
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TuneIcon sx={{ fontSize: 20 }} className="text-hapvida-navy" />
                      <span className="font-display font-bold text-subtitle text-slate-900">
                        Filtros Adicionais
                      </span>
                      {secondaryFilterCount > 0 && (
                        <Chip
                          size="small"
                          label={`${secondaryFilterCount} aplicado(s)`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                        />
                      )}
                    </div>
                    <IconButton size="small" onClick={() => setMoreFiltersAnchor(null)} className="text-slate-500">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>

                  <Divider sx={{ mb: 2.5 }} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FilterSelect
                      label="Serviço"
                      options={gestaoList}
                      value={filters.gestao}
                      onChange={v => setFilter('gestao', v)}
                      Icon={FolderIcon}
                    />
                    <FilterSelect
                      label="Gerente"
                      options={managersList}
                      value={filters.managers}
                      onChange={v => setFilter('managers', v)}
                      Icon={PersonOutlineIcon}
                    />
                    <FilterSelect
                      label="Coord. Atendimento"
                      options={coordenadorAtendList}
                      value={filters.coordenadores_atend}
                      onChange={v => setFilter('coordenadores_atend', v)}
                      Icon={PeopleOutlineIcon}
                    />
                    <FilterSelect
                      label="Coord. Operação"
                      options={coordenadorOpList}
                      value={filters.coordenadores_op}
                      onChange={v => setFilter('coordenadores_op', v)}
                      Icon={PeopleOutlineIcon}
                    />
                    <FilterSelect
                      label="Status"
                      options={statusList}
                      value={filters.status}
                      onChange={v => setFilter('status', v)}
                      Icon={RuleIcon}
                      formatOption={labelStatus}
                    />
                    <FilterSelect
                      label="Hora de Entrada"
                      options={horasList}
                      value={filters.horas}
                      onChange={v => setFilter('horas', v)}
                      Icon={ScheduleIcon}
                    />
                    <div className="sm:col-span-2">
                      <FilterSelect
                        label="Operador"
                        options={operadorList}
                        value={filters.operadores}
                        onChange={v => setFilter('operadores', v)}
                        Icon={BadgeIcon}
                        forceSearchAbove={100}
                        minSearchChars={2}
                        maxVisible={100}
                      />
                    </div>
                  </div>

                  <Divider sx={{ my: 2.5 }} />

                  <div className="flex justify-between items-center">
                    <Button
                      size="small"
                      color="error"
                      disabled={secondaryFilterCount === 0}
                      onClick={() => {
                        SECONDARY_FILTER_KEYS.forEach(k => setFilter(k, []))
                      }}
                      startIcon={<ClearAllIcon />}
                    >
                      Limpar filtros adicionais
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setMoreFiltersAnchor(null)}
                      sx={{ px: 2.5 }}
                    >
                      Concluir
                    </Button>
                  </div>
                </Popover>

                {/* Metadados textuais limpos & Limpar Filtros à Direita */}
                <div className="flex items-center gap-3 ml-auto flex-nowrap">
                  {(isHistorical || !!selectedDateCaptures || activeFilterCount > 0) && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {isHistorical && (
                        <span className="text-amber-800 font-semibold inline-flex items-center gap-1">
                          <HistoryIcon sx={{ fontSize: 14 }} />
                          Histórico
                        </span>
                      )}
                      {isHistorical && !!selectedDateCaptures && <span aria-hidden="true">·</span>}
                      {!!selectedDateCaptures && (
                        <Tooltip title="Cada captura é uma leitura do Genesys gravada no banco. A tela mostra a última do dia.">
                          <span className="inline-flex items-center gap-1 cursor-help">
                            <PhotoCameraIcon sx={{ fontSize: 14 }} className="text-hapvida-blue" />
                            {selectedDateCaptures} {selectedDateCaptures > 1 ? 'capturas' : 'captura'}
                          </span>
                        </Tooltip>
                      )}
                      {(isHistorical || !!selectedDateCaptures) && activeFilterCount > 0 && <span aria-hidden="true">·</span>}
                      {activeFilterCount > 0 && (
                        <span className="font-semibold text-hapvida-navy">
                          {activeFilterCount} filtro(s)
                        </span>
                      )}
                    </div>
                  )}

                  {activeFilterCount > 0 && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<ClearAllIcon sx={{ fontSize: 16 }} />}
                      onClick={clearFilters}
                      sx={{ height: SPACING.compactHeight, fontSize: '0.75rem', px: 1.25 }}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Outlet />
          </div>
        </div>
      </div>
    </LocalizationProvider>
  )
}
