import { useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Box, Button, Chip, FormControlLabel, Switch, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff'
import KpiCards from '../components/KpiCards'
import { DataTable, SectionCard } from '../components/DataTable'
import { useDashboardStore } from '../stores/dashboard'
import { exportTable } from '../utils/export'
import { HAPVIDA_PALETTE, baseChartOptions, buildCustomTooltip } from '../utils/chartConfig'
import {
  OPERADOR_COLUMNS,
  formatAbsPercentComma,
  formatMilhar,
  formatTime,
  formatTipoLoginText,
  getAbsColorStyle,
  getStatusStyle,
  getTipoLoginStyle
} from '../utils/format'

const resumoColumns = [
  { field: 'Supervisor', label: 'Supervisor', align: 'left' },
  { field: 'Previstos', label: 'Previstos', align: 'center' },
  { field: 'Escalados', label: 'Escalados', align: 'center' },
  { field: 'Faltas', label: 'Faltas', align: 'center' },
  { field: 'Presentes', label: 'Presentes', align: 'center' },
  { field: 'ABS', label: 'ABS%', align: 'center' }
]

export default function SupervisorPage() {
  const loading = useDashboardStore(s => s.loading)
  const data = useDashboardStore(s => s.supervisorData)
  const [apenasAtivos, setApenasAtivos] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)

  const resumoSupervisor = data.resumoSupervisor || []
  const operadores = data.operadores || []

  // Filtragem dos operadores por status e supervisor selecionado no gráfico
  const operadoresFiltered = useMemo(() => {
    let result = operadores
    if (apenasAtivos) {
      result = result.filter(op => (op.status || '').toUpperCase().trim() === 'PRESENTE')
    }
    if (selectedSupervisor) {
      result = result.filter(op =>
        (op.nome_supervisor || '').trim().toLowerCase() === selectedSupervisor.trim().toLowerCase()
      )
    }
    return result
  }, [apenasAtivos, selectedSupervisor, operadores])

  // --- Gráfico Interativo: Performance por Supervisor ---
  const supervisorChartData = useMemo(() => {
    // Filtrar linhas válidas (não vazias e sem total geral)
    const validRows = resumoSupervisor.filter(
      r => r.Supervisor && !String(r.Supervisor).toUpperCase().includes('TOTAL')
    )
    // Ordenar por volume de escalados ou maior ABS para melhor legibilidade
    const sorted = [...validRows].sort((a, b) => Number(b.Escalados || 0) - Number(a.Escalados || 0))

    return {
      categories: sorted.map(r => r.Supervisor),
      presentes: sorted.map(r => Number(r.Presentes || 0)),
      faltas: sorted.map(r => Number(r.Faltas || 0)),
      escalados: sorted.map(r => Number(r.Escalados || 0)),
      abs: sorted.map(r => Number(r.ABS || 0))
    }
  }, [resumoSupervisor])

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
      colors: [HAPVIDA_PALETTE.bluePrimary, HAPVIDA_PALETTE.redCoral, HAPVIDA_PALETTE.orange],
      plotOptions: {
        bar: {
          columnWidth: '45%',
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
        categories: supervisorChartData.categories,
        labels: {
          rotate: -35,
          rotateAlways: supervisorChartData.categories.length > 4,
          trim: true,
          maxHeight: 100,
          style: {
            fontSize: '10.5px',
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
  }, [supervisorChartData])

  const renderResumo = (col, row, raw) => {
    if (col.field === 'ABS') {
      return <Box component="span" sx={{ ...getAbsColorStyle(raw), px: 0.5 }}>{formatAbsPercentComma(raw)}</Box>
    }
    if (['Previstos', 'Escalados', 'Faltas', 'Presentes'].includes(col.field)) {
      return formatMilhar(raw)
    }
    return raw ?? ''
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

      {/* Gráfico Interativo: Performance por Supervisor */}
      {supervisorChartData.categories.length > 0 && (
        <SectionCard
          title="Performance de ABS e Presença por Supervisor"
          subtitle="Acompanhamento comparativo de aderência e ausências por equipe. Clique na barra para filtrar."
          sx={{ mb: 4 }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                💡 Dica: Clique na barra de qualquer supervisor para filtrar a lista detalhada de operadores abaixo.
              </Typography>
              {selectedSupervisor && (
                <Chip
                  color="primary"
                  variant="outlined"
                  size="small"
                  label={`Filtro Ativo: ${selectedSupervisor}`}
                  onDelete={() => setSelectedSupervisor(null)}
                  deleteIcon={<FilterAltOffIcon />}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            <Chart type="line" height={380} options={supervisorChartOptions} series={supervisorChartSeries} />
          </Box>
        </SectionCard>
      )}

      <Box sx={{ mb: 1 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportTable(data.resumoSupervisor || [], resumoColumns, 'resumo_supervisor.csv')}
        >
          Exportar resumo por supervisor
        </Button>
      </Box>

      <SectionCard title="Resumo por Supervisor" sx={{ mb: 4 }}>
        <DataTable
          columns={resumoColumns}
          rows={data.resumoSupervisor || []}
          rowKey="Supervisor"
          loading={loading}
          renderCell={renderResumo}
        />
      </SectionCard>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          sx={{ textTransform: 'none' }}
          onClick={() => exportTable(operadoresFiltered, OPERADOR_COLUMNS, 'detalhamento_operadores_supervisor.csv')}
        >
          Exportar solicitações filtradas
        </Button>

        {selectedSupervisor && (
          <Chip
            color="primary"
            size="medium"
            label={`Supervisor: ${selectedSupervisor} (${operadoresFiltered.length} operadores)`}
            onDelete={() => setSelectedSupervisor(null)}
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
