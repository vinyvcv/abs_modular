import { useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Box, Button, Chip, FormControlLabel, Switch, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import KpiCards from '../components/KpiCards'
import { DataTable, SectionCard } from '../components/DataTable'
import { MatchShorterPair } from '../components/MatchShorterPair'
import { useDashboardStore } from '../stores/dashboard'
import { exportMultipleTables, exportTable } from '../utils/export'
import { HAPVIDA_PALETTE, baseChartOptions, buildCustomTooltip } from '../utils/chartConfig'
import {
  OPERADOR_COLUMNS,
  SITUACAO_COLUMNS,
  formatAbsPercentComma,
  formatMilhar,
  formatSituacaoPercent,
  formatTime,
  formatTipoLoginText,
  getAbsColorStyle,
  getStatusStyle,
  getTipoLoginStyle
} from '../utils/format'

const resumoColumns = [
  { field: 'Segmento', label: 'Coord. Operação', align: 'left' },
  { field: 'Total', label: 'Total', align: 'center' },
  { field: 'Previstos', label: 'Previstos', align: 'center' },
  { field: 'Escalados', label: 'Escalados', align: 'center' },
  { field: 'Faltas', label: 'Faltas', align: 'center' },
  { field: 'ABS', label: 'ABS%', align: 'center' }
]

export default function CoordinatorPage() {
  const loading = useDashboardStore(s => s.loading)
  const data = useDashboardStore(s => s.coordenadorData)
  const [apenasAtivos, setApenasAtivos] = useState(false)
  const [selectedCoord, setSelectedCoord] = useState(null)

  const resumoRows = data.resumoSegmento || []
  const situacoesRows = data.situacoes || []
  const operadores = data.operadores || []

  // Filtragem dos operadores por status e coordenador selecionado
  const operadoresFiltered = useMemo(() => {
    let result = operadores
    if (apenasAtivos) {
      result = result.filter(op => (op.status || '').toUpperCase().trim() === 'PRESENTE')
    }
    if (selectedCoord) {
      result = result.filter(op =>
        (op.nome_coordenador_op || '').trim().toLowerCase() === selectedCoord.trim().toLowerCase()
      )
    }
    return result
  }, [apenasAtivos, selectedCoord, operadores])

  // --- Gráfico Interativo: Performance por Coordenação de Operação ---
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
      colors: [HAPVIDA_PALETTE.bluePrimary, HAPVIDA_PALETTE.redCoral, HAPVIDA_PALETTE.orange],
      plotOptions: {
        bar: {
          columnWidth: '42%',
          borderRadius: 4
        }
      },
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
      xaxis: {
        categories: coordChartData.categories,
        labels: {
          rotate: -25,
          rotateAlways: coordChartData.categories.length > 3,
          style: {
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
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
            text: 'Volume de Colaboradores',
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
  }, [coordChartData])

  const renderResumo = (col, row, raw) => {
    const isTotal = row.Segmento === 'TOTAL GERAL'
    const bold = isTotal ? { fontWeight: 700, bgcolor: 'grey.200' } : {}
    if (col.field === 'ABS') {
      return <Box component="span" sx={{ ...getAbsColorStyle(raw), px: 0.5 }}>{formatAbsPercentComma(raw)}</Box>
    }
    if (['Total', 'Previstos', 'Escalados', 'Faltas'].includes(col.field)) {
      return <Box component="span" sx={bold}>{formatMilhar(raw)}</Box>
    }
    return <Box component="span" sx={bold}>{raw}</Box>
  }

  const renderSituacao = (col, row, raw) => {
    const isTotal = row.Situação === 'TOTAL'
    const bold = isTotal ? { fontWeight: 700, bgcolor: 'grey.200' } : {}
    if (col.field === 'Pct') return <Box component="span" sx={bold}>{formatSituacaoPercent(row.Pct)}</Box>
    if (col.field === 'Qtd') return <Box component="span" sx={bold}>{formatMilhar(raw)}</Box>
    return <Box component="span" sx={bold}>{raw}</Box>
  }

  const renderOperador = (col, row, raw) => {
    if (col.field === 'status') {
      return <Box component="span" sx={getStatusStyle(raw)}>{raw ? String(raw).replace(/_/g, ' ') : ''}</Box>
    }
    if (col.field === 'tipoLogin') {
      return <Box component="span" sx={getTipoLoginStyle(raw)}>{formatTipoLoginText(raw)}</Box>
    }
    if (col.field === 'entradaReal') {
      return <Box component="span" sx={getTipoLoginStyle(row.tipoLogin)}>{formatTime(raw)}</Box>
    }
    if (col.field === 'pausa_atual') {
      if (!raw) {
        if (row.status === 'PRESENTE') {
          return <Box component="span" sx={{ color: '#137333', fontSize: '0.78rem', fontWeight: 600 }}>🟢 Em Atendimento</Box>
        }
        return <Box component="span" sx={{ color: '#999', fontSize: '0.78rem' }}>-</Box>
      }
      return (
        <Box component="span" sx={{ bgcolor: '#fef3c7', color: '#b45309', px: 1, py: 0.25, borderRadius: 1, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 0.5, border: '1px solid #fde68a' }}>
          ⏸ {raw}
        </Box>
      )
    }
    if (col.field === 'pausas_resumo') {
      return <Box component="span" sx={{ color: '#4b5563', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{raw ?? '-'}</Box>
    }
    return raw ?? ''
  }

  return (
    <Box>
      <KpiCards kpis={data.kpis || {}} />

      {/* Gráfico Interativo: Performance por Coordenação de Operação */}
      {coordChartData.categories.length > 0 && (
        <SectionCard
          title="Performance de ABS e Presença por Coord. Operação"
          subtitle="Clique na barra de qualquer coordenação para filtrar os operadores na tabela abaixo"
          sx={{ mb: 4 }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                💡 Dica: Clique na barra para filtrar a lista detalhada de colaboradores.
              </Typography>
              {selectedCoord && (
                <Chip
                  color="primary"
                  variant="outlined"
                  size="small"
                  label={`Filtro Ativo: ${selectedCoord}`}
                  onDelete={() => setSelectedCoord(null)}
                  deleteIcon={<FilterAltOffIcon />}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            <Chart type="line" height={360} options={coordChartOptions} series={coordChartSeries} />
          </Box>
        </SectionCard>
      )}

      <Box sx={{ mb: 1 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportMultipleTables([
            { title: 'Resumo por Coord. Operação', rows: data.resumoSegmento || [], columns: resumoColumns },
            { title: 'Situações', rows: data.situacoes || [], columns: SITUACAO_COLUMNS }
          ], 'resumo_coordenador_op.csv')}
        >
          Exportar resumos combinados
        </Button>
      </Box>

      <MatchShorterPair
        deps={[data.resumoSegmento, data.situacoes, loading]}
        leftTitle="Resumo por Coord. Operação"
        rightTitle="Situações"
        sx={{ mb: 4 }}
        left={
          <DataTable
            columns={resumoColumns}
            rows={data.resumoSegmento || []}
            rowKey="Segmento"
            loading={loading}
            hidePagination
            renderCell={renderResumo}
          />
        }
        right={
          <DataTable
            columns={SITUACAO_COLUMNS}
            rows={data.situacoes || []}
            rowKey="Situação"
            loading={loading}
            hidePagination
            renderCell={renderSituacao}
          />
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportTable(operadoresFiltered, OPERADOR_COLUMNS, 'detalhamento_operadores_coordenador.csv')}
        >
          Exportar solicitações filtradas
        </Button>

        {selectedCoord && (
          <Chip
            color="primary"
            size="medium"
            label={`Coordenação: ${selectedCoord} (${operadoresFiltered.length} operadores)`}
            onDelete={() => setSelectedCoord(null)}
            sx={{ fontWeight: 600 }}
          />
        )}

        <FormControlLabel
          sx={{ ml: 'auto' }}
          control={<Switch checked={apenasAtivos} onChange={(e) => setApenasAtivos(e.target.checked)} />}
          label={<Box component="span" sx={{ fontWeight: 700 }}>Apenas Ativos</Box>}
        />
      </Box>

      <SectionCard title="Detalhamento de Operadores" sx={{ mb: 6 }}>
        <DataTable columns={OPERADOR_COLUMNS} rows={operadoresFiltered} rowKey="matricula" loading={loading} renderCell={renderOperador} />
      </SectionCard>
    </Box>
  )
}
