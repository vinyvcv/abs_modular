function wrapValue(val) {
  if (val === null || val === undefined) return ''
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function cellValue(row, col) {
  let val = ''
  if (typeof col.field === 'function') {
    val = col.field(row)
  } else {
    const fieldName = col.field !== undefined ? col.field : col.name
    val = row[fieldName]
  }
  if (col.format) val = col.format(val, row)
  return wrapValue(val)
}

export function exportTable(rows, columns, filename) {
  if (!rows || rows.length === 0) return
  const headers = columns.map(c => wrapValue(c.label)).join(';')
  const body = rows.map(row => columns.map(col => cellValue(row, col)).join(';')).join('\r\n')
  downloadCsv('\ufeff' + headers + '\r\n' + body, filename)
}

export function exportMultipleTables(tables, filename) {
  if (!tables || tables.length === 0) return
  const sections = tables.map(table => {
    const titleLine = wrapValue(table.title)
    const headers = table.columns.map(c => wrapValue(c.label)).join(';')
    const body = table.rows.map(row => table.columns.map(col => cellValue(row, col)).join(';')).join('\r\n')
    return `${titleLine}\r\n${headers}\r\n${body}`
  })
  downloadCsv('\ufeff' + sections.join('\r\n\r\n\r\n'), filename)
}
