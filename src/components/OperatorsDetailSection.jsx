import { useMemo, useState } from 'react'
import { Button, Checkbox, Chip, Drawer, Divider, Popover, Tooltip } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { DataTable, SectionCard } from './DataTable'
import { renderOperadorCell } from './TableCells'
import { COLORS } from '../theme'
import { exportTable } from '../utils/export'
import { OPERADOR_COLUMNS, formatTime, formatTipoLoginText } from '../utils/format'

const MODE_STORAGE_KEY = 'abs-operators-view-mode'
const COLS_STORAGE_KEY = 'abs-operators-custom-cols'

function readSavedMode() {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY)
    if (v === 'full' || v === 'compact') return v
  } catch {
    return 'compact'
  }
  return 'compact'
}

function readSavedCustomCols() {
  try {
    const raw = localStorage.getItem(COLS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    return null
  }
  return null
}

const COMPACT_COLUMNS = [
  {
    field: 'nome_operador',
    label: 'Operador',
    sticky: false,
    noWrap: true
  },
  {
    field: 'segmento',
    label: 'Equipe / Segmento',
    noWrap: true
  },
  {
    field: 'hora_entrada',
    label: 'Jornada',
    align: 'center',
    mono: true,
    noWrap: true
  },
  {
    field: 'tipoLogin',
    label: 'Aderência Login',
    align: 'center'
  },
  {
    field: 'status',
    label: 'Status',
    align: 'center'
  },
  {
    field: 'pausa_atual',
    label: 'Pausa Atual',
    align: 'center'
  },
  {
    field: '_inspect',
    label: '',
    align: 'right',
    sortable: false
  }
]

const TRIAGE_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'falta', label: 'Em Falta' },
  { key: 'atrasado', label: 'Atrasados' },
  { key: 'pausa', label: 'Em Pausa' },
  { key: 'presente', label: 'Presentes' }
]

/**
 * Seção enxuta de Operadores com:
 * - Visão Enxuta (6 colunas, sem scroll horizontal) ou Completa (15 colunas configuráveis)
 * - Abas rápidas de triagem por exceção (Em Falta / Atrasados / Em Pausa / Presentes)
 * - Drawer lateral de detalhes com hierarquia, jornada e grade de pausas NR-17
 */
export function OperatorsDetailSection({
  operadores = [],
  loading = false,
  exportFilename = 'detalhamento_operadores.csv',
  filterChipLabel,
  onClearFilterChip,
  searchPlaceholder = 'Buscar colaborador, matrícula ou equipe...',
  className = 'mb-8'
}) {
  const [triage, setTriage] = useState('all')
  const [viewMode, setViewMode] = useState(() => readSavedMode())
  const [customFields, setCustomFields] = useState(
    () => readSavedCustomCols() || OPERADOR_COLUMNS.map((c) => c.field)
  )
  const [colsAnchor, setColsAnchor] = useState(null)
  const [selectedOp, setSelectedOp] = useState(null)

  const counts = useMemo(() => {
    let falta = 0
    let atrasado = 0
    let pausa = 0
    let presente = 0

    for (const op of operadores) {
      const status = String(op.status || '').toUpperCase().trim()
      if (status === 'EM_FALTA') falta++
      if (status === 'PRESENTE') presente++
      if (op.tipoLogin === 'LOGIN_ATRASADO') atrasado++
      if (op.pausa_atual) pausa++
    }

    return {
      all: operadores.length,
      falta,
      atrasado,
      pausa,
      presente
    }
  }, [operadores])

  const filteredRows = useMemo(() => {
    if (triage === 'all') return operadores
    return operadores.filter((op) => {
      const status = String(op.status || '').toUpperCase().trim()
      if (triage === 'falta') return status === 'EM_FALTA'
      if (triage === 'presente') return status === 'PRESENTE'
      if (triage === 'atrasado') return op.tipoLogin === 'LOGIN_ATRASADO'
      if (triage === 'pausa') return Boolean(op.pausa_atual)
      return true
    })
  }, [operadores, triage])

  const activeColumns = useMemo(() => {
    if (viewMode === 'compact') return COMPACT_COLUMNS
    const selected = OPERADOR_COLUMNS.filter((c) => customFields.includes(c.field))
    return selected.length > 0 ? selected : OPERADOR_COLUMNS.slice(0, 6)
  }, [viewMode, customFields])

  const handleModeChange = (nextMode) => {
    setViewMode(nextMode)
    try {
      localStorage.setItem(MODE_STORAGE_KEY, nextMode)
    } catch {
      // ignore storage errors
    }
  }

  const toggleCustomField = (field) => {
    setCustomFields((prev) => {
      const exists = prev.includes(field)
      if (exists && prev.length <= 2) return prev
      const next = exists ? prev.filter((f) => f !== field) : [...prev, field]
      try {
        localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  const renderCompactOrFullCell = (col, row, raw) => {
    if (viewMode === 'compact') {
      if (col.field === 'nome_operador') {
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 truncate">{row.nome_operador || '—'}</span>
            <span className="font-mono text-label text-slate-500 tabular-nums">{row.matricula}</span>
          </div>
        )
      }
      if (col.field === 'segmento') {
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-slate-800 truncate">{row.segmento || '—'}</span>
            {row.nome_supervisor && (
              <span className="text-label text-slate-500 truncate">{row.nome_supervisor}</span>
            )}
          </div>
        )
      }
      if (col.field === 'hora_entrada') {
        const real = formatTime(row.entradaReal)
        const isLate = row.tipoLogin === 'LOGIN_ATRASADO'
        return (
          <div className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <span className="text-slate-600">{row.hora_entrada || '—'}</span>
            <span className="text-slate-400">→</span>
            <span className={real === '-' ? 'text-slate-400' : isLate ? 'font-bold text-red-700' : 'font-semibold text-slate-900'}>
              {real}
            </span>
          </div>
        )
      }
      if (col.field === '_inspect') {
        return (
          <Tooltip title="Ver ficha completa" placement="left">
            <span className="inline-flex items-center justify-center text-slate-400 hover:text-hapvida-navy">
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </span>
          </Tooltip>
        )
      }
    }

    return renderOperadorCell(col, row, raw)
  }

  const hasCustomFilter = triage !== 'all' || Boolean(filterChipLabel)
  const pauseSlots = selectedOp?.pausas_resumo
    ? String(selectedOp.pausas_resumo).split('|').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <>
      <SectionCard
        title="Detalhamento de Operadores"
        subtitle={`${filteredRows.length.toLocaleString('pt-BR')} colaborador(es) listados · clique em uma linha para abrir a ficha`}
        loading={loading}
        className={className}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {filterChipLabel && onClearFilterChip && (
              <Chip
                color="primary"
                size="small"
                label={filterChipLabel}
                onDelete={onClearFilterChip}
                sx={{ fontWeight: 600 }}
              />
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              disabled={!filteredRows.length}
              onClick={() => exportTable(filteredRows, OPERADOR_COLUMNS, exportFilename)}
            >
              Exportar CSV
            </Button>
          </div>
        }
      >
        {/* Barra de triagem rápida por exceção */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-control bg-slate-100 border border-slate-200 overflow-x-auto max-w-full">
            {TRIAGE_TABS.map((tab) => {
              const active = triage === tab.key
              const count = counts[tab.key] || 0
              const isAlertCount = tab.key === 'falta' && count > 0
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTriage(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 ${
                    active
                      ? 'bg-white text-hapvida-navy shadow-card'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono text-label tabular-nums ${
                      isAlertCount
                        ? 'text-red-700 font-bold'
                        : active
                          ? 'text-hapvida-blue'
                          : 'text-slate-500'
                    }`}
                  >
                    {count.toLocaleString('pt-BR')}
                  </span>
                </button>
              )
            })}
          </div>

          <span className="hidden lg:inline text-xs text-slate-500">
            Visão {viewMode === 'compact' ? 'Enxuta (6 colunas)' : `Completa (${activeColumns.length} colunas)`}
          </span>
        </div>

        <DataTable
          columns={activeColumns}
          rows={filteredRows}
          rowKey="matricula"
          loading={loading}
          searchable
          searchPlaceholder={searchPlaceholder}
          densityToggle
          selectedRowKey={selectedOp?.matricula ?? null}
          onRowClick={(row) => setSelectedOp(row)}
          getRowTone={(row) =>
            String(row.status || '').toUpperCase().trim() === 'EM_FALTA' ? 'danger' : 'default'
          }
          toolbarExtra={
            <div className="flex items-center gap-2">
              <div
                className="inline-flex items-center gap-1 p-1 rounded-control bg-slate-100 border border-slate-200"
                role="group"
                aria-label="Modo de visualização das colunas"
              >
                <button
                  type="button"
                  onClick={() => handleModeChange('compact')}
                  aria-pressed={viewMode === 'compact'}
                  className={`px-2 py-1 rounded-badge text-label font-semibold whitespace-nowrap transition-colors duration-150 ${
                    viewMode === 'compact'
                      ? 'bg-white text-hapvida-navy shadow-card'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Enxuto
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('full')}
                  aria-pressed={viewMode === 'full'}
                  className={`px-2 py-1 rounded-badge text-label font-semibold whitespace-nowrap transition-colors duration-150 ${
                    viewMode === 'full'
                      ? 'bg-white text-hapvida-navy shadow-card'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completo
                </button>
              </div>

              {viewMode === 'full' && (
                <>
                  <button
                    type="button"
                    onClick={(e) => setColsAnchor(e.currentTarget)}
                    className="inline-flex items-center gap-1 h-control-sm px-2.5 rounded-control border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <ViewColumnOutlinedIcon sx={{ fontSize: 15 }} className="text-slate-500" />
                    <span>Colunas ({activeColumns.length}/{OPERADOR_COLUMNS.length})</span>
                  </button>
                  <Popover
                    open={Boolean(colsAnchor)}
                    anchorEl={colsAnchor}
                    onClose={() => setColsAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: {
                        p: 1.5,
                        width: 240,
                        maxHeight: 360,
                        overflowY: 'auto',
                        borderRadius: '10px',
                        border: `1px solid ${COLORS.border.hairline}`
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Colunas visíveis</span>
                      <button
                        type="button"
                        onClick={() => {
                          const all = OPERADOR_COLUMNS.map((c) => c.field)
                          setCustomFields(all)
                          try { localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(all)) } catch {}
                        }}
                        className="text-label font-semibold text-hapvida-blue hover:underline"
                      >
                        Todas
                      </button>
                    </div>
                    <div className="flex flex-col">
                      {OPERADOR_COLUMNS.map((col) => (
                        <label
                          key={col.field}
                          className="flex items-center gap-2 py-1 px-1 rounded hover:bg-slate-50 cursor-pointer text-xs text-slate-800"
                        >
                          <Checkbox
                            size="small"
                            checked={customFields.includes(col.field)}
                            onChange={() => toggleCustomField(col.field)}
                            sx={{ p: 0.25 }}
                          />
                          <span className="truncate">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </Popover>
                </>
              )}
            </div>
          }
          emptyActionLabel={hasCustomFilter ? 'Limpar filtros da tabela' : undefined}
          onEmptyAction={
            hasCustomFilter
              ? () => {
                  setTriage('all')
                  if (onClearFilterChip) onClearFilterChip()
                }
              : undefined
          }
          renderCell={renderCompactOrFullCell}
        />
      </SectionCard>

      {/* Slide-over Inspector: Ficha Completa do Colaborador */}
      <Drawer
        anchor="right"
        open={Boolean(selectedOp)}
        onClose={() => setSelectedOp(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            bgcolor: COLORS.surface.canvas,
            borderLeft: `1px solid ${COLORS.border.hairline}`
          }
        }}
      >
        {selectedOp && (
          <div className="h-full flex flex-col">
            <div className="p-5 bg-white border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-control bg-blue-50 text-hapvida-navy flex items-center justify-center shrink-0">
                  <PersonOutlineIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-slate-900 leading-snug truncate">
                    {selectedOp.nome_operador || 'Colaborador'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-mono tabular-nums font-semibold text-slate-700">
                      {selectedOp.matricula}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{selectedOp.segmento || 'Sem segmento'}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOp(null)}
                aria-label="Fechar ficha do colaborador"
                className="w-8 h-8 rounded-control border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center shrink-0 transition-colors"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              {/* Status & Pontualidade */}
              <div className="bg-white border border-slate-200 rounded-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status em Tempo Real</span>
                  {renderOperadorCell({ field: 'status' }, selectedOp, selectedOp.status)}
                </div>
                <Divider />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-label text-slate-500 mb-1">Previsto</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {selectedOp.hora_entrada || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-label text-slate-500 mb-1">Entrada Real</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {formatTime(selectedOp.entradaReal)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-label text-slate-500 mb-1">Limite</span>
                    <span className="font-mono tabular-nums text-sm font-semibold text-slate-700">
                      {selectedOp.hora_limite || '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Classificação de Login</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {formatTipoLoginText(selectedOp.tipoLogin)}
                  </span>
                </div>
              </div>

              {/* Pausas NR-17 */}
              <div className="bg-white border border-slate-200 rounded-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <PauseCircleOutlineIcon sx={{ fontSize: 16 }} className="text-hapvida-blue" />
                    <span>Pausas &amp; Grade NR-17</span>
                  </div>
                  {renderOperadorCell({ field: 'pausa_atual' }, selectedOp, selectedOp.pausa_atual)}
                </div>
                {pauseSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {pauseSlots.map((slot, idx) => (
                      <div
                        key={`${slot}-${idx}`}
                        className="p-2.5 rounded-control bg-slate-50 border border-slate-200 flex flex-col"
                      >
                        <span className="text-label text-slate-500">Pausa {idx + 1}</span>
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-900 mt-1 flex items-center gap-1">
                          <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} className="text-slate-400" />
                          {slot}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Sem grade de pausas cadastrada.</span>
                )}
              </div>

              {/* Hierarquia Organizacional */}
              <div className="bg-white border border-slate-200 rounded-card p-4 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-800 mb-1">
                  Hierarquia &amp; Estrutura
                </span>
                {[
                  { label: 'Supervisor', val: selectedOp.nome_supervisor },
                  { label: 'Coord. Atendimento', val: selectedOp.nome_coordenador_atend },
                  { label: 'Coord. Operação', val: selectedOp.nome_coordenador_op },
                  { label: 'Gerente', val: selectedOp.nome_gerente },
                  { label: 'Gestão', val: selectedOp.gestao },
                  { label: 'Segmento', val: selectedOp.segmento }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 py-1 border-b border-slate-100 last:border-b-0 text-xs"
                  >
                    <span className="text-slate-500 shrink-0">{item.label}</span>
                    <span className="font-semibold text-slate-900 text-right truncate">
                      {item.val || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}

export default OperatorsDetailSection
