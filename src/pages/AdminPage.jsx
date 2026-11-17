import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DownloadIcon from '@mui/icons-material/Download'
import TableViewIcon from '@mui/icons-material/TableView'
import DescriptionIcon from '@mui/icons-material/Description'
import { absD0Api } from '../api/client'
import { DataTable, SectionCard } from '../components/DataTable'
import { adminStatusColor, formatDt, formatDuration } from '../utils/format'

const TOKEN_KEY = 'abs_d0_admin_token'
const USER_KEY = 'abs_d0_admin_user'

const RUN_COLUMNS = [
  { field: 'id', label: 'ID' },
  { field: 'type', label: 'Tipo' },
  { field: 'trigger', label: 'Origem' },
  { field: 'status', label: 'Status', align: 'center' },
  { field: 'startedAt', label: 'Início' },
  { field: 'finishedAt', label: 'Fim' },
  { field: 'durationMs', label: 'Duração', align: 'right' },
  { field: 'error', label: 'Erro' }
]

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '')
  const [adminUser, setAdminUser] = useState(localStorage.getItem(USER_KEY) || '')
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [starting, setStarting] = useState(false)
  const [startType, setStartType] = useState('')
  const [runs, setRuns] = useState([])
  const [latest, setLatest] = useState(null)
  const [activeRunId, setActiveRunId] = useState(null)
  const [onedrivePath, setOnedrivePath] = useState('')
  const [logFiles, setLogFiles] = useState([])
  const [selectedLog, setSelectedLog] = useState('')
  const [logContent, setLogContent] = useState('')
  const [toast, setToast] = useState(null)
  const pollTimer = useRef(null)

  const syncBusy = starting || Boolean(activeRunId)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const doLogout = useCallback(async () => {
    try {
      await absD0Api.post('/api/admin/logout')
    } catch { /* ignore */ }
    setToken('')
    setAdminUser('')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    stopPolling()
  }, [stopPolling])

  const loadLog = useCallback(async (name) => {
    const file = name || selectedLog
    if (!file) return
    try {
      const { data } = await absD0Api.get(`/api/admin/logs/${file}?tail=400`)
      setLogContent(data.content || '')
    } catch (err) {
      setLogContent(err.response?.data?.error || 'Erro ao ler log')
    }
  }, [selectedLog])

  const refreshAll = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    try {
      const [meRes, runsRes, logsRes] = await Promise.all([
        absD0Api.get('/api/admin/me'),
        absD0Api.get('/api/admin/runs?limit=50'),
        absD0Api.get('/api/admin/logs')
      ])
      setAdminUser(meRes.data.user)
      setOnedrivePath(meRes.data.onedrivePath || '')
      setActiveRunId(runsRes.data.activeRunId)
      setLatest(runsRes.data.latest)
      setRuns(runsRes.data.runs || [])
      const files = logsRes.data.files || []
      setLogFiles(files)
      setSelectedLog(prev => {
        if (prev) return prev
        if (files.length) {
          const name = files[0].name
          absD0Api.get(`/api/admin/logs/${name}?tail=400`).then(({ data }) => {
            setLogContent(data.content || '')
          }).catch(() => {})
          return name
        }
        return prev
      })
    } catch (err) {
      if (err.response?.status === 401) {
        await doLogout()
        setToast({ severity: 'error', message: 'Sessão expirada' })
      } else {
        setToast({ severity: 'error', message: err.response?.data?.error || 'Erro ao carregar admin' })
      }
    }
  }, [doLogout])

  const startPolling = useCallback(() => {
    stopPolling()
    pollTimer.current = setInterval(() => {
      if (localStorage.getItem(TOKEN_KEY)) refreshAll()
    }, 5000)
  }, [refreshAll, stopPolling])

  useEffect(() => {
    if (token) {
      refreshAll()
      startPolling()
    }
    return stopPolling
  }, [token, refreshAll, startPolling, stopPolling])

  const doLogin = async () => {
    setLoginLoading(true)
    setLoginError('')
    try {
      const { data } = await absD0Api.post('/api/admin/login', loginForm)
      setToken(data.token)
      setAdminUser(data.user)
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, data.user)
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Falha no login')
    } finally {
      setLoginLoading(false)
    }
  }

  const startRun = async (type) => {
    if (syncBusy) {
      setToast({ severity: 'warning', message: 'Já existe uma execução em andamento. Aguarde terminar.' })
      return
    }
    setStarting(true)
    setStartType(type)
    try {
      const { data } = await absD0Api.post('/api/admin/run', { type })
      setToast({ severity: 'success', message: `Execução iniciada (${data.run.id})` })
      setActiveRunId(data.run.id)
      await refreshAll()
    } catch (err) {
      const status = err.response?.status
      setToast({
        severity: status === 409 ? 'warning' : 'error',
        message: err.response?.data?.error || 'Falha ao iniciar execução'
      })
      if (status === 409 && err.response?.data?.run?.id) {
        setActiveRunId(err.response.data.run.id)
      }
      await refreshAll()
    } finally {
      setStarting(false)
      setStartType('')
    }
  }

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Card variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} color="primary">Admin</Typography>
            <Typography variant="caption" color="grey.600" display="block" mb={2}>
              Login para disparar sync, ver histórico e logs
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Usuário"
              value={loginForm.user}
              onChange={(e) => setLoginForm(f => ({ ...f, user: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Senha"
              type="password"
              value={loginForm.pass}
              onChange={(e) => setLoginForm(f => ({ ...f, pass: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              sx={{ mb: 2 }}
            />
            {loginError && <Alert severity="error" sx={{ mb: 2 }}>{loginError}</Alert>}
            <Button fullWidth variant="contained" onClick={doLogin} disabled={loginLoading}>
              {loginLoading ? 'Entrando…' : 'Entrar'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  const details = latest?.details || {}

  return (
    <Box>
      {toast && (
        <Alert severity={toast.severity} sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Admin</Typography>
          <Typography variant="caption" color="grey.600">
            Logado como <strong>{adminUser}</strong>
            {onedrivePath ? ` · OneDrive: ${onedrivePath}` : ''}
          </Typography>
        </Box>
        <Button color="error" startIcon={<LogoutIcon />} onClick={doLogout} sx={{ textTransform: 'none' }}>
          Sair
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Card variant="outlined" sx={{ flex: '1 1 280px' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700}>Disparar sync</Typography>
            <Typography variant="caption" color="grey.600" display="block" mb={2}>
              Login/Logout (MSTR → OneDrive → HIST) e depois D0 (CSV + banco)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={syncBusy}
                onClick={() => startRun('full')}
                sx={{ textTransform: 'none' }}
              >
                {starting && startType === 'full' ? 'Iniciando…' : 'Rodar ciclo completo'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={syncBusy}
                onClick={() => startRun('login-logout')}
                sx={{ textTransform: 'none' }}
              >
                Só Login/Logout
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableViewIcon />}
                disabled={syncBusy}
                onClick={() => startRun('d0')}
                sx={{ textTransform: 'none' }}
              >
                Só D0 Abs
              </Button>
            </Box>
            {syncBusy && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Execução em andamento — aguarde terminar para rodar de novo.
                {activeRunId ? <> (<strong>{activeRunId}</strong>)</> : null}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ flex: '2 1 400px' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>Última execução</Typography>
            {!latest ? (
              <Typography color="grey.600">Nenhuma execução registrada ainda.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="grey.600">Status</Typography>
                  <Box><Chip size="small" color={adminStatusColor(latest.status)} label={latest.status} /></Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="grey.600">Tipo</Typography>
                  <Typography fontWeight={500}>{latest.type}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="grey.600">Início</Typography>
                  <Typography fontWeight={500}>{formatDt(latest.startedAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="grey.600">Duração</Typography>
                  <Typography fontWeight={500}>{formatDuration(latest.durationMs)}</Typography>
                </Box>
                {(details.recordsProcessed !== undefined || details.loginLogout?.recordsProcessed !== undefined ||
                  details.loadId !== undefined || details.d0?.loadId !== undefined) && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="grey.600" display="block" mb={0.5}>Dados Processados</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(details.recordsProcessed !== undefined || details.loginLogout?.recordsProcessed !== undefined) && (
                        <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, border: '1px solid #e0e0e0', fontSize: 12 }}>
                          <span style={{ color: '#666' }}>Logins/Logouts:</span>{' '}
                          <strong>
                            {(details.recordsProcessed ?? details.loginLogout?.recordsProcessed)} registros
                          </strong>
                        </Box>
                      )}
                      {(details.loadId !== undefined || details.d0?.loadId !== undefined) && (
                        <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, border: '1px solid #e0e0e0', fontSize: 12 }}>
                          <span style={{ color: '#666' }}>Carga D0 (Banco):</span>{' '}
                          <strong>ID {details.loadId ?? details.d0?.loadId}</strong>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                {latest.error && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Alert severity="error">{latest.error}</Alert>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <SectionCard title="Histórico de execuções" sx={{ mb: 2 }}>
        <DataTable
          columns={RUN_COLUMNS}
          rows={runs}
          rowKey="id"
          hidePagination
          renderCell={(col, row, raw) => {
            if (col.field === 'status') return <Chip size="small" color={adminStatusColor(raw)} label={raw} />
            if (col.field === 'startedAt' || col.field === 'finishedAt') return formatDt(raw)
            if (col.field === 'durationMs') return formatDuration(raw)
            return raw ?? ''
          }}
        />
      </SectionCard>

      <SectionCard title="Logs">
        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Arquivo"
            value={selectedLog}
            onChange={(e) => setSelectedLog(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {logFiles.map(f => (
              <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => loadLog()} sx={{ textTransform: 'none' }}>
            Carregar
          </Button>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <pre className="admin-log-box" style={{
            margin: 0,
            maxHeight: 420,
            overflow: 'auto',
            background: '#111827',
            color: '#e5e7eb',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {logContent || 'Selecione um arquivo de log.'}
          </pre>
        </Box>
      </SectionCard>
    </Box>
  )
}
