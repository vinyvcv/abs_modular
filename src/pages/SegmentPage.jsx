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
import { exportMultipleTables, exportTable } from '../utils/export'
import {
  HAPVIDA_PALETTE,
  baseChartOptions,
  buildAbsTargetAnnotation,
  buildCustomTooltip,
  chartDataLabelBg,
  chartDataLabelStyle,
  getInteractiveBarColor
} from '../utils/chartConfig'
import { TYPOGRAPHY, UI_CLASSES } from '../theme'
import { SITUACAO_COLUMNS } from '../utils/format'

const resumoColumns = [
  { field: 'Segmento', label: 'Segmento', align: 'left' },
  { field: 'Total', label: 'Total', align: 'right', numeric: true },
  { field: 'Previstos', label: 'Previstos', align: 'right', numeric: true },
  { field: 'Escalados', label: 'Escalados', align: 'right', numeric: true },
  { field: 'Faltas', label: 'Faltas', align: 'right', numeric: true },
  { field: 'ABS', label: 'ABS%', align: 'right', numeric: true }
]

const situacaoAlignedColumns = SITUACAO_COLUMNS.map((c) =>
  c.field === 'Situação' ? { ...c, align: 'left' } : { ...c, align: 'right', numeric: true }
)

const intraHoraColumns = [
  { field: 'Hora', label: 'Hora', align: 'center', mono: true },
  { field: 'Escalados', label: 'Escalados', align: 'right', numeric: true },
  { field: 'Faltas', label: 'Faltas', align: 'right', numeric: true },
  { field: 'ABS', label: 'ABS%', align: 'right', numeric: true }
]

export default function SegmentPage() {
  const loading = useDashboardStore(s => s.loading)
  const geralData = useDashboardStore(s => s.geralData)
  const [selectedSegment, setSelectedSegment] = useState(null)

  const kpis = geralData.kpis || {}
  const resumoRows = geralData.resumoSegmento || []
  const situacoesRows = geralData.situacoes || []
  const intraHoraRows = geralData.intraHora || []
  const operadores = geralData.operadores || []

  const operadoresFiltered = useMemo(() => {
    if (!selectedSegment) return operadores
    return operadores.filter(
      op => (op.segmento || '').trim().toLowerCase() === selectedSegment.trim().toLowerCase()
    )
  }, [selectedSegment, operadores])

  const segmentChartData = useMemo(() => {
    const validRows = resumoRows.filter(r => r.Segmento && r.Segmento !== 'TOTAL GERAL')
    return {
      categories: validRows.map(r => r.Segmento),
      presentes: validRows.map(r => Math.max(0, Number(r.Escalados || 0) - Number(r.Faltas || 0))),
      faltas: validRows.map(r => Number(r.Faltas || 0)),
      escalados: validRows.map(r => Number(r.Escalados || 0)),
      abs: validRows.map(r => Number(r.ABS || 0))
    }
  }, [resumoRows])

  const segmentChartSeries = useMemo(() => [
    { name: 'Presentes', type: 'column', data: segmentChartData.presentes },
    { name: 'Faltas', type: 'column', data: segmentChartData.faltas },
    { name: 'ABS %', type: 'line', data: segmentChartData.abs }
  ], [segmentChartData])

  const segmentChartOptions = useMemo(() => {
    const maxAbs = segmentChartData.abs.length > 0 ? Math.max(...segmentChartData.abs) : 10
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
            const clickedSeg = segmentChartData.categories[idx]
            if (clickedSeg) {
              setSelectedSegment(prev => (prev === clickedSeg ? null : clickedSeg))
            }
          }
        }
      },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      colors: [
        ({ dataPointIndex }) =>
          getInteractiveBarColor(HAPVIDA_PALETTE.bluePrimary, segmentChartData.categories, selectedSegment, dataPointIndex),
        ({ dataPointIndex }) =>
          getInteractiveBarColor(HAPVIDA_PALETTE.redCoral, segmentChartData.categories, selectedSegment, dataPointIndex),
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
        categories: segmentChartData.categories,
        labels: {
          rotate: -20,
          rotateAlways: segmentChartData.categories.length > 5,
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
          const segName = segmentChartData.categories[dataPointIndex] || ''
          const pres = series[0]?.[dataPointIndex] ?? 0
          const falt = series[1]?.[dataPointIndex] ?? 0
          const esc = pres + falt
          const abs = series[2]?.[dataPointIndex] ?? 0

          return buildCustomTooltip({
            headerTitle: `Segmento: ${segName}`,
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
  }, [segmentChartData, selectedSegment])

  const intraHoraChartSeries = useMemo(() => [
    { name: 'Escalados', type: 'column', data: intraHoraRows.map(r => r.Escalados) },
    { name: 'Faltas', type: 'column', data: intraHoraRows.map(r => r.Faltas) },
    { name: 'ABS%', type: 'line', data: intraHoraRows.map(r => r.ABS) }
  ], [intraHoraRows])

  const intraHoraChartOptions = useMemo(() => {
    const hours = intraHoraRows.map(r => r.Hora)
    const absValues = intraHoraRows.map(r => r.ABS)
    const maxAbs = absValues.length > 0 ? Math.max(...absValues) : 10

    return {
      ...baseChartOptions,
      chart: {
        ...baseChartOptions.chart,
        height: 340,
        type: 'line',
        stacked: true
      },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      colors: [HAPVIDA_PALETTE.blueNavy, HAPVIDA_PALETTE.redCoral, HAPVIDA_PALETTE.orange],
      annotations: buildAbsTargetAnnotation(5, 1),
      plotOptions: {
        bar: {
          columnWidth: '40%',
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
      labels: hours,
      xaxis: {
        type: 'category',
        title: {
          text: 'Faixa Horária (Entrada)',
          style: { color: HAPVIDA_PALETTE.slate500, fontWeight: 600, fontSize: '11px' }
        },
        labels: {
          style: {
            fontSize: '11px',
            fontFamily: TYPOGRAPHY.fonts.mono,
            colors: HAPVIDA_PALETTE.slate500
          }
        },
        axisBorder: { color: HAPVIDA_PALETTE.slate200 },
        axisTicks: { color: HAPVIDA_PALETTE.slate200 }
      },
      yaxis: [
        {
          title: {
            text: 'Agentes',
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
          const hora = hours[dataPointIndex] || ''
          const esc = series[0]?.[dataPointIndex] ?? 0
          const falt = series[1]?.[dataPointIndex] ?? 0
          const abs = series[2]?.[dataPointIndex] ?? 0

          return buildCustomTooltip({
            headerTitle: `Horário: ${hora}`,
            items: [
              { color: HAPVIDA_PALETTE.blueNavy, label: 'Escalados', value: esc.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.redCoral, label: 'Faltas', value: falt.toLocaleString('pt-BR') },
              { color: HAPVIDA_PALETTE.orange, label: 'Taxa ABS', value: `${Number(abs).toFixed(1)}%` }
            ]
          })
        }
      }
    }
  }, [intraHoraRows])

  return (
    <div>
      <KpiCards kpis={kpis} loading={loading} />

      {loading && segmentChartData.categories.length === 0 ? (
        <SkeletonCard
          variant="chart"
          showHeader
          heightClass="h-80"
          ariaLabel="Carregando gráfico de performance por segmento"
        />
      ) : segmentChartData.categories.length > 0 && (
        <SectionCard
          title="Performance de ABS e Presença por Segmento"
          subtitle="Clique em qualquer barra de segmento para filtrar o detalhamento de operadores"
          loading={loading}
          action={
            selectedSegment && (
              <Chip
                color="primary"
                variant="outlined"
                size="small"
                label={`Filtro: ${selectedSegment}`}
                onDelete={() => setSelectedSegment(null)}
                deleteIcon={<FilterAltOffIcon />}
                sx={{ fontWeight: 600 }}
              />
            )
          }
        >
          <div className="p-4">
            <Chart type="line" height={360} options={segmentChartOptions} series={segmentChartSeries} />
          </div>
        </SectionCard>
      )}

      <MatchShorterPair
        deps={[resumoRows, situacoesRows, loading]}
        leftTitle="Resumo por Segmento"
        rightTitle="Situações"
        rightAction={
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            disabled={!resumoRows.length && !situacoesRows.length}
            onClick={() => exportMultipleTables([
              { title: 'Resumo por Segmento', rows: resumoRows, columns: resumoColumns },
              { title: 'Situações', rows: situacoesRows, columns: situacaoAlignedColumns }
            ], 'resumo_segmento_e_situacoes.csv')}
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
            renderCell={(col, row, raw) => renderResumoCell(col, row, raw)}
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

      <SectionCard
        title="ABS Intra-Hora"
        subtitle="Distribuição por faixa horária de entrada"
        loading={loading}
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            disabled={!intraHoraRows.length}
            onClick={() => exportTable(intraHoraRows, intraHoraColumns, 'abs_intra_hora.csv')}
          >
            Exportar CSV
          </Button>
        }
      >
        <div className="flex flex-wrap gap-6 p-4">
          <div className="flex-[1_1_58%] min-w-panel-md">
            {loading && intraHoraRows.length === 0 ? (
              <SkeletonCard
                variant="chart"
                inline
                heightClass="h-80"
                ariaLabel="Carregando gráfico de ABS intra-hora"
              />
            ) : intraHoraRows.length > 0 ? (
              <Chart type="line" height={340} options={intraHoraChartOptions} series={intraHoraChartSeries} />
            ) : (
              <div className={UI_CLASSES.emptyState}>
                Sem dados horários disponíveis para os filtros selecionados.
              </div>
            )}
          </div>
          <div className="flex-[1_1_34%] min-w-panel-sm border border-slate-100 rounded-control overflow-hidden">
            <DataTable
              columns={intraHoraColumns}
              rows={intraHoraRows}
              rowKey="Hora"
              loading={loading}
              hidePagination
              renderCell={(col, _row, raw) =>
                col.field === 'ABS'
                  ? renderResumoCell(col, _row, raw)
                  : raw
              }
            />
          </div>
        </div>
      </SectionCard>

      <OperatorsDetailSection
        operadores={operadoresFiltered}
        loading={loading}
        exportFilename="detalhamento_operadores.csv"
        filterChipLabel={selectedSegment ? `Segmento: ${selectedSegment}` : undefined}
        onClearFilterChip={selectedSegment ? () => setSelectedSegment(null) : undefined}
      />
    </div>
  )
}
