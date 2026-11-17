import React, { useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material'

/**
 * Badge em estilo Pill moderno e suave (padrão executivo)
 */
export function PillBadge({
  children,
  variant = 'neutral',
  size = 'small',
  sx,
  ...props
}) {
  const palette = {
    neutral: { bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
    success: { bgcolor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
    warning: { bgcolor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' },
    danger: { bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
    error: { bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
    info: { bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' },
    purple: { bgcolor: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' }
  }

  const current = palette[variant] || palette.neutral
  const isSmall = size === 'small'

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        px: isSmall ? 1.25 : 1.75,
        py: isSmall ? 0.35 : 0.5,
        borderRadius: '9999px',
        fontSize: isSmall ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...current,
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  )
}

/**
 * Card com cabeçalho limpo, moderno e executivo (#f8fafc)
 * Substitui o cabeçalho brutalista azul-escuro sólido (#093b8f)
 */
export function SectionCard({ title, action, children, sx, contentSx }) {
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2.5,
        borderRadius: 2,
        borderColor: '#e2e8f0',
        bgcolor: '#ffffff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        ...sx
      }}
    >
      <Box
        sx={{
          bgcolor: '#f8fafc',
          color: '#1e293b',
          px: 2.5,
          py: 1.25,
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        {typeof title === 'string' ? (
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: '0.925rem',
              color: '#1e293b',
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </Typography>
        ) : (
          title
        )}
        {action && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{action}</Box>}
      </Box>
      <CardContent
        sx={{
          p: 0,
          '&:last-child': { pb: 0 },
          ...contentSx
        }}
      >
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Tabela de dados moderna com:
 * - Cabeçalhos neutros (#f1f5f9) com tipografia nítida (#475569)
 * - Zebra striping suave (#ffffff / #fcfdfe) e hover effect suave (#f8fafc)
 * - Suporte a colunas fixas (sticky left) para Matrícula / Login e Nome / Operador
 */
export function DataTable({
  columns,
  rows,
  rowKey,
  loading,
  dense = true,
  hidePagination = false,
  rowsPerPageOptions = [20, 50, 100],
  defaultRowsPerPage = 20,
  renderCell,
  maxHeight
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(hidePagination ? 1000 : defaultRowsPerPage)

  const keyFn = typeof rowKey === 'function'
    ? rowKey
    : (row, i) => row[rowKey] ?? i

  const visible = useMemo(
    () => (hidePagination ? rows : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)),
    [hidePagination, rows, page, rowsPerPage]
  )

  // Mapeamento automático de colunas fixas (sticky left)
  // Fixa colunas de identificação como matrícula/login e nome/operador para rolagem horizontal confortável
  const stickyMap = useMemo(() => {
    let currentLeft = 0
    let lastStickyIndex = -1

    const list = columns.map((col, idx) => {
      const field = String(col.field || col.name || '').toLowerCase()
      const isExplicit = col.sticky === 'left' || col.sticky === true
      const isAutoFirst = idx === 0 && ['matricula', 'login_genesys', 'login'].includes(field)
      const isAutoSecond = idx === 1 && ['nome_operador', 'nome', 'operador'].includes(field)
      const isSticky = isExplicit || isAutoFirst || isAutoSecond

      if (isSticky) {
        lastStickyIndex = idx
        const width = col.width || (idx === 0 ? 115 : 180)
        const left = currentLeft
        currentLeft += width
        return { isSticky: true, left, width }
      }
      return { isSticky: false, left: 0, width: col.width }
    })

    return list.map((item, idx) => ({
      ...item,
      isLastSticky: idx === lastStickyIndex
    }))
  }, [columns])

  return (
    <Box sx={{ position: 'relative', height: maxHeight ? '100%' : undefined, minHeight: 0 }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(2px)',
            zIndex: 10
          }}
        >
          <CircularProgress size={30} sx={{ color: '#093b8f' }} />
        </Box>
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
        <Table size={dense ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, colIdx) => {
                const stickyInfo = stickyMap[colIdx]
                const isSticky = stickyInfo?.isSticky
                return (
                  <TableCell
                    key={col.field || col.name || col.label}
                    align={col.align || 'left'}
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: '1px solid #e2e8f0',
                      py: 1.2,
                      px: 1.75,
                      whiteSpace: 'nowrap',
                      ...(isSticky
                        ? {
                            position: 'sticky',
                            left: stickyInfo.left,
                            zIndex: 4,
                            bgcolor: '#f1f5f9',
                            boxShadow: stickyInfo.isLastSticky
                              ? '3px 0 6px -2px rgba(0, 0, 0, 0.07)'
                              : undefined,
                            borderRight: stickyInfo.isLastSticky ? '1px solid #e2e8f0' : undefined
                          }
                        : {})
                    }}
                  >
                    {col.label}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((row, i) => {
              const isEven = i % 2 === 0
              const rowBg = isEven ? '#ffffff' : '#fcfdfe'

              return (
                <TableRow
                  key={keyFn(row, i)}
                  sx={{
                    bgcolor: rowBg,
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      bgcolor: '#f8fafc !important',
                      '& .sticky-table-cell': {
                        bgcolor: '#f8fafc !important'
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

                    return (
                      <TableCell
                        key={col.field || col.name || col.label}
                        align={col.align || 'left'}
                        className={isSticky ? 'sticky-table-cell' : undefined}
                        sx={{
                          py: dense ? 0.9 : 1.25,
                          px: 1.75,
                          fontSize: '0.8125rem',
                          color: '#334155',
                          borderBottom: '1px solid #f1f5f9',
                          whiteSpace: col.noWrap ? 'nowrap' : undefined,
                          ...(isSticky
                            ? {
                                position: 'sticky',
                                left: stickyInfo.left,
                                zIndex: 2,
                                bgcolor: rowBg,
                                fontWeight: colIdx === 0 ? 600 : 500,
                                boxShadow: stickyInfo.isLastSticky
                                  ? '3px 0 6px -2px rgba(0, 0, 0, 0.07)'
                                  : undefined,
                                borderRight: stickyInfo.isLastSticky ? '1px solid #e2e8f0' : undefined
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
                  sx={{ color: '#94a3b8', py: 5, fontSize: '0.875rem' }}
                >
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!hidePagination && (
        <TablePagination
          component="div"
          count={rows.length}
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
            borderTop: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            color: '#64748b',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem',
              color: '#64748b'
            }
          }}
        />
      )}
    </Box>
  )
}
