import { useCallback, useEffect, useMemo, useState, startTransition } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
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
  Tooltip,
  Typography
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
import TuneIcon from '@mui/icons-material/Tune'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import CloseIcon from '@mui/icons-material/Close'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useDashboardStore, DISPLAY_TIMEZONE } from '../stores/dashboard'
import { useFilterLists } from '../hooks/useFilterLists'

const NAV_SECTIONS = [
  {
    title: 'Operações D-0',
    items: [
      { to: '/segmento', label: 'Por Segmento', Icon: DashboardIcon },
      { to: '/coordenador-at', label: 'Coord. Atendimento', Icon: GroupsIcon },
      { to: '/coordenador', label: 'Coord. Operação', Icon: PeopleIcon },
      { to: '/supervisor', label: 'Por Supervisor', Icon: PersonIcon }
    ]
  },
  {
    title: 'Aderência & Gestão',
    items: [
      { to: '/pausas', label: 'Aderência às Pausas', Icon: ScheduleIcon, badge: 'NR-17' },
      { to: '/frequencia', label: 'Histórico Anual', Icon: CalendarMonthIcon }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { to: '/admin', label: 'Administração', Icon: SettingsIcon }
    ]
  }
]

const TABS = NAV_SECTIONS.flatMap(s => s.items)

function routeMeta(path) {
  if (path.includes('pausas')) {
    return {
      title: 'Aderência às Pausas',
      subtitle: 'Relatório consolidado de desvios de início, tempo excedido e reincidência de ofensores'
    }
  }
  if (path.includes('coordenador-at')) {
    return {
      title: 'Dashboard por Coordenador Atend.',
      subtitle: 'Acompanhamento de solicitações e presença por coordenação de atendimento'
    }
  }
  if (path.includes('coordenador')) {
    return {
      title: 'Dashboard por Coordenador Op.',
      subtitle: 'Acompanhamento de solicitações e presença por coordenação de operação'
    }
  }
  if (path.includes('supervisor')) {
    return {
      title: 'Dashboard por Supervisor',
      subtitle: 'Acompanhamento de solicitações e presença por supervisão'
    }
  }
  if (path.includes('frequencia')) {
    return {
      title: 'Histórico',
      subtitle: 'Consolidado anual a partir de fatos_frequencia (Optimus)'
    }
  }
  if (path.includes('admin')) {
    return {
      title: 'Painel Administrativo',
      subtitle: 'Sincronização Genesys, logs e histórico de execuções do sync'
    }
  }
  return {
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
        bgcolor: '#ffffff',
        ...sx
      }}
    >
      <InputLabel
        shrink
        size="small"
        sx={{
          fontSize: '0.75rem',
          bgcolor: '#ffffff',
          px: 0.5,
          color: selected.length ? '#002D62' : '#64748b',
          fontWeight: selected.length ? 700 : 500,
          '&.Mui-focused': { color: '#002D62' }
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#94a3b8', fontSize: '0.8125rem' }}>
                {Icon ? <Icon sx={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }} /> : null}
                <span>Todos</span>
              </Box>
            )
          }
          const text =
            vals.length === 1 ? labelOf(vals[0]) : `${vals.length} selecionados`
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 0,
                overflow: 'hidden',
                width: '100%'
              }}
            >
              {Icon ? <Icon sx={{ fontSize: 16, color: '#002D62', flexShrink: 0 }} /> : null}
              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#0f172a',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  lineHeight: 1.2
                }}
              >
                {text}
              </Box>
            </Box>
          )
        }}
        MenuProps={{
          autoFocus: false,
          PaperProps: {
            sx: {
              maxHeight: 260,
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              '& .MuiList-root': { maxHeight: 260, overflow: 'auto', py: 0.5 }
            }
          }
        }}
        sx={{
          height: 38,
          borderRadius: '8px',
          fontSize: '0.8125rem',
          bgcolor: selected.length ? '#f8fafc' : '#ffffff',
          '& .MuiSelect-select': {
            py: 0,
            px: 1.25,
            height: 38,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: selected.length ? '#93c5fd' : '#cbd5e1'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#64748b'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#002D62'
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
                  gap: 0.5,
                  '&.Mui-selected': { bgcolor: '#eff6ff' },
                  '&.Mui-selected:hover': { bgcolor: '#dbeafe' }
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
  const [dateAnchor, setDateAnchor] = useState(null)
  const [zoomAnchor, setZoomAnchor] = useState(null)
  const [moreFiltersAnchor, setMoreFiltersAnchor] = useState(null)

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
  const selectedDateInfo = useMemo(() => store.getState().selectedDateInfo(), [availableDates, selectedDate])
  const selectedDateCaptures = useMemo(() => store.getState().selectedDateCaptures(), [availableDates, selectedDate])

  const isInsideIframe = useMemo(() => {
    try {
      return window.self !== window.top
    } catch {
      return true
    }
  }, [])

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
      <Box sx={{ zoom: zoomFactor, minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex' }}>
        {/* SIDEBAR ESQUERDA CORPORATIVA HAPVIDA */}
        <Box
          component="aside"
          sx={{
            width: { xs: 72, md: 240 },
            minWidth: { xs: 72, md: 240 },
            flexShrink: 0,
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 1200,
            transition: 'width 0.2s ease',
            boxShadow: '1px 0 3px 0 rgba(0, 0, 0, 0.02)'
          }}
        >
          {/* Topo da Sidebar: Logo Hapvida + Identidade */}
          <Box
            sx={{
              p: { xs: 1.5, md: 2 },
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box
                component="img"
                src="/images/Hapvida_novo.png"
                alt="Hapvida"
                sx={{ height: 26, width: 'auto', display: 'block' }}
              />
              <Box
                component="span"
                sx={{
                  display: { xs: 'none', md: 'inline-block' },
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#1d4ed8',
                  bgcolor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  px: 0.75,
                  py: 0.2,
                  lineHeight: 1
                }}
              >
                Tempo Real
              </Box>
            </Box>
            <Typography
              sx={{
                display: { xs: 'none', md: 'block' },
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: '0.875rem',
                color: '#002D62',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              Abs Modular
            </Typography>
          </Box>

          {/* Navegação Vertical por Seções */}
          <Box
            sx={{
              flex: 1,
              py: 2,
              px: { xs: 1, md: 1.5 },
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {NAV_SECTIONS.map((sec) => (
              <Box key={sec.title}>
                <Typography
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    px: 1.25,
                    mb: 0.75,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  {sec.title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {sec.items.map(({ to, label, Icon, badge }) => (
                    <NavLink
                      key={to}
                      to={to}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#ffffff' : '#475569',
                        backgroundColor: isActive ? '#002D62' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 2px 4px rgba(0, 45, 98, 0.2)' : 'none'
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                            <Icon
                              sx={{
                                fontSize: 18,
                                color: isActive ? '#ffffff' : '#64748b',
                                flexShrink: 0
                              }}
                            />
                            <Typography
                              component="span"
                              sx={{
                                display: { xs: 'none', md: 'block' },
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                color: 'inherit',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {label}
                            </Typography>
                          </Box>
                          {badge && (
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'none', md: 'inline-block' },
                                fontSize: '0.5625rem',
                                fontWeight: 700,
                                px: 0.6,
                                py: 0.15,
                                borderRadius: '4px',
                                bgcolor: isActive ? 'rgba(255,255,255,0.2)' : '#fef3c7',
                                color: isActive ? '#ffffff' : '#92400e'
                              }}
                            >
                              {badge}
                            </Box>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Rodapé da Sidebar: Status de Sincronização */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid #f1f5f9',
              bgcolor: '#fcfdfe',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              gap: 1
            }}
          >
            {isHistorical ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  bgcolor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  p: 1,
                  fontSize: '0.6875rem',
                  fontWeight: 600
                }}
              >
                <HistoryIcon sx={{ fontSize: 15, color: '#d97706', flexShrink: 0 }} />
                <span>Histórico: {formattedLastTsDate}</span>
              </Box>
            ) : (
              <Tooltip
                title={
                  <Box sx={{ p: 0.5, fontSize: '0.75rem' }}>
                    <div><strong>Último log:</strong> {formattedLastTsTime} ({formattedLastTsDate})</div>
                    <div><strong>Próxima leitura:</strong> {formattedNextSlotTime} (em {countdownText})</div>
                  </Box>
                }
                arrow
              >
                <Box
                  sx={{
                    bgcolor: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    p: 1,
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                        flexShrink: 0
                      }}
                    />
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#065f46' }}>
                      Sincronizado {formattedLastTsTime}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.625rem', color: '#047857', pl: 2 }}>
                    Próxima leitura às {formattedNextSlotTime}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* ÁREA PRINCIPAL DE CONTEÚDO (À DIREITA DA SIDEBAR) */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* TopBar Minimalista */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: '#ffffff',
              color: '#0f172a',
              borderBottom: '1px solid #e2e8f0',
              zIndex: 1100
            }}
          >
            <Toolbar
              sx={{
                minHeight: { xs: 52, md: 56 },
                px: { xs: 2, md: 3 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Título e Subtítulo da Página Atual */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    fontWeight: 700,
                    color: '#0f172a',
                    fontSize: { xs: '1.05rem', md: '1.2rem' },
                    lineHeight: 1.2
                  }}
                >
                  {meta.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                  {meta.subtitle}
                </Typography>
              </Box>

              {/* Ações da TopBar: Zoom e Atualizar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Botão de Zoom com Popover */}
                <Tooltip title="Ajuste de visualização (Zoom)">
                  <ButtonBase
                    onClick={(e) => setZoomAnchor(e.currentTarget)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#f8fafc',
                      color: '#334155',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                    }}
                  >
                    <ZoomInIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    <span>{Math.round(zoomFactor * 100)}%</span>
                    <KeyboardArrowDownIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  </ButtonBase>
                </Tooltip>

                <Popover
                  open={Boolean(zoomAnchor)}
                  anchorEl={zoomAnchor}
                  onClose={() => setZoomAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: { p: 1.5, width: 220, borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Zoom
                    </Typography>
                    <IconButton size="small" onClick={() => saveZoom(1)} sx={{ p: 0.25 }} title="Resetar para 100%">
                      <RestartAltIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => zoomFactor > 0.6 && saveZoom(Math.max(0.6, +(zoomFactor - 0.1).toFixed(1)))}
                      disabled={zoomFactor <= 0.6}
                      sx={{ minWidth: 36, height: 32, p: 0 }}
                    >
                      <ZoomOutIcon fontSize="small" />
                    </Button>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, minWidth: 48, textAlign: 'center' }}>
                      {Math.round(zoomFactor * 100)}%
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => zoomFactor < 1.5 && saveZoom(Math.min(1.5, +(zoomFactor + 0.1).toFixed(1)))}
                      disabled={zoomFactor >= 1.5}
                      sx={{ minWidth: 36, height: 32, p: 0 }}
                    >
                      <ZoomInIcon fontSize="small" />
                    </Button>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {[80, 90, 100, 110, 125].map((pct) => (
                      <Button
                        key={pct}
                        size="small"
                        variant={Math.round(zoomFactor * 100) === pct ? 'contained' : 'text'}
                        onClick={() => saveZoom(pct / 100)}
                        sx={{
                          minWidth: 32,
                          px: 0.75,
                          py: 0.25,
                          fontSize: '0.7rem',
                          bgcolor: Math.round(zoomFactor * 100) === pct ? '#002D62' : 'transparent',
                          '&:hover': {
                            bgcolor: Math.round(zoomFactor * 100) === pct ? '#001a38' : '#f1f5f9'
                          }
                        }}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </Box>
                </Popover>

                {/* Botão de Atualizar */}
                <Tooltip title="Atualizar dados agora">
                  <IconButton
                    size="small"
                    onClick={() => {
                      fetchAllData()
                      refreshRouteData()
                    }}
                    disabled={loading}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      color: '#002D62',
                      '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                    }}
                  >
                    {loading ? <CircularProgress size={16} sx={{ color: '#002D62' }} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Conteúdo Principal da Rota */}
          <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
            {/* Barra de Filtros Compacta em 1 Linha */}
          {!hideFilters && (
            <Box
              sx={{
                mb: 2.5,
                p: 1,
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap'
              }}
            >
              {/* Filtro de Data */}
              <Box>
                <ButtonBase
                  onClick={(e) => setDateAnchor(e.currentTarget)}
                  sx={{
                    height: 38,
                    px: 1.5,
                    borderRadius: '8px',
                    border: isHistorical ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                    bgcolor: isHistorical ? '#fffbeb' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isHistorical ? '#d97706' : '#94a3b8',
                      bgcolor: isHistorical ? '#fef3c7' : '#f8fafc'
                    }
                  }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 18, color: isHistorical ? '#d97706' : '#002D62' }} />
                  <Box sx={{ textAlign: 'left', lineHeight: 1.1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: isHistorical ? '#b45309' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Dia
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: isHistorical ? '#92400e' : '#0f172a',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selectedDateInfo ? selectedDateInfo.label : 'Hoje'}
                    </Typography>
                  </Box>
                  <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#94a3b8', ml: 0.25 }} />
                </ButtonBase>

                <Popover
                  open={Boolean(dateAnchor)}
                  anchorEl={dateAnchor}
                  onClose={() => setDateAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  PaperProps={{
                    sx: { p: 1, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }
                  }}
                >
                  <Box sx={{ p: 0.5 }}>
                    <DateCalendar
                      value={selectedDate ? dayjs(selectedDate) : null}
                      onChange={onDateChange}
                      minDate={minDate}
                      maxDate={maxDate}
                      shouldDisableDate={(d) => !availableDateKeys.includes(d.format('YYYY-MM-DD'))}
                    />
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, color: '#64748b', fontSize: '0.75rem' }}>
                      <InfoOutlinedIcon sx={{ fontSize: 15, mr: 0.75, color: '#3b82f6' }} />
                      Somente dias com dados salvos ficam habilitados ({availableDateKeys.length} disponíveis).
                    </Box>
                  </Box>
                </Popover>
              </Box>

              {/* Filtro de Segmento */}
              <FilterSelect
                label="Segmento"
                options={segmentoList}
                value={filters.segmento}
                onChange={v => setFilter('segmento', v)}
                Icon={AnalyticsIcon}
                sx={{ minWidth: 150, flex: '1 1 170px', maxWidth: { xs: '100%', sm: 220 } }}
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
                startIcon={<TuneIcon sx={{ fontSize: 18 }} />}
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
                sx={{
                  height: 38,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  px: 1.5,
                  ...(secondaryFilterCount > 0
                    ? {
                        bgcolor: '#eff6ff',
                        color: '#1d4ed8',
                        borderColor: '#3b82f6',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#dbeafe', borderColor: '#2563eb', boxShadow: 'none' }
                      }
                    : {
                        color: '#475569',
                        borderColor: '#cbd5e1',
                        bgcolor: '#ffffff',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                      })
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
                    borderRadius: '14px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TuneIcon sx={{ fontSize: 20, color: '#002D62' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                      Filtros Adicionais
                    </Typography>
                    {secondaryFilterCount > 0 && (
                      <Chip
                        size="small"
                        label={`${secondaryFilterCount} aplicado(s)`}
                        sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => setMoreFiltersAnchor(null)} sx={{ color: '#64748b' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
                  <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
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
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    size="small"
                    color="error"
                    disabled={secondaryFilterCount === 0}
                    onClick={() => {
                      SECONDARY_FILTER_KEYS.forEach(k => setFilter(k, []))
                    }}
                    startIcon={<ClearAllIcon />}
                    sx={{ textTransform: 'none', fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    Limpar filtros adicionais
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setMoreFiltersAnchor(null)}
                    sx={{
                      bgcolor: '#002D62',
                      '&:hover': { bgcolor: '#001a38' },
                      textTransform: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      px: 2.5,
                      borderRadius: '8px'
                    }}
                  >
                    Concluir
                  </Button>
                </Box>
              </Popover>

              {/* Informações e Ações à Direita */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto', flexWrap: 'nowrap' }}>
                {isHistorical && (
                  <Chip
                    size="small"
                    icon={<HistoryIcon sx={{ fontSize: 15 }} />}
                    label="Histórico"
                    sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, height: 26, fontSize: '0.75rem' }}
                  />
                )}

                {!!selectedDateCaptures && (
                  <Tooltip title="Cada captura é uma leitura do Genesys gravada no banco. A tela mostra a última do dia.">
                    <Chip
                      size="small"
                      icon={<PhotoCameraIcon sx={{ fontSize: 14 }} />}
                      label={`${selectedDateCaptures} ${selectedDateCaptures > 1 ? 'capturas' : 'captura'}`}
                      sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, height: 26, fontSize: '0.75rem' }}
                    />
                  </Tooltip>
                )}

                {activeFilterCount > 0 && (
                  <>
                    <Chip
                      size="small"
                      label={`${activeFilterCount} ativo(s)`}
                      sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, height: 26, fontSize: '0.75rem' }}
                    />
                    <Button
                      size="small"
                      color="error"
                      startIcon={<ClearAllIcon />}
                      onClick={clearFilters}
                      sx={{
                        height: 32,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        px: 1,
                        borderRadius: '6px'
                      }}
                    >
                      Limpar
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          )}

          <Outlet />
        </Box>
      </Box>
    </Box>
  </LocalizationProvider>
)
}
