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
  formatAbsPercent,
  formatMilhar,
  formatSituacaoPercent,
  formatTime,
  formatTipoLoginText,
  getAbsColorStyle,
  getStatusStyle,
  getTipoLoginStyle
} from '../utils/format'

const resumoColumns = [
  { field: 'Segmento', label: 'Segmento', align: 'left' },
  { field: 'Total', label: 'Total', align: 'center' },
  { field: 'Previstos', label: 'Previstos', align: 'center' },
  { field: 'Escalados', label: 'Escalados', align: 'center' },
  { field: 'Faltas', label: 'Faltas', align: 'center' },
  { field: 'ABS', label: 'ABS%', align: 'center' }
]

const intraHoraColumns = [
  { field: 'Hora', label: 'Hora', align: 'center' },
  { field: 'Escalados', label: 'Escalados', align: 'center' },
  { field: 'Faltas', label: 'Faltas', align: 'center' },
  { field: 'ABS', label: 'ABS%', align: 'center' }
]

export default function SegmentPage() {
  const loading = useDashboardStore(s => s.loading)
  const geralData = useDashboardStore(s => s.geralData)
  const [apenasAtivos, setApenasAtivos] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState(null)

  const kpis = geralData.kpis || {}
  const resumoRows = geralData.resumoSegmento || []
  const situacoesRows = geralData.situacoes || []
  const intraHoraRows = geralData.intraHora || []
  const operadores = geralData.operadores || []

  // Filtragem dos operadores com base em status ativo e segmento selecionado no gráfico
  const operadoresFiltered = useMemo(() => {
    let result = operadores
    if (apenasAtivos) {
      result = result.filter(op => (op.status || '').toUpperCase().trim() === 'PRESENTE')
    }
    if (selectedSegment) {
      result = result.filter(op => (op.segmento || '').trim().toLowerCase() === selectedSegment.trim().toLowerCase())
    }
    return result
  }, [apenasAtivos, selectedSegment, operadores])

  // --- Gráfico 1: Performance por Segmento (Barras Presentes/Faltas + Linha ABS%) ---
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
        categories: segmentChartData.categories,
        labels: {
          rotate: -25,
          rotateAlways: segmentChartData.categories.length > 5,
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
  }, [segmentChartData])

  // --- Gráfico 2: ABS Intra-Hora ---
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
        height: 350,
        type: 'line',
        stacked: true
      },
      stroke: { width: [0, 0, 3], curve: 'smooth' },
      colors: [HAPVIDA_PALETTE.blueNavy, HAPVIDA_PALETTE.redCoral, HAPVIDA_PALETTE.orange],
      plotOptions: {
        bar: {
          columnWidth: '40%',
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
            text: 'Volume de Agentes',
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

  const renderResumo = (col, row, raw) => {
    const isTotal = row.Segmento === 'TOTAL GERAL'
    const bold = isTotal ? { fontWeight: 700, bgcolor: 'grey.200' } : {}
    if (col.field === 'ABS') {
      return <Box component="span" sx={{ ...getAbsColorStyle(raw), px: 0.5 }}>{formatAbsPercent(raw)}</Box>
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
      <KpiCards kpis={kpis} />

      {/* Gráfico Interativo: Performance de ABS e Presença por Segmento */}
      {segmentChartData.categories.length > 0 && (
        <SectionCard
          title="Performance de ABS e Presença por Segmento"
          subtitle="Clique em qualquer segmento para filtrar os operadores na tabela abaixo"
          sx={{ mb: 4 }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                💡 Dica: Clique na barra do segmento para filtrar a lista detalhada de operadores.
              </Typography>
              {selectedSegment && (
                <Chip
                  color="primary"
                  variant="outlined"
                  size="small"
                  label={`Filtro Ativo: ${selectedSegment}`}
                  onDelete={() => setSelectedSegment(null)}
                  deleteIcon={<FilterAltOffIcon />}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            <Chart type="line" height={360} options={segmentChartOptions} series={segmentChartSeries} />
          </Box>
        </SectionCard>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportMultipleTables([
            { title: 'Resumo por Segmento', rows: resumoRows, columns: resumoColumns },
            { title: 'Situações', rows: situacoesRows, columns: SITUACAO_COLUMNS }
          ], 'resumo_segmento_e_situacoes.csv')}
        >
          Exportar resumos combinados
        </Button>
      </Box>

      <MatchShorterPair
        deps={[resumoRows, situacoesRows, loading]}
        leftTitle="Resumo por Segmento"
        rightTitle="Situações"
        sx={{ mb: 6 }}
        left={
          <DataTable
            columns={resumoColumns}
            rows={resumoRows}
            rowKey="Segmento"
            loading={loading}
            hidePagination
            renderCell={renderResumo}
          />
        }
        right={
          <DataTable
            columns={SITUACAO_COLUMNS}
            rows={situacoesRows}
            rowKey="Situação"
            loading={loading}
            hidePagination
            renderCell={renderSituacao}
          />
        }
      />

      <Box sx={{ mb: 1 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportTable(intraHoraRows, intraHoraColumns, 'abs_intra_hora.csv')}
        >
          Exportar ABS intra-hora
        </Button>
      </Box>

      <SectionCard title="ABS Intra-Hora" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, p: 2 }}>
          <Box sx={{ flex: '1 1 60%', minWidth: 280 }}>
            {intraHoraRows.length > 0 ? (
              <Chart type="line" height={350} options={intraHoraChartOptions} series={intraHoraChartSeries} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8, color: 'grey.600' }}>Sem dados para gerar o gráfico no momento.</Box>
            )}
          </Box>
          <Box sx={{ flex: '1 1 30%', minWidth: 220 }}>
            <DataTable
              columns={intraHoraColumns}
              rows={intraHoraRows}
              rowKey="Hora"
              loading={loading}
              hidePagination
              renderCell={(col, row, raw) =>
                col.field === 'ABS'
                  ? <Box component="span" sx={getAbsColorStyle(raw)}>{formatAbsPercent(raw)}</Box>
                  : raw
              }
            />
          </Box>
        </Box>
      </SectionCard>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportTable(operadoresFiltered, OPERADOR_COLUMNS, 'detalhamento_operadores.csv')}
        >
          Exportar solicitações filtradas
        </Button>

        {selectedSegment && (
          <Chip
            color="primary"
            size="medium"
            label={`Segmento: ${selectedSegment} (${operadoresFiltered.length} operadores)`}
            onDelete={() => setSelectedSegment(null)}
            sx={{ fontWeight: 600 }}
          />
        )}

        <FormControlLabel
          sx={{ ml: 'auto' }}
          control={<Switch checked={apenasAtivos} onChange={(e) => setApenasAtivos(e.target.checked)} color="primary" />}
          label={<Box component="span" sx={{ fontWeight: 700 }}>Apenas Ativos</Box>}
        />
      </Box>

      <SectionCard title="Detalhamento de Operadores" sx={{ mb: 6 }}>
        <DataTable
          columns={OPERADOR_COLUMNS}
          rows={operadoresFiltered}
          rowKey="matricula"
          loading={loading}
          renderCell={renderOperador}
        />
      </SectionCard>
    </Box>
  )
}
