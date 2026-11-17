import { useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Button, Chip } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import KpiCards from '../components/KpiCards'
import { DataTable, SectionCard } from '../components/DataTable'
import { MatchShorterPair } from '../components/MatchShorterPair'
import OperatorsDetailSection from '../components/OperatorsDetailSection'
import SkeletonCard from '../components/ui/SkeletonCard'
import { renderResumoCell, renderSituacaoCell } from '../components/TableCells'
import { useDashboardStore } from '../stores/dashboard'
import { exportMultipleTables } from '../utils/export'
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
import { SITUACAO_COLUMNS } from '../utils/format'

const resumoColumns = [
  { field: 'Segmento', label: 'Coord. Operação', align: 'left' },
  { field: 'Total', label: 'Total', align: 'right', numeric: true },
  { field: 'Previstos', label: 'Previstos', align: 'right', numeric: true },
  { field: 'Escalados', label: 'Escalados', align: 'right', numeric: true },
  { field: 'Faltas', label: 'Faltas', align: 'right', numeric: true },
  { field: 'ABS', label: 'ABS%', align: 'right', numeric: true }
]

const situacaoAlignedColumns = SITUACAO_COLUMNS.map((c) =>
  c.field === 'Situação' ? { ...c, align: 'left' } : { ...c, align: 'right', numeric: true }
)

export default function CoordinatorPage() {
  const loading = useDashboardStore(s => s.loading)
  const data = useDashboardStore(s => s.coordenadorData)
  const [selectedCoord, setSelectedCoord] = useState(null)

  const resumoRows = data.resumoSegmento || []
  const situacoesRows = data.situacoes || []
  const operadores = data.operadores || []

  const operadoresFiltered = useMemo(() => {
    if (!selectedCoord) return operadores
    return operadores.filter(op =>
      (op.nome_coordenador_op || '').trim().toLowerCase() === selectedCoord.trim().toLowerCase()
    )
  }, [selectedCoord, operadores])

  const coordChartData = useMemo(() => {
    const validRows = resumoRows.filter(
      r => r.Segmento && !String(r.Segmento).toUpperCase().includes('TOTAL')
    )
    const sorted = [...validRows].sort((a, b) => Number(b.Escalados || 0) - Number(a.Escalados || 0))

    return {
      categories: sorted.map(r => r.Segmento),
      presentes: sorted.map(r => Math.max(0, Number(r.Escalados || 0) - Number(r.Faltas || 0))),
      faltas: sorted.map(r => Number(r.Faltas || 0)),
      escalados: sorted.map(r => Number(r.Escalados || 0)),
      abs: sorted.map(r => Number(r.ABS || 0))
    }
  }, [resumoRows])

  const coordChartSeries = useMemo(() => [
    { name: 'Presentes', type: 'column', data: coordChartData.presentes },
    { name: 'Faltas', type: 'column', data: coordChartData.faltas },
    { name: 'ABS %', type: 'line', data: coordChartData.abs }
  ], [coordChartData])

  const coordChartOptions = useMemo(() => {
    const maxAbs = coordChartData.abs.length > 0 ? Math.max(...coordChartData.abs) : 10
    return {
      ...baseChartOptions,
      chart: {
        ...baseChartOptions.chart,
        height: 360,
        type: 'line',
        stacked: true,
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            const idx = config.dataPointIndex
            const clickedCoord = coordChartData.categories[idx]
            if (clickedCoord) {
              setSelectedCoord(prev => (prev === clickedCoord ? null : clickedCoord))
            }
          }
        }
      },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      colors: [
        ({ dataPointIndex }) =>
          getInteractiveBarColor(HAPVIDA_PALETTE.bluePrimary, coordChartData.categories, selectedCoord, dataPointIndex),
        ({ dataPointIndex }) =>
          getInteractiveBarColor(HAPVIDA_PALETTE.redCoral, coordChartData.categories, selectedCoord, dataPointIndex),
        HAPVIDA_PALETTE.orange
      ],
      annotations: buildAbsTargetAnnotation(5, 1),
      plotOptions: {
        bar: {
          columnWidth: '42%',
          borderRadius: 4,
          borderRadiusApplication: 'end'
        }
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [2],
        formatter: (val) => `${Number(val).toFixed(1)}%`,
        style: chartDataLabelStyle,
        background: chartDataLabelBg
      },
      xaxis: {
        categories: coordChartData.categories,
        labels: {
          rotate: -20,
          rotateAlways: coordChartData.categories.length > 3,
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
          const coordName = coordChartData.categories[dataPointIndex] || ''
          const pres = series[0]?.[dataPointIndex] ?? 0
          const falt = series[1]?.[dataPointIndex] ?? 0
          const esc = pres + falt
          const abs = series[2]?.[dataPointIndex] ?? 0

          return buildCustomTooltip({
            headerTitle: `Coord. Operação: ${coordName}`,
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
  }, [coordChartData, selectedCoord])

  return (
    <div>
      <KpiCards kpis={data.kpis || {}} loading={loading} />

      {loading && coordChartData.categories.length === 0 ? (
        <SkeletonCard
          variant="chart"
          showHeader
          heightClass="h-80"
          ariaLabel="Carregando gráfico de performance por coordenação de operação"
        />
      ) : coordChartData.categories.length > 0 && (
        <SectionCard
          title="Performance de ABS e Presença por Coord. Operação"
          subtitle="Clique na barra de qualquer coordenação para filtrar os operadores na tabela abaixo"
          loading={loading}
          action={
            selectedCoord && (
              <Chip
                color="primary"
                variant="outlined"
                size="small"
                label={`Filtro: ${selectedCoord}`}
                onDelete={() => setSelectedCoord(null)}
                deleteIcon={<FilterAltOffIcon />}
                sx={{ fontWeight: 600 }}
              />
            )
          }
        >
          <div className="p-4">
            <Chart type="line" height={360} options={coordChartOptions} series={coordChartSeries} />
          </div>
        </SectionCard>
      )}

      <MatchShorterPair
        deps={[resumoRows, situacoesRows, loading]}
        leftTitle="Resumo por Coord. Operação"
        rightTitle="Situações"
        rightAction={
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            disabled={!resumoRows.length && !situacoesRows.length}
            onClick={() => exportMultipleTables([
              { title: 'Resumo por Coord. Operação', rows: resumoRows, columns: resumoColumns },
              { title: 'Situações', rows: situacoesRows, columns: situacaoAlignedColumns }
            ], 'resumo_coordenador_op.csv')}
          >
            Exportar CSV
          </Button>
        }
        left={
          <DataTable
            columns={resumoColumns}
            rows={resumoRows}
            rowKey="Segmento"
            loading={loading}
            hidePagination
            renderCell={(col, row, raw) => renderResumoCell(col, row, raw, { useComma: true })}
          />
        }
        right={
          <DataTable
            columns={situacaoAlignedColumns}
            rows={situacoesRows}
            rowKey="Situação"
            loading={loading}
            hidePagination
            renderCell={renderSituacaoCell}
          />
        }
      />

      <OperatorsDetailSection
        operadores={operadoresFiltered}
        loading={loading}
        exportFilename="detalhamento_operadores_coordenador.csv"
        filterChipLabel={selectedCoord ? `Coordenação: ${selectedCoord}` : undefined}
        onClearFilterChip={selectedCoord ? () => setSelectedCoord(null) : undefined}
      />
    </div>
  )
}
