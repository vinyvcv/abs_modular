import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import GroupIcon from '@mui/icons-material/Group'
import { api } from '../api/client'
import { exportTable } from '../utils/export'
import { SectionCard, PillBadge } from '../components/DataTable'

function KpiBox({ title, value, subtitle, colorScheme = 'blue', icon: Icon, alert = false }) {
  const schemes = {
    blue: { iconBg: '#eff6ff', iconColor: '#2563eb', valColor: '#0f172a' },
    green: { iconBg: '#ecfdf5', iconColor: '#059669', valColor: '#065f46' },
    orange: { iconBg: '#fffbeb', iconColor: '#d97706', valColor: '#92400e' },
    red: { iconBg: '#fef2f2', iconColor: '#dc2626', valColor: '#991b1b' }
  }

  const activeScheme = alert ? schemes.red : (schemes[colorScheme] || schemes.blue)

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        bgcolor: '#ffffff',
        borderColor: alert ? '#fecaca' : '#e2e8f0',
        borderRadius: 2,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: alert ? '#fca5a5' : '#cbd5e1',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontSize: '0.72rem'
            }}
          >
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                p: 0.8,
                borderRadius: 1.5,
                bgcolor: activeScheme.iconBg,
                color: activeScheme.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: activeScheme.valColor,
            mb: 0.5,
            fontSize: '1.75rem',
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default function PausasPage() {
  const [currentTab, setCurrentTab] = useState(0) // 0: Consolidado, 1: Reincidência, 2: Detalhado
  const [dataRef, setDataRef] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  // Estados de dados
  const [consolidado, setConsolidado] = useState(null)
  const [reincidencia, setReincidencia] = useState(null)
  const [detalhado, setDetalhado] = useState({ rows: [], total: 0, page: 1, pageSize: 50, totalPages: 1 })

  // Filtros do detalhado
  const [filtroCoord, setFiltroCoord] = useState('TODOS')
  const [filtroSup, setFiltroSup] = useState('TODOS')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [apenasOfensores, setApenasOfensores] = useState(false)
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)

  // Dialog de upload
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const fetchConsolidado = async () => {
    try {
      const res = await api.get('/api/pausas/consolidado', { params: { data: dataRef } })
      setConsolidado(res.data)
    } catch (e) {
      console.error('Erro consolidado:', e)
    }
  }

  const fetchReincidencia = async () => {
    try {
      const res = await api.get('/api/pausas/reincidencia', { params: { dataFim: dataRef, dias: 7 } })
      setReincidencia(res.data)
    } catch (e) {
      console.error('Erro reincidência:', e)
    }
  }

  const fetchDetalhado = async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([fetchConsolidado(), fetchReincidencia(), fetchDetalhado()])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [dataRef])

  useEffect(() => {
    fetchDetalhado()
  }, [page, filtroCoord, filtroSup, filtroTipo, apenasOfensores])

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

  // Lista de coordenadores e supervisores únicos para filtros
  const listaCoordenadores = useMemo(() => {
    if (!consolidado?.porCoordenador) return []
    return consolidado.porCoordenador.map(c => c.coordenador).filter(Boolean).sort()
  }, [consolidado])

  const listaSupervisores = useMemo(() => {
    if (!consolidado?.porSupervisor) return []
    return consolidado.porSupervisor.map(s => s.supervisor).filter(Boolean).sort()
  }, [consolidado])

  // Exportar detalhado
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

  // Estilos padronizados para cabeçalhos de tabela
  const tableHeaderSx = {
    bgcolor: '#f1f5f9',
    color: '#475569',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #e2e8f0',
    py: 1.2,
    px: 1.75,
    whiteSpace: 'nowrap'
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      {/* Top Header & Controles Alinhados */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AccessTimeIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              Aderência às Pausas (NR-17 & Escala)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Acompanhamento de desvios de início, estouros de tempo e reincidência de ofensores
            </Typography>
          </Box>
        </Box>

        {/* Barra de Ações Alinhada */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            type="date"
            label="Data de Análise"
            value={dataRef}
            onChange={(e) => setDataRef(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 165,
              bgcolor: '#ffffff',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                borderColor: '#cbd5e1'
              }
            }}
          />

          <Tooltip title="Atualizar dados">
            <Button
              variant="outlined"
              size="medium"
              onClick={loadAll}
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: '#cbd5e1',
                color: '#334155',
                bgcolor: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1.5,
                '&:hover': {
                  borderColor: '#94a3b8',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Atualizar
            </Button>
          </Tooltip>

          <Button
            variant="contained"
            size="medium"
            startIcon={<UploadFileIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{
              bgcolor: '#0f172a',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1.5,
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: '#1e293b'
              }
            }}
          >
            Importar Relatório Diário
          </Button>
        </Box>
      </Box>

      {/* Tabs Principais Executivas */}
      <Paper
        square
        elevation={0}
        sx={{
          borderBottom: '1px solid #e2e8f0',
          mb: 3,
          bgcolor: 'transparent'
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              color: '#64748b',
              '&.Mui-selected': {
                color: '#0f172a',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#0f172a',
              height: 2.5,
              borderRadius: '2px 2px 0 0'
            }
          }}
        >
          <Tab label="Consolidado (Visão Gerencial)" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Reincidência (Ofensores D-7)</span>
                {reincidencia?.totalReincidentes > 0 && (
                  <PillBadge variant="danger" size="small">
                    {reincidencia.totalReincidentes}
                  </PillBadge>
                )}
              </Box>
            }
          />
          <Tab label="Detalhamento Diário" />
        </Tabs>
      </Paper>

      {/* ============================================================== */}
      {/* ABA 1: CONSOLIDADO (VISÃO GERENCIAL) */}
      {/* ============================================================== */}
      {currentTab === 0 && (
        <Box>
          {/* KPIs Gerenciais em Estilo Executivo Branco */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiBox
                title="TOTAL DE PAUSAS"
                value={consolidado?.kpis?.total_pausas?.toLocaleString('pt-BR') || '0'}
                subtitle="Pausas registradas no dia"
                colorScheme="blue"
                icon={AccessTimeIcon}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiBox
                title="DENTRO DO PLANEJADO"
                value={`${(consolidado?.kpis?.pct_dentro_planejado || 0).toFixed(1)}%`}
                subtitle={`${consolidado?.kpis?.dentro_planejado || 0} pausas aderentes`}
                colorScheme="green"
                icon={CheckCircleOutlinedIcon}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiBox
                title="COM DESVIO DE INÍCIO"
                value={`${(consolidado?.kpis?.pct_com_desvio || 0).toFixed(1)}%`}
                subtitle={`${consolidado?.kpis?.com_desvio || 0} com desvio > 10 min`}
                colorScheme="orange"
                icon={WarningAmberIcon}
                alert={consolidado?.kpis?.pct_com_desvio > 25}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiBox
                title="TEMPO TOTAL EXCEDIDO"
                value={consolidado?.kpis?.tempo_excedido_formatado || '00:00:00'}
                subtitle="Horas estouradas além da pausa"
                colorScheme="orange"
                icon={AccessTimeIcon}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiBox
                title="OFENSORES TOTAIS"
                value={consolidado?.kpis?.total_ofensores || '0'}
                subtitle="Início atrasado ou estouro"
                colorScheme="red"
                icon={PersonOffIcon}
                alert={consolidado?.kpis?.total_ofensores > 0}
              />
            </Grid>
          </Grid>

          {/* Tabelas de Agrupamento em SectionCards Modernos */}
          <Grid container spacing={2.5}>
            {/* Por Supervisor */}
            <Grid item xs={12} md={7}>
              <SectionCard title="Consolidado por Supervisor">
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeaderSx}>Supervisor</TableCell>
                        <TableCell sx={tableHeaderSx}>Coordenador</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>Pausas</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>% Aderente</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>% Desvio</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>Excedido</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>Ofensores</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consolidado?.porSupervisor?.map((s, idx) => {
                        const isEven = idx % 2 === 0
                        return (
                          <TableRow
                            key={idx}
                            sx={{
                              bgcolor: isEven ? '#ffffff' : '#fcfdfe',
                              '&:hover': { bgcolor: '#f8fafc !important' }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                              {s.supervisor}
                            </TableCell>
                            <TableCell sx={{ color: '#64748b', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                              {s.coordenador}
                            </TableCell>
                            <TableCell align="center" sx={{ color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                              {s.total_pausas}
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <PillBadge variant="success">
                                {s.pct_dentro_planejado.toFixed(1)}%
                              </PillBadge>
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <PillBadge variant={s.pct_com_desvio > 25 ? 'danger' : 'neutral'}>
                                {s.pct_com_desvio.toFixed(1)}%
                              </PillBadge>
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                              {s.tempo_excedido_formatado}
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              {s.total_ofensores > 0 ? (
                                <PillBadge variant="danger">
                                  {s.total_ofensores}
                                </PillBadge>
                              ) : (
                                <PillBadge variant="neutral">0</PillBadge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>
            </Grid>

            {/* Por Tipo de Pausa & Coordenador */}
            <Grid item xs={12} md={5}>
              <SectionCard title="Por Tipo de Pausa NR-17" sx={{ mb: 2.5 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeaderSx}>Tipo de Pausa</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>Total</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>% Aderente</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>% Desvio</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consolidado?.porTipoPausa?.map((t, idx) => {
                        const isEven = idx % 2 === 0
                        return (
                          <TableRow
                            key={idx}
                            sx={{
                              bgcolor: isEven ? '#ffffff' : '#fcfdfe',
                              '&:hover': { bgcolor: '#f8fafc !important' }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                              {t.tipo_pausa}
                            </TableCell>
                            <TableCell align="center" sx={{ color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                              {t.total_pausas}
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <PillBadge variant="success">
                                {t.pct_dentro_planejado.toFixed(1)}%
                              </PillBadge>
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <PillBadge variant={t.pct_com_desvio > 25 ? 'danger' : 'neutral'}>
                                {t.pct_com_desvio.toFixed(1)}%
                              </PillBadge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>

              <SectionCard title="Por Coordenador">
                <TableContainer sx={{ maxHeight: 240 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeaderSx}>Coordenador</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>Pausas</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>% Aderente</TableCell>
                        <TableCell align="center" sx={tableHeaderSx}>Ofensores</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consolidado?.porCoordenador?.map((c, idx) => {
                        const isEven = idx % 2 === 0
                        return (
                          <TableRow
                            key={idx}
                            sx={{
                              bgcolor: isEven ? '#ffffff' : '#fcfdfe',
                              '&:hover': { bgcolor: '#f8fafc !important' }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                              {c.coordenador}
                            </TableCell>
                            <TableCell align="center" sx={{ color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                              {c.total_pausas}
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <PillBadge variant="success">
                                {c.pct_dentro_planejado.toFixed(1)}%
                              </PillBadge>
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              {c.total_ofensores > 0 ? (
                                <PillBadge variant="danger">
                                  {c.total_ofensores}
                                </PillBadge>
                              ) : (
                                <PillBadge variant="neutral">0</PillBadge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ============================================================== */}
      {/* ABA 2: REINCIDÊNCIA (FOCO DOS OFENSORES - D-7) */}
      {/* ============================================================== */}
      {currentTab === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <KpiBox
                title="TOTAL DE OFENSORES NO PERÍODO"
                value={reincidencia?.totalOfensores || '0'}
                subtitle="Operadores com pelo menos 1 ocorrência nos últimos 7 dias"
                colorScheme="orange"
                icon={PersonOffIcon}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KpiBox
                title="REINCIDENTES (≥ 3 OCORRÊNCIAS)"
                value={reincidencia?.totalReincidentes || '0'}
                subtitle="Foco crítico para devolutiva individual e medida disciplinar"
                colorScheme="red"
                icon={WarningAmberIcon}
                alert={reincidencia?.totalReincidentes > 0}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KpiBox
                title="SUPERVISORES COM REINCIDENTES"
                value={reincidencia?.porSupervisor?.filter(s => s.reincidentes > 0).length || '0'}
                subtitle="Supervisores que precisam atuar na equipe"
                colorScheme="blue"
                icon={GroupIcon}
              />
            </Grid>
          </Grid>

          {/* Ranking Geral de Ofensores em SectionCard Moderno */}
          <SectionCard
            title="Ranking de Reincidência de Ofensores (Últimos 7 Dias)"
            action={
              <PillBadge variant="neutral">
                Reincidente = 3 ou mais ocorrências no período
              </PillBadge>
            }
            sx={{ mb: 3 }}
          >
            <TableContainer sx={{ maxHeight: 480 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderSx}>Status</TableCell>
                    {/* Sticky Column: Login Genesys */}
                    <TableCell
                      sx={{
                        ...tableHeaderSx,
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        bgcolor: '#f1f5f9'
                      }}
                    >
                      Login Genesys
                    </TableCell>
                    {/* Sticky Column: Nome do Operador */}
                    <TableCell
                      sx={{
                        ...tableHeaderSx,
                        position: 'sticky',
                        left: 115,
                        zIndex: 4,
                        bgcolor: '#f1f5f9',
                        boxShadow: '3px 0 6px -2px rgba(0, 0, 0, 0.07)',
                        borderRight: '1px solid #e2e8f0'
                      }}
                    >
                      Nome do Operador
                    </TableCell>
                    <TableCell sx={tableHeaderSx}>Supervisor</TableCell>
                    <TableCell sx={tableHeaderSx}>Coordenador</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Dias c/ Desvio</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Total Desvios</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Descansos</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Lanches</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Almoços</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Tempo Excedido</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reincidencia?.ranking?.map((r, idx) => {
                    const isEven = idx % 2 === 0
                    const isReincidente = r.is_reincidente
                    const rowBg = isReincidente
                      ? (isEven ? '#fff8f8' : '#fff1f2')
                      : (isEven ? '#ffffff' : '#fcfdfe')

                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          bgcolor: rowBg,
                          transition: 'background-color 0.15s ease',
                          '&:hover': {
                            bgcolor: isReincidente ? '#fee2e2 !important' : '#f8fafc !important',
                            '& .sticky-reinc-cell': {
                              bgcolor: isReincidente ? '#fee2e2 !important' : '#f8fafc !important'
                            }
                          }
                        }}
                      >
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                          {isReincidente ? (
                            <PillBadge variant="danger">
                              REINCIDENTE
                            </PillBadge>
                          ) : (
                            <PillBadge variant="neutral">
                              Ocasional
                            </PillBadge>
                          )}
                        </TableCell>
                        {/* Sticky Cell: Login Genesys */}
                        <TableCell
                          className="sticky-reinc-cell"
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            bgcolor: rowBg,
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          {r.login_genesys}
                        </TableCell>
                        {/* Sticky Cell: Nome */}
                        <TableCell
                          className="sticky-reinc-cell"
                          sx={{
                            fontWeight: 500,
                            color: '#1e293b',
                            position: 'sticky',
                            left: 115,
                            zIndex: 2,
                            bgcolor: rowBg,
                            boxShadow: '3px 0 6px -2px rgba(0, 0, 0, 0.07)',
                            borderRight: '1px solid #e2e8f0',
                            borderBottom: '1px solid #f1f5f9',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {r.nome_operador}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                          {r.supervisor}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                          {r.coordenador}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                          {r.dias_com_ocorrencia}d
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                          <PillBadge
                            variant={r.total_ocorrencias >= 5 ? 'danger' : r.total_ocorrencias >= 3 ? 'warning' : 'neutral'}
                          >
                            {r.total_ocorrencias}
                          </PillBadge>
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                          {r.qtd_descanso}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                          {r.qtd_lanche}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                          {r.qtd_almoco}
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                          <PillBadge variant="danger">
                            {r.tempo_total_excedido_formatado}
                          </PillBadge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          {/* Destaque por Supervisor em SectionCard */}
          <SectionCard title="Ofensores por Supervisor (Para Devolutiva Individual / Medida Disciplinar)">
            <TableContainer sx={{ maxHeight: 350 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderSx}>Supervisor</TableCell>
                    <TableCell sx={tableHeaderSx}>Coordenador</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Total Ofensores</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Reincidentes Críticos</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Total Ocorrências</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reincidencia?.porSupervisor?.map((s, idx) => {
                    const isEven = idx % 2 === 0
                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          bgcolor: isEven ? '#ffffff' : '#fcfdfe',
                          '&:hover': { bgcolor: '#f8fafc !important' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                          {s.supervisor}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                          {s.coordenador}
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                          <PillBadge variant="neutral">
                            {s.total_ofensores}
                          </PillBadge>
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                          {s.reincidentes > 0 ? (
                            <PillBadge variant="danger">
                              {s.reincidentes} reincidentes
                            </PillBadge>
                          ) : (
                            <PillBadge variant="success">0</PillBadge>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                          <PillBadge variant={s.total_ocorrencias > 10 ? 'warning' : 'neutral'}>
                            {s.total_ocorrencias}
                          </PillBadge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Box>
      )}

      {/* ============================================================== */}
      {/* ABA 3: DETALHAMENTO DIÁRIO */}
      {/* ============================================================== */}
      {currentTab === 2 && (
        <Box>
          {/* Barra de Filtros Refinada */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2.5,
              bgcolor: '#f8fafc',
              borderColor: '#e2e8f0',
              borderRadius: 2
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por Nome ou Login"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDetalhado()}
                  sx={{ bgcolor: '#ffffff' }}
                />
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
                  <InputLabel>Coordenador</InputLabel>
                  <Select
                    value={filtroCoord}
                    label="Coordenador"
                    onChange={(e) => setFiltroCoord(e.target.value)}
                  >
                    <MenuItem value="TODOS">Todos os Coordenadores</MenuItem>
                    {listaCoordenadores.map((c, i) => (
                      <MenuItem key={i} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
                  <InputLabel>Supervisor</InputLabel>
                  <Select
                    value={filtroSup}
                    label="Supervisor"
                    onChange={(e) => setFiltroSup(e.target.value)}
                  >
                    <MenuItem value="TODOS">Todos os Supervisores</MenuItem>
                    {listaSupervisores.map((s, i) => (
                      <MenuItem key={i} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
                  <InputLabel>Tipo de Pausa</InputLabel>
                  <Select
                    value={filtroTipo}
                    label="Tipo de Pausa"
                    onChange={(e) => setFiltroTipo(e.target.value)}
                  >
                    <MenuItem value="TODOS">Todos os Tipos</MenuItem>
                    <MenuItem value="Descanso">Descanso</MenuItem>
                    <MenuItem value="Lanche">Lanche</MenuItem>
                    <MenuItem value="Almoço">Almoço</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={apenasOfensores}
                      onChange={(e) => setApenasOfensores(e.target.checked)}
                      color="error"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>Apenas Ofensores</Typography>}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Mostrando <b>{detalhado.rows.length}</b> de <b>{detalhado.total}</b> registros no dia {dataRef}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportDetalhado}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  bgcolor: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  '&:hover': {
                    borderColor: '#94a3b8',
                    bgcolor: '#f1f5f9'
                  }
                }}
              >
                Exportar CSV
              </Button>
            </Box>
          </Paper>

          {/* Tabela de Detalhamento Diário com Cabeçalho Limpo e Sticky Columns */}
          <SectionCard title="Detalhamento Diário de Pausas">
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {/* Sticky Column: Login Genesys */}
                    <TableCell
                      sx={{
                        ...tableHeaderSx,
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        bgcolor: '#f1f5f9'
                      }}
                    >
                      Login Genesys
                    </TableCell>
                    {/* Sticky Column: Nome */}
                    <TableCell
                      sx={{
                        ...tableHeaderSx,
                        position: 'sticky',
                        left: 115,
                        zIndex: 4,
                        bgcolor: '#f1f5f9',
                        boxShadow: '3px 0 6px -2px rgba(0, 0, 0, 0.07)',
                        borderRight: '1px solid #e2e8f0'
                      }}
                    >
                      Nome
                    </TableCell>
                    <TableCell sx={tableHeaderSx}>Supervisor</TableCell>
                    <TableCell sx={tableHeaderSx}>Coordenador</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Status / Tipo</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Tempo Status</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Planejado</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Realizado</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Desvio Início</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Tempo Excedido</TableCell>
                    <TableCell align="center" sx={tableHeaderSx}>Ofensor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={30} sx={{ color: '#093b8f' }} />
                      </TableCell>
                    </TableRow>
                  ) : detalhado.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        Nenhum registro de pausa encontrado com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalhado.rows.map((row, idx) => {
                      const isEven = idx % 2 === 0
                      const isOfensor = row.is_ofensor
                      const isOfensorInicio = row.is_ofensor_inicio
                      const isDesvioAtraso = (row.desvio_inicio || '').startsWith('+')

                      const rowBg = isOfensor
                        ? (isEven ? '#fff8f8' : '#fff1f2')
                        : (isEven ? '#ffffff' : '#fcfdfe')

                      return (
                        <TableRow
                          key={row.id || idx}
                          sx={{
                            bgcolor: rowBg,
                            transition: 'background-color 0.15s ease',
                            '&:hover': {
                              bgcolor: isOfensor ? '#fee2e2 !important' : '#f8fafc !important',
                              '& .sticky-detail-cell': {
                                bgcolor: isOfensor ? '#fee2e2 !important' : '#f8fafc !important'
                              }
                            }
                          }}
                        >
                          {/* Sticky Cell: Login Genesys */}
                          <TableCell
                            className="sticky-detail-cell"
                            sx={{
                              fontWeight: 600,
                              color: '#0f172a',
                              position: 'sticky',
                              left: 0,
                              zIndex: 2,
                              bgcolor: rowBg,
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            {row.login_genesys}
                          </TableCell>

                          {/* Sticky Cell: Nome */}
                          <TableCell
                            className="sticky-detail-cell"
                            sx={{
                              fontWeight: 500,
                              color: '#1e293b',
                              position: 'sticky',
                              left: 115,
                              zIndex: 2,
                              bgcolor: rowBg,
                              boxShadow: '3px 0 6px -2px rgba(0, 0, 0, 0.07)',
                              borderRight: '1px solid #e2e8f0',
                              borderBottom: '1px solid #f1f5f9',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {row.nome_operador}
                          </TableCell>

                          <TableCell sx={{ fontSize: '0.8rem', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                            {row.supervisor}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                            {row.coordenador}
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                            <PillBadge variant="neutral">
                              {row.tipo_pausa}
                            </PillBadge>
                          </TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                            {row.tempo_status}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                            {row.horario_planejado}
                          </TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                            {row.horario_realizado}
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                            <PillBadge
                              variant={isOfensorInicio ? 'danger' : isDesvioAtraso ? 'warning' : 'success'}
                            >
                              {row.desvio_inicio || '-'}
                            </PillBadge>
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                            {row.tempo_excedido_seg > 0 ? (
                              <PillBadge variant="danger">
                                +{Math.floor(row.tempo_excedido_seg / 60)}m
                              </PillBadge>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                            {isOfensor ? (
                              <PillBadge variant="danger">
                                SIM
                              </PillBadge>
                            ) : (
                              <PillBadge variant="success">
                                NÃO
                              </PillBadge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {detalhado.totalPages > 1 && (
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  borderTop: '1px solid #e2e8f0',
                  bgcolor: '#ffffff'
                }}
              >
                <Pagination
                  count={detalhado.totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1.5,
                      fontWeight: 600
                    }
                  }}
                />
              </Box>
            )}
          </SectionCard>
        </Box>
      )}

      {/* Dialog de Importação Refinado */}
      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#f8fafc',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '1.05rem',
            borderBottom: '1px solid #e2e8f0',
            py: 2
          }}
        >
          Importar Relatório Diário de Pausas
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            Selecione a planilha do planejamento diário (formato <b>.xlsx</b> ou <b>.csv</b>) contendo as colunas:{' '}
            <i>Login Genesys, Nome, Supervisor, Coordenador, Status, Tempo Status, Planejado, Realizado, Desvio</i>.
          </Typography>

          <Box
            sx={{
              p: 3,
              mb: 2,
              border: '2px dashed #cbd5e1',
              borderRadius: 2,
              bgcolor: '#f8fafc',
              textAlign: 'center',
              '&:hover': { borderColor: '#94a3b8' }
            }}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files[0] || null)}
              style={{ fontSize: '0.875rem' }}
            />
          </Box>

          {uploadMsg && (
            <Typography
              variant="body2"
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: uploadMsg.includes('Erro') ? '#fef2f2' : '#ecfdf5',
                color: uploadMsg.includes('Erro') ? '#991b1b' : '#065f46',
                border: uploadMsg.includes('Erro') ? '1px solid #fecaca' : '1px solid #a7f3d0',
                fontWeight: 600
              }}
            >
              {uploadMsg}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => setUploadOpen(false)}
            disabled={uploading}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1.5
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadSubmit}
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
            sx={{
              bgcolor: '#0f172a',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1.5,
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            {uploading ? 'Importando...' : 'Fazer Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
