import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'react-apexcharts'
import {
  Autocomplete,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PercentIcon from '@mui/icons-material/Percent'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SearchIcon from '@mui/icons-material/Search'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useDashboardStore } from '../stores/dashboard'
import { DataTable, PillBadge, SectionCard } from '../components/DataTable'
import SkeletonCard from '../components/ui/SkeletonCard'
import { MetricCard, MetricGrid } from '../components/ui/MetricCard'
import {
  HAPVIDA_PALETTE,
  baseChartOptions,
  buildAbsTargetAnnotation,
  buildCustomTooltip,
  chartDataLabelBg,
  chartDataLabelStyle
} from '../utils/chartConfig'
import { COLORS, RADII, SHADOWS, TYPOGRAPHY, UI_CLASSES } from '../theme'
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
  { field: 'data', label: 'Data', mono: true, noWrap: true },
  { field: 'nome_operador', label: 'Operador', noWrap: true },
  { field: 'nome_supervisor', label: 'Supervisor', noWrap: true },
  { field: 'nome_coordenador', label: 'Coordenador', noWrap: true },
  { field: 'segmento', label: 'Segmento', noWrap: true },
  { field: 'Frequencia', label: 'Frequência', align: 'center' },
  { field: 'horario', label: 'Horário', align: 'center', mono: true, noWrap: true },
  { field: 'situacao', label: 'Situação' }
]

const FREQ_BADGE_VARIANT = {
  error: 'danger',
  warning: 'warning',
  success: 'success',
  default: 'neutral'
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
  const frequenciaNomesPage = useDashboardStore(s => s.frequenciaNomesPage)
  const frequenciaNomesPageSize = useDashboardStore(s => s.frequenciaNomesPageSize)
  const loading = useDashboardStore(s => s.loading)

  const fetchFrequenciaPageJobs = useDashboardStore(s => s.fetchFrequenciaPageJobs)
  const setFrequenciaYear = useDashboardStore(s => s.setFrequenciaYear)
  const setFrequenciaMonth = useDashboardStore(s => s.setFrequenciaMonth)
  const setFrequenciaNomesTipo = useDashboardStore(s => s.setFrequenciaNomesTipo)
  const setFrequenciaNomesQ = useDashboardStore(s => s.setFrequenciaNomesQ)
  const setFrequenciaNomesFilters = useDashboardStore(s => s.setFrequenciaNomesFilters)
  const clearFrequenciaNomesFilters = useDashboardStore(s => s.clearFrequenciaNomesFilters)
  const setFrequenciaNomesPage = useDashboardStore(s => s.setFrequenciaNomesPage)

  const [nomeFilter, setNomeFilter] = useState(frequenciaNomesQ || '')
  const searchTimerRef = useRef(null)

  useEffect(() => {
    fetchFrequenciaPageJobs()
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
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
  const kpisLoading = Boolean(loading && !kpis.pessoas)
  const meses = useMemo(() => frequenciaData?.meses || [], [frequenciaData])
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
      annotations: buildAbsTargetAnnotation(5, 1),
      plotOptions: { bar: { columnWidth: '40%', borderRadius: 4, borderRadiusApplication: 'end' } },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [2],
        formatter: (val) => `${Number(val).toFixed(1)}%`,
        style: chartDataLabelStyle,
        background: chartDataLabelBg
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
            fontFamily: TYPOGRAPHY.fonts.sans,
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
        custom: ({ series, dataPointIndex }) => {
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

  const historicoSeries = useMemo(() => frequenciaHistorico?.series || [], [frequenciaHistorico])
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
    annotations: buildAbsTargetAnnotation(5, 0),
    markers: { size: 4, strokeColors: COLORS.surface.card, strokeWidth: 2 },
    xaxis: {
      categories: MESES_NOME,
      title: {
        text: 'Mês',
        style: { color: HAPVIDA_PALETTE.slate500, fontWeight: 600, fontSize: '11px' }
      },
      labels: {
        rotate: -30,
        style: {
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: TYPOGRAPHY.fonts.sans,
          colors: HAPVIDA_PALETTE.slate500
        }
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
      shared: true,
      custom: ({ series, dataPointIndex, w }) => {
        const mesNome = MESES_NOME[dataPointIndex] || ''
        const items = (w.globals.seriesNames || [])
          .map((yearLabel, idx) => {
            const val = series[idx]?.[dataPointIndex]
            if (val == null) return null
            return {
              color: YEAR_COLORS[idx % YEAR_COLORS.length],
              label: `Ano ${yearLabel}`,
              value: formatPct(val)
            }
          })
          .filter(Boolean)

        return buildCustomTooltip({
          headerTitle: `Comparativo · ${mesNome}`,
          items
        })
      }
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
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setFrequenciaNomesQ(value), 400)
  }

  const pageSize = frequenciaNomesPageSize || 50
  const totalPages = Math.max(1, Math.ceil((frequenciaNomesTotal || 0) / pageSize))
  const hasNextPage = frequenciaNomesPage < totalPages

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="block mb-2 text-slate-600 font-semibold text-xs">
            Ano de referência
          </span>
          <ToggleButtonGroup
            className="year-toggle"
            exclusive
            size="small"
            value={frequenciaYear}
            onChange={(_, v) => v && setFrequenciaYear(v)}
            sx={{
              bgcolor: COLORS.surface.subtle,
              borderRadius: `${RADII.card}px`,
              p: '3px',
              gap: 0.5,
              border: `1px solid ${COLORS.border.hairline}`,
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                borderRadius: `${RADII.control}px !important`,
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
                  minHeight: 36,
                  fontFamily: TYPOGRAPHY.fonts.display,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  fontSize: TYPOGRAPHY.scale.md,
                  color: COLORS.text.muted,
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(11, 79, 156, 0.08)',
                    color: COLORS.text.primary
                  },
                  '&.Mui-selected': {
                    bgcolor: COLORS.brand.navy,
                    color: COLORS.text.inverse,
                    boxShadow: SHADOWS.card,
                    '&:hover': {
                      bgcolor: COLORS.brand.blue,
                      color: COLORS.text.inverse
                    }
                  }
                }}
              >
                {y}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <span className="text-xs text-slate-600 pb-1 tabular-nums">
          Fonte: <strong>fatos_frequencia</strong> · Optimus{periodoLabel ? ` · ${periodoLabel}` : ''}
        </span>
      </div>

      <MetricGrid>
        <MetricCard
          variant="simple"
          title="Pessoas"
          value={formatMilhar(kpis.pessoas)}
          Icon={GroupsOutlinedIcon}
          tone="blue"
          metaText="Quadro distinto no período"
          tip="Colaboradores distintos (matrícula) no período selecionado."
          loading={kpisLoading}
        />
        <MetricCard
          variant="progress"
          title="ABS % Médio"
          value={formatPct(kpis.abs_pct)}
          Icon={PercentIcon}
          tone="brandOrange"
          featured
          progress={{
            pct: Math.min(100, Math.max(4, (Number(kpis.abs_pct || 0) / 15) * 100)),
            barClass:
              Number(kpis.abs_pct || 0) <= 5
                ? 'bg-emerald-500'
                : Number(kpis.abs_pct || 0) <= 10
                  ? 'bg-amber-500'
                  : 'bg-red-500'
          }}
          metaText="Taxa diária consolidada (meta ≤ 5,0%)"
          metaClass={
            Number(kpis.abs_pct || 0) <= 5
              ? 'text-emerald-800'
              : Number(kpis.abs_pct || 0) <= 10
                ? 'text-amber-800'
                : 'text-red-800'
          }
          tip="Taxa diária do período: (dias de absenteísmo ÷ dias escalados) × 100."
          loading={kpisLoading}
        />
        <MetricCard
          variant="trend"
          title="Melhor Mês"
          value={melhor ? `${melhor.label} (${formatPct(melhor.abs_pct)})` : '—'}
          Icon={TrendingDownIcon}
          tone="green"
          trend={{
            direction: 'down',
            tone: 'good',
            label: 'Menor índice no período'
          }}
          tip="Mês com menor ABS % (taxa diária) no período selecionado."
          loading={kpisLoading}
        />
        <MetricCard
          variant="trend"
          title="Pior Mês"
          value={pior ? `${pior.label} (${formatPct(pior.abs_pct)})` : '—'}
          Icon={TrendingUpIcon}
          tone="red"
          trend={{
            direction: 'up',
            tone: 'bad',
            label: 'Maior índice no período'
          }}
          tip="Mês com maior ABS % (taxa diária) no período selecionado."
          loading={kpisLoading}
        />
      </MetricGrid>

      <SectionCard
        title={`ABS Mensal — ${frequenciaYear || ''}`}
        subtitle="Volume de colaboradores escalados vs. ocorrências de absenteísmo e taxa mensal (%)"
        loading={Boolean(loading && monthlyTableRows.length > 0)}
      >
        <div className="p-4">
          {loading && monthlyTableRows.length === 0 ? (
            <SkeletonCard
              variant="chart"
              inline
              heightClass="h-80"
              ariaLabel="Carregando gráfico de ABS mensal"
            />
          ) : monthlyTableRows.length > 0 ? (
            <Chart type="line" height={350} options={monthlyChartOptions} series={monthlyChartSeries} />
          ) : (
            <div className={UI_CLASSES.emptyState}>
              Sem dados mensais para o período selecionado.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Comparativo ABS % entre anos"
        subtitle="Evolução sazonal mês a mês por exercício"
        loading={Boolean(loading && compareChartSeries.length > 0)}
      >
        <div className="p-4">
          {loading && compareChartSeries.length === 0 ? (
            <SkeletonCard
              variant="chart"
              inline
              heightClass="h-72"
              ariaLabel="Carregando comparativo anual de ABS"
            />
          ) : compareChartSeries.length > 0 ? (
            <Chart type="line" height={300} options={compareChartOptions} series={compareChartSeries} />
          ) : (
            <div className={UI_CLASSES.emptyState}>
              Sem histórico multi-ano disponível.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Histórico diário com nomes"
        subtitle={`Um registro por pessoa/dia${periodoLabel ? ` · ${periodoLabel}` : ''}`}
        loading={frequenciaNomesLoading}
        action={
          <PillBadge variant="info">
            {formatMilhar(frequenciaNomesTotal)} registros
          </PillBadge>
        }
      >
        <div className="p-4 flex flex-col gap-3 border-b border-slate-100">
          <div className="flex flex-wrap gap-3 items-center">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={frequenciaNomesTipo}
              onChange={(_, v) => v && setFrequenciaNomesTipo(v)}
              sx={{
                bgcolor: COLORS.surface.subtle,
                borderRadius: `${RADII.control}px`,
                p: '3px',
                gap: 0.5,
                border: `1px solid ${COLORS.border.hairline}`,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                  borderRadius: `${RADII.badge}px !important`,
                  mx: 0
                }
              }}
            >
              {TIPO_OPTIONS.map(o => (
                <ToggleButton
                  key={o.value}
                  value={o.value}
                  sx={{
                    textTransform: 'none',
                    px: 1.5,
                    minHeight: 34,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: COLORS.text.muted,
                    whiteSpace: 'nowrap',
                    '&.Mui-selected': {
                      bgcolor: COLORS.surface.card,
                      color: COLORS.brand.navy,
                      boxShadow: SHADOWS.card,
                      '&:hover': { bgcolor: COLORS.surface.card }
                    }
                  }}
                >
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              size="small"
              value={nomeFilter}
              onChange={(e) => onNomeSearch(e.target.value)}
              placeholder="Buscar nome, segmento ou frequência..."
              sx={{ flex: 1, minWidth: 230 }}
              slotProps={{
                input: {
                  endAdornment: <SearchIcon fontSize="small" className="text-slate-500" />
                }
              }}
            />

            {hasNomesFilters && (
              <Button
                variant="outlined"
                startIcon={<FilterAltOffIcon />}
                onClick={() => { setNomeFilter(''); clearFrequenciaNomesFilters() }}
                sx={{ minHeight: 40 }}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
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
          </div>
        </div>

        <DataTable
          columns={NOMES_COLUMNS}
          rows={nomesRows}
          rowKey="rowKey"
          loading={frequenciaNomesLoading}
          hidePagination
          densityToggle
          renderCell={(col, row, raw) => {
            if (col.field === 'data') {
              return <span className="font-medium text-slate-700">{formatDateBr(row.data)}</span>
            }
            if (col.field === 'Frequencia') {
              const chipTone = freqChipColor(row.Frequencia, row.absenteismo)
              const variant = FREQ_BADGE_VARIANT[chipTone] || 'neutral'
              return <PillBadge variant={variant}>{row.Frequencia || '-'}</PillBadge>
            }
            return raw ?? '-'
          }}
        />
        {frequenciaNomesTotal > 0 && (
          <div className="px-4 py-3 flex justify-between items-center flex-wrap gap-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-600 tabular-nums">
              Página <strong>{frequenciaNomesPage}</strong> de <strong>{totalPages}</strong> · {formatMilhar(frequenciaNomesTotal)} registros no período
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                variant="outlined"
                startIcon={<NavigateBeforeIcon fontSize="small" />}
                disabled={frequenciaNomesPage <= 1 || frequenciaNomesLoading}
                onClick={() => setFrequenciaNomesPage(frequenciaNomesPage - 1)}
              >
                Anterior
              </Button>
              <Button
                size="small"
                variant="outlined"
                endIcon={<NavigateNextIcon fontSize="small" />}
                disabled={!hasNextPage || frequenciaNomesLoading}
                onClick={() => setFrequenciaNomesPage(frequenciaNomesPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
