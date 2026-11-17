import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Divider,
  MenuItem,
  TextField
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DownloadIcon from '@mui/icons-material/Download'
import TableViewIcon from '@mui/icons-material/TableView'
import DescriptionIcon from '@mui/icons-material/Description'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { absD0Api } from '../api/client'
import { DataTable, PillBadge, SectionCard } from '../components/DataTable'
import SkeletonCard from '../components/ui/SkeletonCard'
import { UI_CLASSES } from '../theme'
import { adminStatusColor, formatDt, formatDuration, formatMilhar } from '../utils/format'

const TOKEN_KEY = 'abs_d0_admin_token'
const USER_KEY = 'abs_d0_admin_user'

const RUN_COLUMNS = [
  { field: 'id', label: 'ID', mono: true, noWrap: true },
  { field: 'type', label: 'Tipo', noWrap: true },
  { field: 'trigger', label: 'Origem', noWrap: true },
  { field: 'status', label: 'Status', align: 'center' },
  { field: 'startedAt', label: 'Início', mono: true, noWrap: true },
  { field: 'finishedAt', label: 'Fim', mono: true, noWrap: true },
  { field: 'durationMs', label: 'Duração', align: 'right', mono: true, noWrap: true },
  { field: 'error', label: 'Erro' }
]

const ADMIN_BADGE_VARIANT = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  default: 'neutral'
}

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
  const [initialLoading, setInitialLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))
  const [logLoading, setLogLoading] = useState(false)
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
    setLogLoading(true)
    try {
      const { data } = await absD0Api.get(`/api/admin/logs/${file}?tail=400`)
      setLogContent(data.content || '')
    } catch (err) {
      setLogContent(err.response?.data?.error || 'Erro ao ler log')
    } finally {
      setLogLoading(false)
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
    } finally {
      setInitialLoading(false)
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
      <div className="flex justify-center items-center min-h-[68vh]">
        <div className={`${UI_CLASSES.cardSurface} w-full max-w-modal-sm`}>
          <div className={UI_CLASSES.cardHeader}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-control bg-blue-50 text-hapvida-navy flex items-center justify-center shrink-0">
                <LockOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <h2 className={UI_CLASSES.cardHeaderTitle}>Acesso Administrativo</h2>
                <span className={UI_CLASSES.cardHeaderSubtitle}>
                  Disparo de sincronização, histórico e logs
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <TextField
              fullWidth
              size="small"
              label="Usuário"
              value={loginForm.user}
              onChange={(e) => setLoginForm(f => ({ ...f, user: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
            <TextField
              fullWidth
              size="small"
              label="Senha"
              type="password"
              value={loginForm.pass}
              onChange={(e) => setLoginForm(f => ({ ...f, pass: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
            {loginError && <Alert severity="error">{loginError}</Alert>}
            <Button
              fullWidth
              variant="contained"
              onClick={doLogin}
              disabled={loginLoading}
              sx={{ minHeight: 42 }}
            >
              {loginLoading ? 'Autenticando…' : 'Entrar no Painel'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const details = latest?.details || {}

  return (
    <div>
      {toast && (
        <Alert severity={toast.severity} sx={{ mb: 2.5 }} onClose={() => setToast(null)}>
          {toast.message}
        </Alert>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <span className="text-sm text-slate-600">
          Sessão ativa como <strong className="text-slate-900">{adminUser}</strong>
          {onedrivePath ? ` · OneDrive: ${onedrivePath}` : ''}
        </span>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon fontSize="small" />}
          onClick={doLogout}
          sx={{ minHeight: 38 }}
        >
          Encerrar sessão
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 mb-6">
        <section className={UI_CLASSES.cardSurface}>
          <div className={UI_CLASSES.cardHeader}>
            <div>
              <h3 className={UI_CLASSES.cardHeaderTitle}>Disparar sincronização</h3>
              <span className={UI_CLASSES.cardHeaderSubtitle}>
                Pipeline MSTR → OneDrive → HIST e D-0
              </span>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon fontSize="small" />}
              disabled={syncBusy}
              onClick={() => startRun('full')}
              sx={{ minHeight: 40, justifyContent: 'flex-start', px: 2 }}
            >
              {starting && startType === 'full' ? 'Iniciando ciclo completo…' : 'Rodar ciclo completo'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon fontSize="small" />}
              disabled={syncBusy}
              onClick={() => startRun('login-logout')}
              sx={{ minHeight: 40, justifyContent: 'flex-start', px: 2 }}
            >
              Somente Login/Logout
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableViewIcon fontSize="small" />}
              disabled={syncBusy}
              onClick={() => startRun('d0')}
              sx={{ minHeight: 40, justifyContent: 'flex-start', px: 2 }}
            >
              Somente D-0 Absenteísmo
            </Button>
            {syncBusy && (
              <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8rem' }}>
                Execução em andamento — aguarde finalizar.
                {activeRunId ? (
                  <>
                    {' '}
                    (<span className="font-mono font-semibold">{activeRunId}</span>)
                  </>
                ) : null}
              </Alert>
            )}
          </div>
        </section>

        <section className={UI_CLASSES.cardSurface}>
          <div className={UI_CLASSES.cardHeader}>
            <div>
              <h3 className={UI_CLASSES.cardHeaderTitle}>Última execução</h3>
              <span className={UI_CLASSES.cardHeaderSubtitle}>
                Status e volume da carga mais recente
              </span>
            </div>
          </div>
          <div className="p-5">
            {initialLoading && !latest ? (
              <SkeletonCard
                variant="card"
                inline
                rows={4}
                ariaLabel="Carregando última execução"
              />
            ) : !latest ? (
              <p className="text-slate-500 text-sm py-6 m-0">
                Nenhuma execução registrada até o momento.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-5">
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Status</span>
                  <PillBadge variant={ADMIN_BADGE_VARIANT[adminStatusColor(latest.status)] || 'neutral'}>
                    {latest.status}
                  </PillBadge>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Tipo</span>
                  <span className="font-semibold text-sm text-slate-900">{latest.type}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Início</span>
                  <span className={`${UI_CLASSES.monoTabular} font-medium text-slate-700`}>
                    {formatDt(latest.startedAt)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-semibold mb-1">Duração</span>
                  <span className="font-mono tabular-nums font-semibold text-sm text-slate-900">
                    {formatDuration(latest.durationMs)}
                  </span>
                </div>
                {(details.recordsProcessed !== undefined || details.loginLogout?.recordsProcessed !== undefined ||
                  details.loadId !== undefined || details.d0?.loadId !== undefined) && (
                  <div className="col-span-full">
                    <Divider sx={{ mb: 1.5 }} />
                    <span className="block text-xs text-slate-500 font-semibold mb-2">
                      Dados Processados
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {(details.recordsProcessed !== undefined || details.loginLogout?.recordsProcessed !== undefined) && (
                        <div className={UI_CLASSES.statChipBox}>
                          <span>Logins/Logouts: </span>
                          <strong className="text-slate-900">
                            {formatMilhar(details.recordsProcessed ?? details.loginLogout?.recordsProcessed)} registros
                          </strong>
                        </div>
                      )}
                      {(details.loadId !== undefined || details.d0?.loadId !== undefined) && (
                        <div className={UI_CLASSES.statChipBox}>
                          <span>Carga D-0 (Banco): </span>
                          <strong className="font-mono text-slate-900">
                            ID {details.loadId ?? details.d0?.loadId}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {latest.error && (
                  <div className="col-span-full">
                    <Alert severity="error">{latest.error}</Alert>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <SectionCard
        title="Histórico de execuções"
        subtitle="Últimas 50 execuções registradas"
        loading={initialLoading}
      >
        <DataTable
          columns={RUN_COLUMNS}
          rows={runs}
          rowKey="id"
          loading={initialLoading}
          hidePagination
          emptyMessage="Nenhuma execução registrada no histórico."
          renderCell={(col, _row, raw) => {
            if (col.field === 'status') {
              const variant = ADMIN_BADGE_VARIANT[adminStatusColor(raw)] || 'neutral'
              return <PillBadge variant={variant}>{raw}</PillBadge>
            }
            if (col.field === 'startedAt' || col.field === 'finishedAt') return formatDt(raw)
            if (col.field === 'durationMs') return formatDuration(raw)
            return raw ?? '-'
          }}
        />
      </SectionCard>

      <SectionCard
        title="Logs de sincronização"
        subtitle="Visualização das últimas 400 linhas do arquivo selecionado"
      >
        <div className="p-4 flex gap-3 flex-wrap items-center">
          <TextField
            select
            size="small"
            label="Arquivo de log"
            value={selectedLog}
            onChange={(e) => setSelectedLog(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            {logFiles.map(f => (
              <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon fontSize="small" />}
            onClick={() => loadLog()}
            disabled={!selectedLog}
            sx={{ minHeight: 40 }}
          >
            Carregar Log
          </Button>
        </div>
        <Divider />
        <div className="p-4">
          {logLoading || (initialLoading && !logContent) ? (
            <SkeletonCard
              variant="console"
              inline
              rows={8}
              ariaLabel="Carregando linhas do log"
            />
          ) : (
            <pre className={UI_CLASSES.logConsole}>
              {logContent || 'Selecione um arquivo de log para visualizar.'}
            </pre>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
