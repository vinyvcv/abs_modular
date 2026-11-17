import React, { useMemo, useState } from 'react'
import {
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline'
import TableRowsIcon from '@mui/icons-material/TableRows'
import { COLORS, SHADOWS, TYPOGRAPHY, UI_CLASSES } from '../theme'
import { SkeletonBar } from './ui/SkeletonCard'

const DENSITY_STORAGE_KEY = 'abs-table-density'

function readSavedDensity(defaultDense) {
  try {
    const saved = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (saved === 'compact') return true
    if (saved === 'comfortable') return false
  } catch {
    return defaultDense
  }
  return defaultDense
}

function normalizeSortValue(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return Number.isFinite(val) ? val : null
  const str = String(val).trim()
  if (/^-?\d+([.,]\d+)?%?$/.test(str)) {
    const n = Number(str.replace('%', '').replace(',', '.'))
    if (Number.isFinite(n)) return n
  }
  return str.toLowerCase()
}

function isSummaryRow(row) {
  const seg = String(row?.Segmento ?? '').toUpperCase().trim()
  const sit = String(row?.Situação ?? '').toUpperCase().trim()
  const sup = String(row?.Supervisor ?? '').toUpperCase().trim()
  return seg === 'TOTAL GERAL' || sit === 'TOTAL' || sup === 'TOTAL'
}

/**
 * Indicador de status corporativo baseado nas classes compartilhadas do tema
 */
export function PillBadge({
  children,
  variant = 'neutral',
  size = 'small',
  className = '',
  sx,
  ...props
}) {
  const variantClass = UI_CLASSES.badgeVariants[variant] || UI_CLASSES.badgeVariants.neutral
  const sizeClass = UI_CLASSES.badgeSizes[size] || UI_CLASSES.badgeSizes.small

  return (
    <Box
      component="span"
      className={`${UI_CLASSES.badgeBase} ${sizeClass} ${variantClass} ${className}`.trim()}
      sx={sx}
      {...props}
    >
      {children}
    </Box>
  )
}

/**
 * Card executivo de seção usando tokens e classes Tailwind compartilhadas
 */
export function SectionCard({ title, subtitle, action, loading = false, children, className = '', sx, contentSx }) {
  return (
    <Box
      component="section"
      className={`${UI_CLASSES.cardSurface} mb-6 ${className}`.trim()}
      sx={sx}
    >
      <div className={UI_CLASSES.cardHeader}>
        <div className="min-w-0 flex-1">
          {typeof title === 'string' ? (
            <h3 className={UI_CLASSES.cardHeaderTitle}>{title}</h3>
          ) : (
            title
          )}
          {subtitle && (
            <span className={UI_CLASSES.cardHeaderSubtitle}>{subtitle}</span>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {action}
          </div>
        )}
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              bgcolor: 'transparent',
              '& .MuiLinearProgress-bar': { bgcolor: COLORS.brand.blue }
            }}
          />
        )}
      </div>
      <Box sx={{ p: 0, ...contentSx }}>
        {children}
      </Box>
    </Box>
  )
}

/**
 * Tabela analítica de alta densidade com busca instantânea, ordenação por coluna e controle de densidade
 */
export function DataTable({
  columns,
  rows,
  rowKey,
  loading,
  dense = true,
  hidePagination = false,
  searchable = false,
  searchPlaceholder = 'Buscar na tabela...',
  sortable = true,
  densityToggle = false,
  toolbarExtra = null,
  rowsPerPageOptions = [20, 50, 100],
  defaultRowsPerPage = 20,
  renderCell,
  getRowTone,
  onRowClick,
  selectedRowKey,
  footer,
  maxHeight,
  emptyMessage = 'Nenhum registro encontrado com os filtros aplicados.',
  emptyActionLabel,
  onEmptyAction
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(hidePagination ? 1000 : defaultRowsPerPage)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortState, setSortState] = useState({ field: null, dir: 'asc' })
  const [isDense, setIsDense] = useState(() => (densityToggle ? readSavedDensity(dense) : dense))

  const effectiveDense = densityToggle ? isDense : dense
  const showToolbar = searchable || densityToggle || Boolean(toolbarExtra)

  const toggleDensity = (nextDense) => {
    setIsDense(nextDense)
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, nextDense ? 'compact' : 'comfortable')
    } catch {
      // Ignorar erro de storage em navegação privada
    }
  }

  const handleSortClick = (colKey) => {
    if (!sortable || !colKey) return
    setPage(0)
    setSortState((prev) => {
      if (prev.field !== colKey) return { field: colKey, dir: 'asc' }
      if (prev.dir === 'asc') return { field: colKey, dir: 'desc' }
      return { field: null, dir: 'asc' }
    })
  }

  const keyFn = typeof rowKey === 'function'
    ? rowKey
    : (row, i) => row[rowKey] ?? i

  const filteredAndSortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = !q
      ? rows
      : rows.filter((row) =>
          columns.some((col) => {
            const field = col.field || col.name
            const val = typeof field === 'function' ? field(row) : row?.[field]
            return val !== null && val !== undefined && String(val).toLowerCase().includes(q)
          })
        )

    if (!sortState.field) return base

    const activeCol = columns.find((c) => (c.field || c.name) === sortState.field)
    if (!activeCol) return base

    const bodyRows = []
    const totalRows = []
    for (const row of base) {
      if (isSummaryRow(row)) totalRows.push(row)
      else bodyRows.push(row)
    }

    const field = activeCol.field || activeCol.name
    const factor = sortState.dir === 'asc' ? 1 : -1

    bodyRows.sort((a, b) => {
      const rawA = activeCol.sortValue
        ? activeCol.sortValue(a)
        : (typeof field === 'function' ? field(a) : a?.[field])
      const rawB = activeCol.sortValue
        ? activeCol.sortValue(b)
        : (typeof field === 'function' ? field(b) : b?.[field])
      const va = normalizeSortValue(rawA)
      const vb = normalizeSortValue(rawB)
      if (va === null && vb === null) return 0
      if (va === null) return 1
      if (vb === null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
      return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }) * factor
    })

    return [...bodyRows, ...totalRows]
  }, [rows, columns, searchQuery, sortState])

  const visible = useMemo(
    () => (
      hidePagination
        ? filteredAndSortedRows
        : filteredAndSortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    ),
    [hidePagination, filteredAndSortedRows, page, rowsPerPage]
  )

  const stickyMap = useMemo(() => {
    const items = columns.reduce((acc, col, idx) => {
      const field = String(col.field || col.name || '').toLowerCase()
      const isExplicit = col.sticky === 'left' || col.sticky === true
      const isAutoFirst = idx === 0 && ['matricula', 'login_genesys', 'login'].includes(field)
      const isAutoSecond = idx === 1 && ['nome_operador', 'nome', 'operador'].includes(field)
      const isSticky = col.sticky !== false && (isExplicit || isAutoFirst || isAutoSecond)

      const prevStickyLeft = acc.reduce((sum, item) => (item.isSticky ? sum + item.width : sum), 0)
      const width = col.width || (idx === 0 ? 115 : 180)
      acc.push({
        isSticky,
        left: isSticky ? prevStickyLeft : 0,
        width
      })
      return acc
    }, [])

    const lastStickyIndex = items.reduce((lastIdx, item, idx) => (item.isSticky ? idx : lastIdx), -1)

    return items.map((item, idx) => ({
      ...item,
      isLastSticky: idx === lastStickyIndex
    }))
  }, [columns])

  const showSkeleton = Boolean(loading && rows.length === 0)
  const showRevalidatingBar = Boolean(loading && rows.length > 0)

  return (
    <div className="relative min-h-0 flex flex-col" style={maxHeight ? { height: maxHeight } : undefined}>
      {showRevalidatingBar && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 11,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': { bgcolor: COLORS.brand.blue }
          }}
        />
      )}

      {showToolbar && (
        <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
          {searchable ? (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <SearchIcon
                sx={{ fontSize: 16 }}
                className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full h-control-sm pl-9 pr-8 rounded-control border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:bg-white focus:border-hapvida-blue focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(0)
                  }}
                  aria-label="Limpar busca na tabela"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <span className="text-xs text-slate-500 tabular-nums">
                {filteredAndSortedRows.length.toLocaleString('pt-BR')} resultado(s)
              </span>
            )}

            {toolbarExtra}

            {densityToggle && (
              <div
                className="inline-flex items-center gap-1 p-1 rounded-control bg-slate-100 border border-slate-200"
                role="group"
                aria-label="Densidade da tabela"
              >
                <Tooltip title="Modo Compacto (36px)">
                  <button
                    type="button"
                    onClick={() => toggleDensity(true)}
                    aria-pressed={effectiveDense}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-badge text-label font-semibold transition-colors duration-150 ${
                      effectiveDense
                        ? 'bg-white text-hapvida-navy shadow-card'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ViewHeadlineIcon sx={{ fontSize: 14 }} />
                    <span className="hidden sm:inline">Compacto</span>
                  </button>
                </Tooltip>
                <Tooltip title="Modo Confortável (44px)">
                  <button
                    type="button"
                    onClick={() => toggleDensity(false)}
                    aria-pressed={!effectiveDense}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-badge text-label font-semibold transition-colors duration-150 ${
                      !effectiveDense
                        ? 'bg-white text-hapvida-navy shadow-card'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TableRowsIcon sx={{ fontSize: 14 }} />
                    <span className="hidden sm:inline">Confortável</span>
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}

      <TableContainer
        sx={{
          overflowX: 'auto',
          ...(maxHeight
            ? {
                overflowY: 'auto',
                maxHeight,
                height: maxHeight
              }
            : {})
        }}
      >
        <Table size={effectiveDense ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, colIdx) => {
                const stickyInfo = stickyMap[colIdx]
                const isSticky = stickyInfo?.isSticky
                const colKey = typeof (col.field || col.name) === 'string' ? (col.field || col.name) : null
                const canSort = Boolean(sortable && colKey && col.sortable !== false)
                const isSorted = canSort && sortState.field === colKey
                const align = col.align || 'left'

                return (
                  <TableCell
                    key={col.field || col.name || col.label}
                    align={align}
                    sortDirection={isSorted ? sortState.dir : false}
                    sx={isSticky ? {
                      position: 'sticky',
                      left: stickyInfo.left,
                      zIndex: 4,
                      bgcolor: COLORS.surface.subtle,
                      boxShadow: stickyInfo.isLastSticky ? SHADOWS.stickyLeft : undefined,
                      borderRight: stickyInfo.isLastSticky ? `1px solid ${COLORS.border.hairline}` : undefined
                    } : undefined}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => handleSortClick(colKey)}
                        className={`inline-flex items-center gap-1 text-left font-semibold uppercase tracking-[0.04em] transition-colors duration-150 ${
                          isSorted ? 'text-hapvida-navy' : 'text-slate-600 hover:text-slate-900'
                        } ${align === 'right' ? 'flex-row-reverse' : ''}`}
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortState.dir === 'asc' ? (
                            <ArrowUpwardIcon sx={{ fontSize: 13 }} className="text-hapvida-blue shrink-0" />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 13 }} className="text-hapvida-blue shrink-0" />
                          )
                        ) : (
                          <UnfoldMoreIcon sx={{ fontSize: 13 }} className="text-slate-400 opacity-60 shrink-0" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <TableRow
                  key={`sk-${rIdx}`}
                  className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                >
                  {columns.map((col) => {
                    const isAligned = col.align === 'right' || col.align === 'center'
                    const alignClass =
                      col.align === 'right'
                        ? 'w-12 ml-auto'
                        : col.align === 'center'
                          ? 'w-12 mx-auto'
                          : 'w-4/5'
                    return (
                      <TableCell
                        key={col.field || col.name || col.label}
                        align={col.align || 'left'}
                        sx={{ py: effectiveDense ? 1.15 : 1.5, px: 1.75 }}
                      >
                        <SkeletonBar className={`h-4 ${isAligned ? alignClass : 'w-4/5'}`} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <>
                {visible.map((row, i) => {
                  const rKey = keyFn(row, i)
                  const summary = isSummaryRow(row)
                  const rowTone = !summary && getRowTone ? getRowTone(row) : 'default'
                  const isDangerRow = rowTone === 'danger'
                  const isSelected = selectedRowKey != null && rKey === selectedRowKey
                  const isClickable = Boolean(onRowClick && !summary)
                  const isEven = i % 2 === 0
                  const rowBg = summary
                    ? COLORS.surface.subtle
                    : isSelected
                      ? COLORS.surface.activeFilter
                      : isDangerRow
                        ? (isEven ? COLORS.surface.alertEven : COLORS.surface.alertOdd)
                        : (isEven ? COLORS.surface.card : COLORS.surface.canvas)
                  const hoverBg = isSelected
                    ? COLORS.surface.activeFilterHover
                    : isDangerRow
                      ? COLORS.surface.alertHover
                      : COLORS.surface.subtle

                  return (
                    <TableRow
                      key={rKey}
                      onClick={isClickable ? () => onRowClick(row) : undefined}
                      className={!summary && !isDangerRow && !isSelected ? (isEven ? 'bg-white' : 'bg-slate-50') : undefined}
                      sx={{
                        bgcolor: rowBg,
                        cursor: isClickable ? 'pointer' : undefined,
                        ...(summary
                          ? {
                              borderTop: `2px solid ${COLORS.border.input}`,
                              fontWeight: 700
                            }
                          : {}),
                        transition: 'background-color 140ms cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: `${hoverBg} !important`,
                          '& .sticky-table-cell': {
                            bgcolor: `${hoverBg} !important`
                          }
                        }
                      }}
                    >
                      {columns.map((col, colIdx) => {
                        const field = col.field || col.name
                        const raw = typeof field === 'function' ? field(row) : row[field]
                        const content = renderCell
                          ? renderCell(col, row, raw)
                          : (col.format ? col.format(raw, row) : raw)

                        const stickyInfo = stickyMap[colIdx]
                        const isSticky = stickyInfo?.isSticky
                        const isNumeric = col.numeric || col.align === 'right'

                        return (
                          <TableCell
                            key={col.field || col.name || col.label}
                            align={col.align || 'left'}
                            className={isSticky ? 'sticky-table-cell' : undefined}
                            sx={{
                              py: effectiveDense ? 1 : 1.5,
                              px: 1.75,
                              whiteSpace: col.noWrap ? 'nowrap' : undefined,
                              ...(col.mono
                                ? {
                                    fontFamily: TYPOGRAPHY.fonts.mono,
                                    fontSize: '0.765rem'
                                  }
                                : {}),
                              ...(isNumeric ? { fontWeight: summary ? 700 : 500 } : {}),
                              ...(isSticky
                                ? {
                                    position: 'sticky',
                                    left: stickyInfo.left,
                                    zIndex: 2,
                                    bgcolor: rowBg,
                                    fontWeight: colIdx === 0 || summary ? 600 : 500,
                                    boxShadow: stickyInfo.isLastSticky ? SHADOWS.stickyLeft : undefined,
                                    borderRight: stickyInfo.isLastSticky ? `1px solid ${COLORS.border.hairline}` : undefined
                                  }
                                : {})
                            }}
                          >
                            {content}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
                {!visible.length && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={{ color: COLORS.text.subtle, py: 6, fontSize: TYPOGRAPHY.scale.md }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span>
                          {searchQuery
                            ? `Nenhum resultado para "${searchQuery}".`
                            : emptyMessage}
                        </span>
                        {searchQuery ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('')
                              setPage(0)
                            }}
                            className="px-3 py-1 rounded-control border border-slate-300 bg-white text-xs font-semibold text-hapvida-navy hover:bg-slate-50 transition-colors"
                          >
                            Limpar busca
                          </button>
                        ) : emptyActionLabel && onEmptyAction ? (
                          <button
                            type="button"
                            onClick={onEmptyAction}
                            className="px-3 py-1 rounded-control border border-slate-300 bg-white text-xs font-semibold text-hapvida-navy hover:bg-slate-50 transition-colors"
                          >
                            {emptyActionLabel}
                          </button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!hidePagination && (
        <TablePagination
          component="div"
          count={filteredAndSortedRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="Linhas:"
          sx={{
            borderTop: `1px solid ${COLORS.border.hairline}`,
            bgcolor: COLORS.surface.card,
            color: COLORS.text.muted,
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: TYPOGRAPHY.scale.sm,
              color: COLORS.text.muted,
              fontVariantNumeric: 'tabular-nums'
            }
          }}
        />
      )}
      {footer || null}
    </div>
  )
}
