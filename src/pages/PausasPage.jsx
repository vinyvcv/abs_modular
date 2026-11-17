import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { api } from '../api/client'
import { exportTable } from '../utils/export'
import { DataTable, PillBadge, SectionCard } from '../components/DataTable'
import { MetricCard, MetricGrid } from '../components/ui/MetricCard'
import { COLORS, RADII, TYPOGRAPHY, UI_CLASSES } from '../theme'
import { formatDateBr, formatMilhar } from '../utils/format'

const SUPERVISOR_PAUSA_COLS = [
  { field: 'supervisor', label: 'Supervisor', noWrap: true },
  { field: 'coordenador', label: 'Coordenador', noWrap: true },
  { field: 'total_pausas', label: 'Pausas', align: 'right', numeric: true },
  { field: 'pct_dentro_planejado', label: '% Aderente', align: 'center', numeric: true },
  { field: 'pct_com_desvio', label: '% Desvio', align: 'center', numeric: true },
  {
    field: 'tempo_excedido_formatado',
    label: 'Excedido',
    align: 'center',
    mono: true,
    noWrap: true,
    sortValue: (r) => Number(r?.tempo_excedido_seg ?? 0) || r?.tempo_excedido_formatado
  },
  { field: 'total_ofensores', label: 'Ofensores', align: 'right', numeric: true }
]

const TIPO_PAUSA_COLS = [
  { field: 'tipo_pausa', label: 'Tipo de Pausa', noWrap: true },
  { field: 'total_pausas', label: 'Total', align: 'right', numeric: true },
  { field: 'pct_dentro_planejado', label: '% Aderente', align: 'center', numeric: true },
  { field: 'pct_com_desvio', label: '% Desvio', align: 'center', numeric: true }
]

const COORDENADOR_PAUSA_COLS = [
  { field: 'coordenador', label: 'Coordenador', noWrap: true },
  { field: 'total_pausas', label: 'Pausas', align: 'right', numeric: true },
  { field: 'pct_dentro_planejado', label: '% Aderente', align: 'center', numeric: true },
  { field: 'total_ofensores', label: 'Ofensores', align: 'right', numeric: true }
]

const REINCIDENCIA_COLS = [
  { field: 'is_reincidente', label: 'Status', align: 'center' },
  { field: 'login_genesys', label: 'Login Genesys', sticky: 'left', width: 120, mono: true, noWrap: true },
  { field: 'nome_operador', label: 'Nome do Operador', sticky: 'left', width: 200, noWrap: true },
  { field: 'supervisor', label: 'Supervisor', noWrap: true },
  { field: 'coordenador', label: 'Coordenador', noWrap: true },
  { field: 'dias_com_ocorrencia', label: 'Dias c/ Desvio', align: 'right', numeric: true },
  { field: 'total_ocorrencias', label: 'Total Desvios', align: 'right', numeric: true },
  { field: 'qtd_descanso', label: 'Descansos', align: 'right', numeric: true },
  { field: 'qtd_lanche', label: 'Lanches', align: 'right', numeric: true },
  { field: 'qtd_almoco', label: 'Almoços', align: 'right', numeric: true },
  {
    field: 'tempo_total_excedido_formatado',
    label: 'Tempo Excedido',
    align: 'center',
    mono: true,
    noWrap: true,
    sortValue: (r) => Number(r?.tempo_total_excedido_seg ?? 0) || r?.tempo_total_excedido_formatado
  }
]

const SUPERVISOR_REINC_COLS = [
  { field: 'supervisor', label: 'Supervisor', noWrap: true },
  { field: 'coordenador', label: 'Coordenador', noWrap: true },
  { field: 'total_ofensores', label: 'Total Ofensores', align: 'right', numeric: true },
  { field: 'reincidentes', label: 'Reincidentes Críticos', align: 'right', numeric: true },
  { field: 'total_ocorrencias', label: 'Total Ocorrências', align: 'right', numeric: true }
]

const DETALHADO_COLS = [
  { field: 'login_genesys', label: 'Login Genesys', sticky: 'left', width: 120, mono: true, noWrap: true },
  { field: 'nome_operador', label: 'Nome', sticky: 'left', width: 190, noWrap: true },
  { field: 'supervisor', label: 'Supervisor', noWrap: true },
  { field: 'coordenador', label: 'Coordenador', noWrap: true },
  { field: 'tipo_pausa', label: 'Status / Tipo', align: 'center' },
  { field: 'tempo_status', label: 'Tempo Status', align: 'center', mono: true, noWrap: true },
  { field: 'horario_planejado', label: 'Planejado', align: 'center', mono: true, noWrap: true },
  { field: 'horario_realizado', label: 'Realizado', align: 'center', mono: true, noWrap: true },
  { field: 'desvio_inicio', label: 'Desvio Início', align: 'center', mono: true, noWrap: true },
  { field: 'tempo_excedido_seg', label: 'Tempo Excedido', align: 'center', numeric: true, mono: true },
  { field: 'is_ofensor', label: 'Ofensor', align: 'center' }
]

export default function PausasPage() {
  const [currentTab, setCurrentTab] = useState(0)
  const [dataRef, setDataRef] = useState(() => new Date().toISOString().slice(0, 10))
  const [loadingConsolidado, setLoadingConsolidado] = useState(false)
  const [loadingDetalhado, setLoadingDetalhado] = useState(false)

  const [consolidado, setConsolidado] = useState(null)
  const [reincidencia, setReincidencia] = useState(null)
  const [detalhado, setDetalhado] = useState({ rows: [], total: 0, page: 1, pageSize: 50, totalPages: 1 })

  const [filtroCoord, setFiltroCoord] = useState('TODOS')
  const [filtroSup, setFiltroSup] = useState('TODOS')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [apenasOfensores, setApenasOfensores] = useState(false)
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const fetchConsolidado = useCallback(async () => {
    try {
      const res = await api.get('/api/pausas/consolidado', { params: { data: dataRef } })
      setConsolidado(res.data)
    } catch (e) {
      console.error('Erro consolidado:', e)
    }
  }, [dataRef])

  const fetchReincidencia = useCallback(async () => {
    try {
      const res = await api.get('/api/pausas/reincidencia', { params: { dataFim: dataRef, dias: 7 } })
      setReincidencia(res.data)
    } catch (e) {
      console.error('Erro reincidência:', e)
    }
  }, [dataRef])

  const fetchDetalhado = useCallback(async () => {
    setLoadingDetalhado(true)
    try {
      const res = await api.get('/api/pausas/detalhado', {
        params: {
          data: dataRef,
          coordenador: filtroCoord,
          supervisor: filtroSup,
          tipoPausa: filtroTipo,
          apenasOfensores,
          busca,
          page,
          pageSize: 50
        }
      })
      setDetalhado(res.data)
    } catch (e) {
      console.error('Erro detalhado:', e)
    } finally {
      setLoadingDetalhado(false)
    }
  }, [dataRef, filtroCoord, filtroSup, filtroTipo, apenasOfensores, busca, page])

  const loadAll = useCallback(async () => {
    setLoadingConsolidado(true)
    await Promise.all([fetchConsolidado(), fetchReincidencia(), fetchDetalhado()])
    setLoadingConsolidado(false)
  }, [fetchConsolidado, fetchReincidencia, fetchDetalhado])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleUploadSubmit = async () => {
    if (!uploadFile) return
    setUploading(true)
    setUploadMsg('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('dataForcada', dataRef)
      const res = await api.post('/api/pausas/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadMsg(`Sucesso! ${res.data.totalInseridos} pausas importadas.`)
      setTimeout(() => {
        setUploadOpen(false)
        setUploadFile(null)
        setUploadMsg('')
        loadAll()
      }, 1500)
    } catch (e) {
      setUploadMsg(`Erro: ${e.response?.data?.error || e.message}`)
    } finally {
      setUploading(false)
    }
  }

  const listaCoordenadores = useMemo(() => {
    if (!consolidado?.porCoordenador) return []
    return consolidado.porCoordenador.map(c => c.coordenador).filter(Boolean).sort()
  }, [consolidado])

  const listaSupervisores = useMemo(() => {
    if (!consolidado?.porSupervisor) return []
    return consolidado.porSupervisor.map(s => s.supervisor).filter(Boolean).sort()
  }, [consolidado])

  const handleExportDetalhado = () => {
    if (!detalhado.rows.length) return
    const cols = [
      { field: 'data', label: 'Data' },
      { field: 'login_genesys', label: 'Login Genesys' },
      { field: 'nome_operador', label: 'Nome' },
      { field: 'supervisor', label: 'Supervisor' },
      { field: 'coordenador', label: 'Coordenador' },
      { field: 'tipo_pausa', label: 'Tipo Pausa' },
      { field: 'tempo_status', label: 'Duração Realizada' },
      { field: 'horario_planejado', label: 'Início Planejado' },
      { field: 'horario_realizado', label: 'Início Realizado' },
      { field: 'desvio_inicio', label: 'Desvio Início' },
      { field: 'tempo_excedido_seg', label: 'Tempo Excedido (s)' },
      { field: 'is_ofensor', label: 'Ofensor' }
    ]
    exportTable(detalhado.rows, cols, `aderencia_pausas_${dataRef}.csv`)
  }

  const kpiConsolidadoLoading = Boolean(loadingConsolidado && !consolidado)
  const kpiReincLoading = Boolean(loadingConsolidado && !reincidencia)

  const pctAderente = Number(consolidado?.kpis?.pct_dentro_planejado || 0)
  const pctDesvio = Number(consolidado?.kpis?.pct_com_desvio || 0)
  const totalOfensores = Number(consolidado?.kpis?.total_ofensores || 0)
  const totalReincidentes = Number(reincidencia?.totalReincidentes || 0)

  const resetDetalhadoFilters = () => {
    setFiltroCoord('TODOS')
    setFiltroSup('TODOS')
    setFiltroTipo('TODOS')
    setApenasOfensores(false)
    setBusca('')
    setPage(1)
  }

  return (
    <div>
      {/* Toolbar operacional compacta */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <span className="text-sm text-slate-600 tabular-nums">
          Referência operacional · <strong className="text-slate-900">{formatDateBr(dataRef)}</strong> · Janela NR-17 &amp; Escala
        </span>

        <div className="flex items-center gap-3 flex-wrap">
          <TextField
            size="small"
            type="date"
            label="Data de Análise"
            value={dataRef}
            onChange={(e) => {
              setPage(1)
              setDataRef(e.target.value)
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }}
          />

          <Button
            variant="outlined"
            onClick={loadAll}
            disabled={loadingConsolidado}
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ minHeight: 40 }}
          >
            Atualizar
          </Button>

          <Button
            variant="contained"
            startIcon={<UploadFileIcon fontSize="small" />}
            onClick={() => setUploadOpen(true)}
            sx={{ minHeight: 40 }}
          >
            Importar Relatório Diário
          </Button>
        </div>
      </div>

      {/* Abas Principais */}
      <div className="border-b border-slate-200 mb-6">
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              fontWeight: 600,
              fontSize: TYPOGRAPHY.scale.md,
              textTransform: 'none',
              color: COLORS.text.muted,
              '&.Mui-selected': {
                color: COLORS.brand.navy,
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: COLORS.brand.navy,
              height: 2.5,
              borderRadius: '2px 2px 0 0'
            }
          }}
        >
          <Tab label="Consolidado (Visão Gerencial)" />
          <Tab
            label={
              <span className="flex items-center gap-2">
                <span>Reincidência (Ofensores D-7)</span>
                {reincidencia?.totalReincidentes > 0 && (
                  <PillBadge variant="danger" size="small">
                    {reincidencia.totalReincidentes}
                  </PillBadge>
                )}
              </span>
            }
          />
          <Tab label="Detalhamento Diário" />
        </Tabs>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: CONSOLIDADO (VISÃO GERENCIAL) */}
      {/* ============================================================== */}
      {currentTab === 0 && (
        <div>
          <MetricGrid>
            <MetricCard
              variant="simple"
              title="Total de Pausas"
              value={formatMilhar(consolidado?.kpis?.total_pausas || 0)}
              metaText="Pausas registradas no dia"
              tone="blue"
              Icon={AccessTimeOutlinedIcon}
              tip="Total de pausas NR-17 programadas e registradas na data de análise."
              loading={kpiConsolidadoLoading}
            />
            <MetricCard
              variant="progress"
              title="Dentro do Planejado"
              value={`${pctAderente.toFixed(1)}%`}
              metaText={`${formatMilhar(consolidado?.kpis?.dentro_planejado || 0)} pausas aderentes`}
              tone="green"
              Icon={CheckCircleOutlinedIcon}
              progress={{ pct: pctAderente, barClass: 'bg-emerald-500' }}
              tip="Percentual de pausas iniciadas dentro da janela de tolerância planejada."
              loading={kpiConsolidadoLoading}
            />
            <MetricCard
              variant="progress"
              title="Com Desvio de Início"
              value={`${pctDesvio.toFixed(1)}%`}
              metaText={`${formatMilhar(consolidado?.kpis?.com_desvio || 0)} com desvio > 10 min`}
              tone="orange"
              Icon={WarningAmberOutlinedIcon}
              alert={pctDesvio > 25}
              progress={{
                pct: pctDesvio,
                barClass: pctDesvio > 25 ? 'bg-red-500' : 'bg-amber-500'
              }}
              tip="Pausas iniciadas fora do horário previsto com diferença superior a 10 minutos."
              loading={kpiConsolidadoLoading}
            />
            <MetricCard
              variant="simple"
              title="Tempo Total Excedido"
              value={consolidado?.kpis?.tempo_excedido_formatado || '00:00:00'}
              metaText="Horas estouradas além da pausa"
              tone="orange"
              Icon={AccessTimeOutlinedIcon}
              tip="Somatório de tempo excedido acima da duração regulamentar NR-17."
              loading={kpiConsolidadoLoading}
            />
            <MetricCard
              variant="trend"
              title="Ofensores Totais"
              value={formatMilhar(totalOfensores)}
              tone="red"
              Icon={PersonOffOutlinedIcon}
              alert={totalOfensores > 0}
              trend={{
                direction: totalOfensores > 0 ? 'up' : 'flat',
                tone: totalOfensores > 0 ? 'bad' : 'good',
                label: totalOfensores > 0 ? 'Início atrasado ou estouro' : 'Nenhum ofensor no dia'
              }}
              tip="Ocorrências classificadas como ofensoras por desvio de início ou estouro de tempo."
              loading={kpiConsolidadoLoading}
            />
          </MetricGrid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <SectionCard
                title="Consolidado por Supervisor"
                subtitle="Aderência e volume de ofensores por equipe"
                loading={loadingConsolidado}
                className="mb-0"
              >
                <DataTable
                  columns={SUPERVISOR_PAUSA_COLS}
                  rows={consolidado?.porSupervisor || []}
                  rowKey={(r, idx) => r.supervisor || idx}
                  loading={kpiConsolidadoLoading}
                  hidePagination
                  dense
                  densityToggle
                  searchable
                  searchPlaceholder="Filtrar supervisor..."
                  maxHeight={460}
                  emptyMessage={`Nenhum dado consolidado por supervisor para ${formatDateBr(dataRef)}.`}
                  renderCell={(col, r, raw) => {
                    if (col.field === 'supervisor') {
                      return <span className="font-semibold text-slate-900">{raw}</span>
                    }
                    if (col.field === 'coordenador') {
                      return <span className="text-slate-600">{raw}</span>
                    }
                    if (col.field === 'total_pausas') {
                      return <span className="font-medium text-slate-700">{formatMilhar(raw)}</span>
                    }
                    if (col.field === 'pct_dentro_planejado') {
                      return <PillBadge variant="success">{Number(raw || 0).toFixed(1)}%</PillBadge>
                    }
                    if (col.field === 'pct_com_desvio') {
                      const val = Number(raw || 0)
                      return <PillBadge variant={val > 25 ? 'danger' : 'neutral'}>{val.toFixed(1)}%</PillBadge>
                    }
                    if (col.field === 'total_ofensores') {
                      return Number(raw || 0) > 0
                        ? <PillBadge variant="danger">{raw}</PillBadge>
                        : <PillBadge variant="neutral">0</PillBadge>
                    }
                    return raw ?? '-'
                  }}
                />
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <SectionCard
                title="Por Tipo de Pausa NR-17"
                subtitle="Distribuição entre descanso, lanche e refeição"
                loading={loadingConsolidado}
                className="mb-5"
              >
                <DataTable
                  columns={TIPO_PAUSA_COLS}
                  rows={consolidado?.porTipoPausa || []}
                  rowKey={(r, idx) => r.tipo_pausa || idx}
                  loading={kpiConsolidadoLoading}
                  hidePagination
                  dense
                  emptyMessage="Sem registros por tipo de pausa."
                  renderCell={(col, _r, raw) => {
                    if (col.field === 'tipo_pausa') {
                      return <span className="font-semibold text-slate-900">{raw}</span>
                    }
                    if (col.field === 'total_pausas') {
                      return <span className="font-medium text-slate-700">{formatMilhar(raw)}</span>
                    }
                    if (col.field === 'pct_dentro_planejado') {
                      return <PillBadge variant="success">{Number(raw || 0).toFixed(1)}%</PillBadge>
                    }
                    if (col.field === 'pct_com_desvio') {
                      const val = Number(raw || 0)
                      return <PillBadge variant={val > 25 ? 'danger' : 'neutral'}>{val.toFixed(1)}%</PillBadge>
                    }
                    return raw ?? '-'
                  }}
                />
              </SectionCard>

              <SectionCard
                title="Por Coordenador"
                subtitle="Visão agrupada por coordenação"
                loading={loadingConsolidado}
                className="mb-0"
              >
                <DataTable
                  columns={COORDENADOR_PAUSA_COLS}
                  rows={consolidado?.porCoordenador || []}
                  rowKey={(r, idx) => r.coordenador || idx}
                  loading={kpiConsolidadoLoading}
                  hidePagination
                  dense
                  maxHeight={250}
                  emptyMessage="Sem dados por coordenador."
                  renderCell={(col, _r, raw) => {
                    if (col.field === 'coordenador') {
                      return <span className="font-semibold text-slate-900">{raw}</span>
                    }
                    if (col.field === 'total_pausas') {
                      return <span className="font-medium text-slate-700">{formatMilhar(raw)}</span>
                    }
                    if (col.field === 'pct_dentro_planejado') {
                      return <PillBadge variant="success">{Number(raw || 0).toFixed(1)}%</PillBadge>
                    }
                    if (col.field === 'total_ofensores') {
                      return Number(raw || 0) > 0
                        ? <PillBadge variant="danger">{raw}</PillBadge>
                        : <PillBadge variant="neutral">0</PillBadge>
                    }
                    return raw ?? '-'
                  }}
                />
              </SectionCard>
            </Grid>
          </Grid>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: REINCIDÊNCIA (OFENSORES D-7) */}
      {/* ============================================================== */}
      {currentTab === 1 && (
        <div>
          <MetricGrid>
            <MetricCard
              variant="simple"
              title="Ofensores no Período"
              value={formatMilhar(reincidencia?.totalOfensores || 0)}
              metaText="Com ≥ 1 ocorrência nos últimos 7 dias"
              tone="orange"
              Icon={PersonOffOutlinedIcon}
              tip="Total de operadores distintos que registraram desvio ou estouro na janela D-7."
              loading={kpiReincLoading}
            />
            <MetricCard
              variant="trend"
              title="Reincidentes Críticos"
              value={formatMilhar(totalReincidentes)}
              tone="red"
              Icon={WarningAmberOutlinedIcon}
              alert={totalReincidentes > 0}
              trend={{
                direction: totalReincidentes > 0 ? 'up' : 'flat',
                tone: totalReincidentes > 0 ? 'bad' : 'good',
                label: '3 ou mais ocorrências na janela D-7'
              }}
              tip="Operadores elegíveis para devolutiva individual ou medida disciplinar."
              loading={kpiReincLoading}
            />
            <MetricCard
              variant="simple"
              title="Supervisores com Reincidentes"
              value={formatMilhar(reincidencia?.porSupervisor?.filter(s => s.reincidentes > 0).length || 0)}
              metaText="Equipes que exigem atuação imediata"
              tone="blue"
              Icon={GroupsOutlinedIcon}
              tip="Supervisores com ao menos um operador reincidente na janela D-7."
              loading={kpiReincLoading}
            />
          </MetricGrid>

          <SectionCard
            title="Ranking de Reincidência de Ofensores (Últimos 7 Dias)"
            subtitle="Critério de reincidência: 3 ou mais ocorrências na janela D-7"
            loading={loadingConsolidado}
          >
            <DataTable
              columns={REINCIDENCIA_COLS}
              rows={reincidencia?.ranking || []}
              rowKey={(r, idx) => r.login_genesys || idx}
              loading={kpiReincLoading}
              hidePagination
              dense
              densityToggle
              searchable
              searchPlaceholder="Buscar operador ou supervisor..."
              maxHeight={480}
              getRowTone={(r) => (r.is_reincidente ? 'danger' : 'default')}
              emptyMessage="Nenhum ofensor registrado nos últimos 7 dias."
              renderCell={(col, r, raw) => {
                if (col.field === 'is_reincidente') {
                  return r.is_reincidente
                    ? <PillBadge variant="danger">REINCIDENTE</PillBadge>
                    : <PillBadge variant="neutral">Ocasional</PillBadge>
                }
                if (col.field === 'login_genesys') {
                  return <span className="font-semibold text-slate-900">{raw}</span>
                }
                if (col.field === 'nome_operador') {
                  return <span className="font-medium text-slate-900">{raw}</span>
                }
                if (col.field === 'supervisor') {
                  return <span className="text-slate-600">{raw}</span>
                }
                if (col.field === 'coordenador') {
                  return <span className="text-slate-500">{raw}</span>
                }
                if (col.field === 'dias_com_ocorrencia') {
                  return <span className="font-semibold text-slate-700">{raw}d</span>
                }
                if (col.field === 'total_ocorrencias') {
                  const val = Number(raw || 0)
                  const variant = val >= 5 ? 'danger' : val >= 3 ? 'warning' : 'neutral'
                  return <PillBadge variant={variant}>{val}</PillBadge>
                }
                if (col.field === 'qtd_descanso' || col.field === 'qtd_lanche' || col.field === 'qtd_almoco') {
                  return <span className="text-slate-600">{raw}</span>
                }
                if (col.field === 'tempo_total_excedido_formatado') {
                  return <PillBadge variant="danger" className="font-mono">{raw}</PillBadge>
                }
                return raw ?? '-'
              }}
            />
          </SectionCard>

          <SectionCard
            title="Ofensores por Supervisor"
            subtitle="Resumo gerencial para devolutiva individual e plano de ação"
            loading={loadingConsolidado}
          >
            <DataTable
              columns={SUPERVISOR_REINC_COLS}
              rows={reincidencia?.porSupervisor || []}
              rowKey={(r, idx) => r.supervisor || idx}
              loading={kpiReincLoading}
              hidePagination
              dense
              searchable
              searchPlaceholder="Buscar supervisor..."
              maxHeight={360}
              emptyMessage="Sem ofensores agrupados por supervisor no período."
              renderCell={(col, _r, raw) => {
                if (col.field === 'supervisor') {
                  return <span className="font-semibold text-slate-900">{raw}</span>
                }
                if (col.field === 'coordenador') {
                  return <span className="text-slate-600">{raw}</span>
                }
                if (col.field === 'total_ofensores') {
                  return <PillBadge variant="neutral">{raw}</PillBadge>
                }
                if (col.field === 'reincidentes') {
                  return Number(raw || 0) > 0
                    ? <PillBadge variant="danger">{raw} reincidentes</PillBadge>
                    : <PillBadge variant="success">0</PillBadge>
                }
                if (col.field === 'total_ocorrencias') {
                  const val = Number(raw || 0)
                  return <PillBadge variant={val > 10 ? 'warning' : 'neutral'}>{val}</PillBadge>
                }
                return raw ?? '-'
              }}
            />
          </SectionCard>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: DETALHAMENTO DIÁRIO */}
      {/* ============================================================== */}
      {currentTab === 2 && (
        <div>
          <div className={UI_CLASSES.filterBar}>
            <Grid container spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por Nome ou Login"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPage(1)
                      fetchDetalhado()
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Coordenador</InputLabel>
                  <Select
                    value={filtroCoord}
                    label="Coordenador"
                    onChange={(e) => {
                      setPage(1)
                      setFiltroCoord(e.target.value)
                    }}
                  >
                    <MenuItem value="TODOS">Todos os Coordenadores</MenuItem>
                    {listaCoordenadores.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Supervisor</InputLabel>
                  <Select
                    value={filtroSup}
                    label="Supervisor"
                    onChange={(e) => {
                      setPage(1)
                      setFiltroSup(e.target.value)
                    }}
                  >
                    <MenuItem value="TODOS">Todos os Supervisores</MenuItem>
                    {listaSupervisores.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Pausa</InputLabel>
                  <Select
                    value={filtroTipo}
                    label="Tipo de Pausa"
                    onChange={(e) => {
                      setPage(1)
                      setFiltroTipo(e.target.value)
                    }}
                  >
                    <MenuItem value="TODOS">Todos os Tipos</MenuItem>
                    <MenuItem value="Descanso">Descanso</MenuItem>
                    <MenuItem value="Lanche">Lanche</MenuItem>
                    <MenuItem value="Almoço">Almoço</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  sx={{ m: 0, whiteSpace: 'nowrap' }}
                  control={
                    <Switch
                      checked={apenasOfensores}
                      onChange={(e) => {
                        setPage(1)
                        setApenasOfensores(e.target.checked)
                      }}
                      color="error"
                      size="small"
                    />
                  }
                  label={<span className="text-body font-semibold text-slate-700">Apenas Ofensores</span>}
                />
              </Grid>
            </Grid>
          </div>

          <SectionCard
            title="Detalhamento Diário de Pausas"
            subtitle={`Exibindo ${formatMilhar(detalhado.rows.length)} de ${formatMilhar(detalhado.total)} registros em ${formatDateBr(dataRef)}`}
            loading={loadingDetalhado}
            action={
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon fontSize="small" />}
                onClick={handleExportDetalhado}
                disabled={!detalhado.rows.length}
              >
                Exportar CSV
              </Button>
            }
          >
            <DataTable
              columns={DETALHADO_COLS}
              rows={detalhado.rows}
              rowKey={(r, idx) => r.id || idx}
              loading={loadingDetalhado}
              hidePagination
              dense
              densityToggle
              maxHeight={600}
              getRowTone={(r) => (r.is_ofensor ? 'danger' : 'default')}
              emptyMessage="Nenhum registro de pausa encontrado com os filtros selecionados."
              emptyActionLabel="Limpar filtros"
              onEmptyAction={resetDetalhadoFilters}
              renderCell={(col, row, raw) => {
                if (col.field === 'login_genesys') {
                  return <span className="font-semibold text-slate-900">{raw}</span>
                }
                if (col.field === 'nome_operador') {
                  return <span className="font-medium text-slate-900">{raw}</span>
                }
                if (col.field === 'supervisor') {
                  return <span className="text-slate-600">{raw}</span>
                }
                if (col.field === 'coordenador') {
                  return <span className="text-slate-500">{raw}</span>
                }
                if (col.field === 'tipo_pausa') {
                  return <PillBadge variant="neutral">{raw}</PillBadge>
                }
                if (col.field === 'tempo_status' || col.field === 'horario_planejado') {
                  return <span className="font-semibold text-slate-900">{raw}</span>
                }
                if (col.field === 'horario_realizado') {
                  return <span className="text-slate-600">{raw}</span>
                }
                if (col.field === 'desvio_inicio') {
                  const isOfensorInicio = row.is_ofensor_inicio
                  const isDesvioAtraso = String(row.desvio_inicio || '').startsWith('+')
                  return (
                    <PillBadge
                      variant={isOfensorInicio ? 'danger' : isDesvioAtraso ? 'warning' : 'success'}
                      className="font-mono"
                    >
                      {raw || '-'}
                    </PillBadge>
                  )
                }
                if (col.field === 'tempo_excedido_seg') {
                  return Number(raw || 0) > 0 ? (
                    <PillBadge variant="danger" className="font-mono">
                      +{Math.floor(Number(raw) / 60)}m
                    </PillBadge>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )
                }
                if (col.field === 'is_ofensor') {
                  return row.is_ofensor
                    ? <PillBadge variant="danger">SIM</PillBadge>
                    : <PillBadge variant="success">NÃO</PillBadge>
                }
                return raw ?? '-'
              }}
              footer={
                detalhado.totalPages > 1 ? (
                  <div className="p-4 flex justify-center border-t border-slate-200 bg-white">
                    <Pagination
                      count={detalhado.totalPages}
                      page={page}
                      onChange={(_, p) => setPage(p)}
                      color="primary"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: `${RADII.control}px`,
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums'
                        }
                      }}
                    />
                  </div>
                ) : null
              }
            />
          </SectionCard>
        </div>
      )}

      {/* Dialog de Importação */}
      <Dialog
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${RADII.card}px`,
              border: `1px solid ${COLORS.border.hairline}`,
              overflow: 'hidden'
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: COLORS.surface.canvas,
            color: COLORS.text.primary,
            fontFamily: TYPOGRAPHY.fonts.display,
            fontWeight: 700,
            fontSize: '1.05rem',
            borderBottom: `1px solid ${COLORS.border.hairline}`,
            py: 1.75
          }}
        >
          Importar Relatório Diário de Pausas
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Selecione a planilha do planejamento diário (<strong>.xlsx</strong> ou <strong>.csv</strong>) para{' '}
            <strong>{formatDateBr(dataRef)}</strong> contendo as colunas:{' '}
            <em>Login Genesys, Nome, Supervisor, Coordenador, Status, Tempo Status, Planejado, Realizado, Desvio</em>.
          </p>

          <div className={UI_CLASSES.dropzoneBox}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-sm max-w-full"
            />
          </div>

          {uploadMsg && (
            <Alert severity={uploadMsg.includes('Erro') ? 'error' : 'success'}>
              {uploadMsg}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.75, bgcolor: COLORS.surface.canvas, borderTop: `1px solid ${COLORS.border.hairline}` }}>
          <Button
            onClick={() => setUploadOpen(false)}
            disabled={uploading}
            sx={{ minHeight: 38, color: COLORS.text.muted }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadSubmit}
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon fontSize="small" />}
            sx={{ minHeight: 38 }}
          >
            {uploading ? 'Importando...' : 'Fazer Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
