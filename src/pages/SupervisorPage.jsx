import { useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Button, Chip } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import KpiCards from '../components/KpiCards'
import { DataTable, SectionCard } from '../components/DataTable'
import OperatorsDetailSection from '../components/OperatorsDetailSection'
import SkeletonCard from '../components/ui/SkeletonCard'
import { renderResumoCell } from '../components/TableCells'
import { useDashboardStore } from '../stores/dashboard'
import { exportTable } from '../utils/export'
import {
  HAPVIDA_PALETTE,
  baseChartOptions,
  buildAbsTargetAnnotation,
  buildCustomTooltip,
  chartDataLabelBg,
  chartDataLabelStyle,
  getInteractiveBarColor
} from '../utils/chartConfig'
import { TYPOGRAPHY } from '../theme'

const resumoColumns = [
  { field: 'Supervisor', label: 'Supervisor', align: 'left' },
  { field: 'Previstos', label: 'Previstos', align: 'right', numeric: true },
  { field: 'Escalados', label: 'Escalados', align: 'right', numeric: true },
  { field: 'Faltas', label: 'Faltas', align: 'right', numeric: true },
  { field: 'Presentes', label: 'Presentes', align: 'right', numeric: true },
  { field: 'ABS', label: 'ABS%', align: 'right', numeric: true }
]

export default function SupervisorPage() {
  const loading = useDashboardStore(s => s.loading)
  const data = useDashboardStore(s => s.supervisorData)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [chartViewMode, setChartViewMode] = useState('topAbs')

  const resumoSupervisor = data.resumoSupervisor || []
  const operadores = data.operadores || []

  const operadoresFiltered = useMemo(() => {
    if (!selectedSupervisor) return operadores
    return operadores.filter(op =>
      (op.nome_supervisor || '').trim().toLowerCase() === selectedSupervisor.trim().toLowerCase()
    )
  }, [selectedSupervisor, operadores])

  const supervisorChartData = useMemo(() => {
    let validRows = resumoSupervisor.filter(
      r => r.Supervisor && !String(r.Supervisor).toUpperCase().includes('TOTAL')
    )

    if (chartViewMode === 'topAbs') {
      validRows = validRows
        .filter(r => Number(r.Faltas || 0) > 0 || Number(r.ABS || 0) > 0)
        .sort((a, b) => Number(b.ABS || 0) - Number(a.ABS || 0))
        .slice(0, 12)
    } else if (chartViewMode === 'topVolume') {
      validRows = [...validRows]
        .sort((a, b) => Number(b.Escalados || 0) - Number(a.Escalados || 0))
        .slice(0, 12)
    } else {
      validRows = validRows
        .filter(r => Number(r.Faltas || 0) > 0)
        .sort((a, b) => Number(b.ABS || 0) - Number(a.ABS || 0))
        .slice(0, 20)
    }

    return {
      categories: validRows.map(r => r.Supervisor),
      presentes: validRows.map(r => Number(r.Presentes || 0)),
      faltas: validRows.map(r => Number(r.Faltas || 0)),
      escalados: validRows.map(r => Number(r.Escalados || 0)),
      abs: validRows.map(r => Number(r.ABS || 0))
    }
  }, [resumoSupervisor, chartViewMode])

  const supervisorChartSeries = useMemo(() => [
    { name: 'Presentes', type: 'column', data: supervisorChartData.presentes },
    { name: 'Faltas', type: 'column', data: supervisorChartData.faltas },
    { name: 'ABS %', type: 'line', data: supervisorChartData.abs }
  ], [supervisorChartData])

  const supervisorChartOptions = useMemo(() => {
    const maxAbs = supervisorChartData.abs.length > 0 ? Math.max(...supervisorChartData.abs) : 10
    return {
      ...baseChartOptions,
      chart: {
        ...baseChartOptions.chart,
        height: 380,
        type: 'line',
        stacked: true,
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            const idx = config.dataPointIndex
            const clickedSup = supervisorChartData.categories[idx]
            if (clickedSup) {
              setSelectedSupervisor(prev => (prev === clickedSup ? null : clickedSup))
            }
          }
        }
      },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      colors: [
        ({ dataPointIndex }) =>
          getInteractiveBarColor(HAPVIDA_PALETTE.bluePrimary, supervisorChartData.categories, selectedSupervisor, dataPointIndex),
        ({ dataPointIndex }) =>
          getInteractiveBarColor(HAPVIDA_PALETTE.redCoral, supervisorChartData.categories, selectedSupervisor, dataPointIndex),
        HAPVIDA_PALETTE.orange
      ],
      annotations: buildAbsTargetAnnotation(5, 1),
      plotOptions: {
        bar: {
          columnWidth: supervisorChartData.categories.length <= 12 ? '38%' : '50%',
          borderRadius: 6,
          borderRadiusApplication: 'end'
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: supervisorChartData.categories,
        labels: {
          rotate: -25,
          rotateAlways: supervisorChartData.categories.length > 4,
          trim: true,
          maxHeight: 85,
          formatter: (val) => {
            if (!val) return ''
            return val.length > 18 ? `${val.slice(0, 16)}…` : val
          },
          style: {
            fontSize: '11px',
            fontFamily: TYPOGRAPHY.fonts.sans,
            fontWeight: 600,
            colors: HAPVIDA_PALETTE.slate500
          }
        },
        axisBorder: { color: HAPVIDA_PALETTE.slate200 },
        axisTicks: { color: HAPVIDA_PALETTE.slate200 }
      },
      yaxis: [
        {
          title: {
            text: 'Colaboradores',
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
          const supName = supervisorChartData.categories[dataPointIndex] || ''
          const pres = series[0]?.[dataPointIndex] ?? 0
          const falt = series[1]?.[dataPointIndex] ?? 0
          const esc = pres + falt
          const abs = series[2]?.[dataPointIndex] ?? 0

          return buildCustomTooltip({
            headerTitle: `Supervisor: ${supName}`,
            items: [
              { color: HAPVIDA_PALETTE.blueNavy, label: 'Escalados', value: esc.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.bluePrimary, label: 'Presentes', value: pres.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.redCoral, label: 'Faltas', value: falt.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.orange, label: 'Taxa ABS', value: `${Number(abs).toFixed(1)}%` }
            ]
          })
        }
      }
    }
  }, [supervisorChartData, selectedSupervisor])

  return (
    <div>
      <KpiCards kpis={data.kpis || {}} loading={loading} />

      {loading && supervisorChartData.categories.length === 0 ? (
        <SkeletonCard
          variant="chart"
          showHeader
          heightClass="h-80"
          ariaLabel="Carregando gráfico de performance por supervisor"
        />
      ) : supervisorChartData.categories.length > 0 && (
        <SectionCard
          title="Performance de ABS e Presença por Supervisor"
          subtitle="Clique na barra de qualquer supervisor para filtrar a lista detalhada de operadores"
          loading={loading}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setChartViewMode('topAbs')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartViewMode === 'topAbs'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Top 12 Ofensores
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('topVolume')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartViewMode === 'topVolume'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Top 12 Equipes
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('allFaltas')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartViewMode === 'allFaltas'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Com Faltas
                </button>
              </div>

              {selectedSupervisor && (
                <Chip
                  color="primary"
                  variant="outlined"
                  size="small"
                  label={`Filtro: ${selectedSupervisor}`}
                  onDelete={() => setSelectedSupervisor(null)}
                  deleteIcon={<FilterAltOffIcon />}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </div>
          }
        >
          <div className="p-4">
            <Chart type="line" height={380} options={supervisorChartOptions} series={supervisorChartSeries} />
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Resumo por Supervisor"
        subtitle={`${resumoSupervisor.length.toLocaleString('pt-BR')} supervisão(ões)`}
        loading={loading}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            disabled={!resumoSupervisor.length}
            onClick={() => exportTable(resumoSupervisor, resumoColumns, 'resumo_supervisor.csv')}
          >
            Exportar CSV
          </Button>
        }
      >
        <DataTable
          columns={resumoColumns}
          rows={resumoSupervisor}
          rowKey="Supervisor"
          loading={loading}
          searchable
          searchPlaceholder="Filtrar supervisor..."
          renderCell={(col, row, raw) => renderResumoCell(col, row, raw, { useComma: true })}
        />
      </SectionCard>

      <OperatorsDetailSection
        operadores={operadoresFiltered}
        loading={loading}
        exportFilename="detalhamento_operadores_supervisor.csv"
        searchPlaceholder="Buscar colaborador ou matrícula..."
        filterChipLabel={selectedSupervisor ? `Supervisor: ${selectedSupervisor}` : undefined}
        onClearFilterChip={selectedSupervisor ? () => setSelectedSupervisor(null) : undefined}
      />
    </div>
  )
}
