import { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import GroupsIcon from '@mui/icons-material/Groups'
import PercentIcon from '@mui/icons-material/Percent'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { useDashboardStore } from '../stores/dashboard'
import { DataTable, SectionCard } from '../components/DataTable'
import { HAPVIDA_PALETTE, baseChartOptions, buildCustomTooltip } from '../utils/chartConfig'
import {
  formatDateBr,
  formatMilhar,
  formatPct,
  freqChipColor
} from '../utils/format'

const MESES = [
  { label: 'Janeiro', value: 1 },
  { label: 'Fevereiro', value: 2 },
  { label: 'Março', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Maio', value: 5 },
  { label: 'Junho', value: 6 },
  { label: 'Julho', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Setembro', value: 9 },
  { label: 'Outubro', value: 10 },
  { label: 'Novembro', value: 11 },
  { label: 'Dezembro', value: 12 }
]
const MESES_NOME = MESES.map(m => m.label)
const YEAR_COLORS = [
  HAPVIDA_PALETTE.blueNavy,
  HAPVIDA_PALETTE.orange,
  HAPVIDA_PALETTE.greenEmerald,
  HAPVIDA_PALETTE.bluePrimary,
  HAPVIDA_PALETTE.purple
]

const TIPO_OPTIONS = [
  { label: 'Ausências', value: 'ausencia' },
  { label: 'Faltas', value: 'falta' },
  { label: 'Atestados', value: 'atestado' },
  { label: 'Presentes', value: 'presente' },
  { label: 'Todos', value: 'todos' }
]

const NOMES_COLUMNS = [
  { field: 'data', label: 'Data' },
  { field: 'nome_operador', label: 'Operador' },
  { field: 'nome_supervisor', label: 'Supervisor' },
  { field: 'nome_coordenador', label: 'Coordenador' },
  { field: 'segmento', label: 'Segmento' },
  { field: 'Frequencia', label: 'Frequência' },
  { field: 'horario', label: 'Horário', align: 'center' },
  { field: 'situacao', label: 'Situação' }
]

function KpiCard({ label, value, Icon, iconColor, iconBg, badgeText, badgeBg, badgeColor, badgeBorder, tip }) {
  return (
    <div
      className="custom-kpi-card"
      style={{
        flex: 1,
        minWidth: 175,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'default'
      }}
    >
      <div className="card-main-content">
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <div className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{label}</span>
            <Tooltip title={tip} arrow placement="top">
              <InfoOutlinedIcon
                sx={{
                  fontSize: 14,
                  color: '#94A3B8',
                  cursor: 'help',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#0B4F9C' }
                }}
              />
            </Tooltip>
          </div>
          <div className="kpi-value">{value}</div>
        </div>
        {Icon ? (
          <div
            className="kpi-icon-container"
            style={{
              backgroundColor: iconBg || '#EFF6FF',
              color: iconColor || '#0B4F9C'
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </div>
        ) : null}
      </div>
      {badgeText && (
        <div style={{ padding: '0 18px 14px 18px' }}>
          <span
            className="kpi-badge"
            style={{
              backgroundColor: badgeBg || '#F8FAFC',
              color: badgeColor || '#475569',
              border: `1px solid ${badgeBorder || '#E2E8F0'}`,
              margin: 0
            }}
          >
            {badgeText}
          </span>
        </div>
      )}
    </div>
  )
}

export default function FrequenciaPage() {
  const frequenciaYears = useDashboardStore(s => s.frequenciaYears)
  const frequenciaYear = useDashboardStore(s => s.frequenciaYear)
  const frequenciaMonth = useDashboardStore(s => s.frequenciaMonth)
  const frequenciaData = useDashboardStore(s => s.frequenciaData)
  const frequenciaHistorico = useDashboardStore(s => s.frequenciaHistorico)
  const frequenciaNomes = useDashboardStore(s => s.frequenciaNomes)
  const frequenciaNomesTotal = useDashboardStore(s => s.frequenciaNomesTotal)
  const frequenciaNomesTipo = useDashboardStore(s => s.frequenciaNomesTipo)
  const frequenciaNomesQ = useDashboardStore(s => s.frequenciaNomesQ)
  const frequenciaNomesGestao = useDashboardStore(s => s.frequenciaNomesGestao)
  const frequenciaNomesSegmento = useDashboardStore(s => s.frequenciaNomesSegmento)
  const frequenciaNomesCoordenador = useDashboardStore(s => s.frequenciaNomesCoordenador)
  const frequenciaNomesSupervisor = useDashboardStore(s => s.frequenciaNomesSupervisor)
  const frequenciaNomesFiltros = useDashboardStore(s => s.frequenciaNomesFiltros)
  const frequenciaNomesLoading = useDashboardStore(s => s.frequenciaNomesLoading)
  const loading = useDashboardStore(s => s.loading)

  const fetchFrequenciaPageJobs = useDashboardStore(s => s.fetchFrequenciaPageJobs)
  const fetchFrequencia = useDashboardStore(s => s.fetchFrequencia)
  const setFrequenciaYear = useDashboardStore(s => s.setFrequenciaYear)
  const setFrequenciaMonth = useDashboardStore(s => s.setFrequenciaMonth)
  const setFrequenciaNomesTipo = useDashboardStore(s => s.setFrequenciaNomesTipo)
  const setFrequenciaNomesQ = useDashboardStore(s => s.setFrequenciaNomesQ)
  const setFrequenciaNomesFilters = useDashboardStore(s => s.setFrequenciaNomesFilters)
  const clearFrequenciaNomesFilters = useDashboardStore(s => s.clearFrequenciaNomesFilters)
  const setFrequenciaNomesPage = useDashboardStore(s => s.setFrequenciaNomesPage)
  const frequenciaNomesPage = useDashboardStore(s => s.frequenciaNomesPage)

  const [nomeFilter, setNomeFilter] = useState(frequenciaNomesQ || '')
  const [searchTimer, setSearchTimer] = useState(null)

  useEffect(() => {
    fetchFrequenciaPageJobs()
  }, [fetchFrequenciaPageJobs])

  const yearOptions = useMemo(
    () => (frequenciaYears || []).map(y => Number(y.year)),
    [frequenciaYears]
  )

  const periodoLabel = useMemo(() => {
    if (!frequenciaYear) return ''
    if (!frequenciaMonth) return `Ano ${frequenciaYear}`
    const mes = MESES.find(m => m.value === frequenciaMonth)
    return `${mes?.label || frequenciaMonth}/${frequenciaYear}`
  }, [frequenciaYear, frequenciaMonth])

  const kpis = frequenciaData?.kpis || {}
  const meses = frequenciaData?.meses || []
  const melhor = meses.length ? meses.reduce((a, b) => (a.abs_pct <= b.abs_pct ? a : b)) : null
  const pior = meses.length ? meses.reduce((a, b) => (a.abs_pct >= b.abs_pct ? a : b)) : null

  const chartRows = useMemo(() => {
    if (!frequenciaMonth) return meses
    return meses.filter(r => Number(String(r.mes).slice(5, 7)) === Number(frequenciaMonth))
  }, [meses, frequenciaMonth])

  const monthlyTableRows = useMemo(() => chartRows.map(r => ({
    Mes: r.label || r.mes,
    Pessoas: Number(r.pessoas) || 0,
    Absenteismo: Number(r.pessoasAbsenteismo) || 0,
    ABS: Number(r.abs_pct) || 0
  })), [chartRows])

  const monthlyChartSeries = useMemo(() => [
    { name: 'Pessoas', type: 'column', data: monthlyTableRows.map(r => r.Pessoas) },
    { name: 'C/ Absenteísmo', type: 'column', data: monthlyTableRows.map(r => r.Absenteismo) },
    { name: 'ABS%', type: 'line', data: monthlyTableRows.map(r => r.ABS) }
  ], [monthlyTableRows])

  const monthlyChartOptions = useMemo(() => {
    const absValues = monthlyTableRows.map(r => r.ABS)
    const maxAbs = absValues.length ? Math.max(...absValues) : 10
    return {
      ...baseChartOptions,
      chart: {
        ...baseChartOptions.chart,
        height: 350,
        type: 'line',
        stacked: true
      },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      colors: [HAPVIDA_PALETTE.blueNavy, HAPVIDA_PALETTE.redCoral, HAPVIDA_PALETTE.orange],
      plotOptions: { bar: { columnWidth: '40%', borderRadius: 4 } },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [2],
        formatter: (val) => `${Number(val).toFixed(1)}%`,
        style: {
          fontSize: '11px',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          colors: [HAPVIDA_PALETTE.slate900]
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 4,
          padding: 4,
          opacity: 0.9,
          borderColor: HAPVIDA_PALETTE.orange
        }
      },
      labels: monthlyTableRows.map(r => String(r.Mes || '').slice(0, 3)),
      xaxis: {
        type: 'category',
        title: {
          text: 'Mês',
          style: { color: HAPVIDA_PALETTE.slate500, fontWeight: 600, fontSize: '11px' }
        },
        labels: {
          style: {
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            colors: HAPVIDA_PALETTE.slate500
          }
        },
        axisBorder: { color: HAPVIDA_PALETTE.slate200 },
        axisTicks: { color: HAPVIDA_PALETTE.slate200 }
      },
      yaxis: [
        {
          title: {
            text: 'Volume de Pessoas',
            style: { color: HAPVIDA_PALETTE.slate500, fontWeight: 600, fontSize: '11px' }
          },
          labels: {
            formatter: (val) => (Number.isFinite(val) ? Math.round(val).toLocaleString('pt-BR') : val),
            style: { colors: HAPVIDA_PALETTE.slate500, fontSize: '11px' }
          }
        },
        {
          opposite: true,
          title: {
            text: 'ABS %',
            style: { color: HAPVIDA_PALETTE.orange, fontWeight: 700, fontSize: '11px' }
          },
          min: 0,
          max: Math.max(15, Math.ceil(maxAbs * 1.25)),
          labels: {
            formatter: (val) => `${Number(val).toFixed(1)}%`,
            style: { colors: HAPVIDA_PALETTE.orange, fontWeight: 600, fontSize: '11px' }
          }
        }
      ],
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex }) => {
          const mes = monthlyTableRows[dataPointIndex]?.Mes || ''
          const pessoas = series[0]?.[dataPointIndex] ?? 0
          const absPessoas = series[1]?.[dataPointIndex] ?? 0
          const absPct = series[2]?.[dataPointIndex] ?? 0

          return buildCustomTooltip({
            headerTitle: `Mês: ${mes}`,
            items: [
              { color: HAPVIDA_PALETTE.blueNavy, label: 'Pessoas', value: pessoas.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.redCoral, label: 'C/ Absenteísmo', value: absPessoas.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.orange, label: 'Taxa ABS', value: `${Number(absPct).toFixed(1)}%` }
            ]
          })
        }
      }
    }
  }, [monthlyTableRows])

  const historicoSeries = frequenciaHistorico?.series || []
  const compareChartSeries = useMemo(() => {
    const years = [...new Set(historicoSeries.map(r => Number(r.year)))].sort()
    return years.map(year => {
      const byMonth = new Map(
        historicoSeries.filter(r => Number(r.year) === year).map(r => [Number(r.month), Number(r.abs_pct)])
      )
      return {
        name: String(year),
        data: MESES.map(m => {
          const v = byMonth.get(m.value)
          return v == null || Number.isNaN(v) ? null : Number(v.toFixed(2))
        })
      }
    })
  }, [historicoSeries])

  const compareChartOptions = useMemo(() => ({
    ...baseChartOptions,
    chart: {
      ...baseChartOptions.chart,
      type: 'line',
      height: 300
    },
    stroke: { width: 3, curve: 'smooth' },
    colors: YEAR_COLORS,
    markers: { size: 4, strokeColors: '#fff', strokeWidth: 2 },
    xaxis: {
      categories: MESES_NOME,
      title: {
        text: 'Mês',
        style: { color: HAPVIDA_PALETTE.slate500, fontWeight: 600, fontSize: '11px' }
      },
      labels: {
        rotate: -30,
        style: { fontSize: '11px', fontWeight: 600, colors: HAPVIDA_PALETTE.slate500 }
      },
      axisBorder: { color: HAPVIDA_PALETTE.slate200 },
      axisTicks: { color: HAPVIDA_PALETTE.slate200 }
    },
    yaxis: {
      min: 0,
      title: {
        text: 'ABS %',
        style: { color: HAPVIDA_PALETTE.slate500, fontWeight: 600, fontSize: '11px' }
      },
      labels: {
        formatter: (v) => `${Number(v).toFixed(0)}%`,
        style: { colors: HAPVIDA_PALETTE.slate500, fontSize: '11px' }
      }
    },
    tooltip: {
      y: { formatter: (v) => (v == null ? '—' : formatPct(v)) }
    }
  }), [])

  const nomesRows = useMemo(
    () => (frequenciaNomes || []).map((r, i) => ({
      ...r,
      rowKey: `${r.data}-${r.matricula}-${r.Frequencia}-${i}`
    })),
    [frequenciaNomes]
  )

  const hasNomesFilters = Boolean(
    frequenciaNomesQ || frequenciaNomesGestao || frequenciaNomesSegmento ||
    frequenciaNomesSupervisor || frequenciaNomesCoordenador
  )

  const onNomeSearch = (value) => {
    setNomeFilter(value || '')
    if (searchTimer) clearTimeout(searchTimer)
    setSearchTimer(setTimeout(() => setFrequenciaNomesQ(value), 400))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, mb: 3 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 0.75, color: 'grey.600', fontWeight: 600, letterSpacing: 0.4 }}
          >
            Ano
          </Typography>
          <ToggleButtonGroup
            className="year-toggle"
            exclusive
            size="small"
            value={frequenciaYear}
            onChange={(_, v) => v && setFrequenciaYear(v)}
            sx={{
              bgcolor: '#f1f5f9',
              borderRadius: '10px',
              p: '3px',
              gap: 0.5,
              border: '1px solid #e2e8f0',
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                borderRadius: '8px !important',
                mx: 0
              }
            }}
          >
            {yearOptions.map(y => (
              <ToggleButton
                key={y}
                value={y}
                sx={{
                  textTransform: 'none',
                  px: 2.25,
                  py: 0.75,
                  minWidth: 72,
                  fontFamily: 'Outfit, Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#64748b',
                  bgcolor: 'transparent',
                  transition: 'background-color .15s ease, color .15s ease, box-shadow .15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(30, 136, 229, 0.08)',
                    color: '#0f172a'
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    boxShadow: '0 1px 3px rgba(13, 71, 161, 0.35)',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      color: '#fff'
                    }
                  }
                }}
              >
                {y}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Typography variant="caption" color="grey.600" sx={{ pb: 0.5 }}>
          Fonte: <strong>fatos_frequencia</strong> · Optimus{periodoLabel ? ` · ${periodoLabel}` : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 3 }}>
        <KpiCard
          label="Pessoas"
          value={formatMilhar(kpis.pessoas)}
          Icon={GroupsIcon}
          iconColor={HAPVIDA_PALETTE.bluePrimary}
          iconBg="#EFF6FF"
          badgeText="Quadro no período"
          badgeBg="#EFF6FF"
          badgeColor="#1D4ED8"
          badgeBorder="#DBEAFE"
          tip="Colaboradores distintos (matrícula) no período"
        />
        <KpiCard
          label="ABS % Médio"
          value={formatPct(kpis.abs_pct)}
          Icon={PercentIcon}
          iconColor={HAPVIDA_PALETTE.orange}
          iconBg="#FFF7ED"
          badgeText="Taxa consolidada"
          badgeBg="#FFF7ED"
          badgeColor="#C2410C"
          badgeBorder="#FFEDD5"
          tip="Taxa diária do período: (dias de absenteísmo ÷ dias escalados) × 100"
        />
        <KpiCard
          label="Melhor Mês"
          value={melhor ? `${melhor.label} (${formatPct(melhor.abs_pct)})` : '—'}
          Icon={TrendingDownIcon}
          iconColor={HAPVIDA_PALETTE.greenEmerald}
          iconBg="#ECFDF5"
          badgeText="Menor índice"
          badgeBg="#ECFDF5"
          badgeColor="#047857"
          badgeBorder="#A7F3D0"
          tip="Mês com menor ABS % (taxa diária) no período"
        />
        <KpiCard
          label="Pior Mês"
          value={pior ? `${pior.label} (${formatPct(pior.abs_pct)})` : '—'}
          Icon={TrendingUpIcon}
          iconColor={HAPVIDA_PALETTE.redCoral}
          iconBg="#FEF2F2"
          badgeText="Maior índice"
          badgeBg="#FEF2F2"
          badgeColor="#B91C1C"
          badgeBorder="#FECACA"
          tip="Mês com maior ABS % (taxa diária) no período"
        />
      </Box>

      <SectionCard title={`ABS Mensal — ${frequenciaYear || ''}`} sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          {monthlyTableRows.length > 0 ? (
            <Chart type="line" height={350} options={monthlyChartOptions} series={monthlyChartSeries} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, color: 'grey.600' }}>
              {loading ? 'Carregando gráfico...' : 'Sem dados mensais para o período.'}
            </Box>
          )}
        </Box>
      </SectionCard>

      <SectionCard title="Comparativo ABS % entre anos" sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          {compareChartSeries.length > 0 ? (
            <Chart type="line" height={300} options={compareChartOptions} series={compareChartSeries} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, color: 'grey.600' }}>Sem histórico multi-ano.</Box>
          )}
        </Box>
      </SectionCard>

      <SectionCard
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Histórico diário com nomes</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Um registro por pessoa/dia{periodoLabel ? ` · ${periodoLabel}` : ''}
              </Typography>
            </Box>
            <Chip label={`${formatMilhar(frequenciaNomesTotal)} registros`} size="small" sx={{ ml: 'auto', bgcolor: 'white', color: 'primary.main', fontWeight: 700 }} />
          </Box>
        }
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={frequenciaNomesTipo}
              onChange={(_, v) => v && setFrequenciaNomesTipo(v)}
            >
              {TIPO_OPTIONS.map(o => (
                <ToggleButton key={o.value} value={o.value} sx={{ textTransform: 'none' }}>{o.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField
              size="small"
              value={nomeFilter}
              onChange={(e) => onNomeSearch(e.target.value)}
              placeholder="Buscar nome, segmento ou frequência..."
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{ endAdornment: <SearchIcon fontSize="small" color="action" /> }}
            />
            {hasNomesFilters && (
              <Button startIcon={<FilterAltOffIcon />} onClick={() => { setNomeFilter(''); clearFrequenciaNomesFilters() }} sx={{ textTransform: 'none' }}>
                Limpar filtros
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1 }}>
            <TextField
              select
              size="small"
              label="Ano"
              value={frequenciaYear || ''}
              onChange={(e) => setFrequenciaYear(Number(e.target.value))}
              SelectProps={{ native: true }}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Mês"
              value={frequenciaMonth || ''}
              onChange={(e) => setFrequenciaMonth(e.target.value === '' ? null : Number(e.target.value))}
              SelectProps={{ native: true }}
            >
              <option value="">Todos</option>
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </TextField>
            {[
              { label: 'Gestão', key: 'gestao', value: frequenciaNomesGestao, options: frequenciaNomesFiltros.gestoes },
              { label: 'Segmento', key: 'segmento', value: frequenciaNomesSegmento, options: frequenciaNomesFiltros.segmentos },
              { label: 'Coordenador', key: 'coordenador', value: frequenciaNomesCoordenador, options: frequenciaNomesFiltros.coordenadores },
              { label: 'Supervisor', key: 'supervisor', value: frequenciaNomesSupervisor, options: frequenciaNomesFiltros.supervisores }
            ].map(f => (
              <Autocomplete
                key={f.key}
                size="small"
                options={f.options || []}
                value={f.value}
                onChange={(_, v) => setFrequenciaNomesFilters({ [f.key]: v || null })}
                renderInput={(params) => <TextField {...params} label={f.label} />}
              />
            ))}
          </Box>
        </Box>

        <DataTable
          columns={NOMES_COLUMNS}
          rows={nomesRows}
          rowKey="rowKey"
          loading={frequenciaNomesLoading}
          defaultRowsPerPage={20}
          renderCell={(col, row, raw) => {
            if (col.field === 'data') return <Box component="span" sx={{ fontWeight: 500 }}>{formatDateBr(row.data)}</Box>
            if (col.field === 'Frequencia') {
              return <Chip size="small" color={freqChipColor(row.Frequencia, row.absenteismo)} label={row.Frequencia} />
            }
            return raw ?? ''
          }}
        />
        {frequenciaNomesTotal > nomesRows.length && (
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Button size="small" disabled={frequenciaNomesPage <= 1} onClick={() => setFrequenciaNomesPage(frequenciaNomesPage - 1)}>Anterior</Button>
            <Typography variant="caption" sx={{ alignSelf: 'center' }}>
              Página {frequenciaNomesPage} · {formatMilhar(frequenciaNomesTotal)} total
            </Typography>
            <Button size="small" onClick={() => setFrequenciaNomesPage(frequenciaNomesPage + 1)}>Próxima</Button>
          </Box>
        )}
      </SectionCard>
    </Box>
  )
}
