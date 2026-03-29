// Export service — PDF och CSV för alla viktiga rapporter
// Använder browser's print API för PDF, och native CSV-generering

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel'
  title: string
  filename: string
  data?: Record<string, unknown>[]
  columns?: { key: string; label: string }[]
}

export function exportToCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string): void {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(elementId: string, title: string, _filename: string): void {
  const printContents = document.getElementById(elementId)?.innerHTML
  if (!printContents) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; color: #1C1C1E; padding: 32px; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .meta { font-size: 12px; color: #6B7280; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 10px 12px; background: #F9FAFB; border-bottom: 2px solid #E5E7EB; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #F3F4F6; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Genererad: ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} | Wavult OS</div>
      ${printContents}
    </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
}

export function generateSIEFile(transactions: {
  date: string
  account: string
  amount: number
  description: string
  reference?: string
}[], companyName: string, orgNr: string): string {
  // SIE4 format för ekonomisystem-export (Fortnox, Visma, etc.)
  const lines: string[] = [
    '#FLAGGA 0',
    `#PROGRAM "Wavult OS" 1.0`,
    `#FORMAT PC8`,
    `#GEN ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    `#SIETYP 4`,
    `#FNAMN "${companyName}"`,
    `#ORGNR ${orgNr}`,
    '',
  ]

  // Verifikationer
  transactions.forEach((tx, i) => {
    const date = tx.date.replace(/-/g, '')
    lines.push(`#VER A ${i + 1} ${date} "${tx.description}"`)
    lines.push(`{`)
    // Debet/Kredit baserat på belopp
    const absAmount = Math.abs(tx.amount)
    if (tx.amount > 0) {
      lines.push(`  #TRANS 1510 {} ${absAmount.toFixed(2)} ${date} "${tx.description}"`)
      lines.push(`  #TRANS 3000 {} -${absAmount.toFixed(2)} ${date} "${tx.description}"`)
    } else {
      lines.push(`  #TRANS 2440 {} -${absAmount.toFixed(2)} ${date} "${tx.description}"`)
      lines.push(`  #TRANS 4000 {} ${absAmount.toFixed(2)} ${date} "${tx.description}"`)
    }
    lines.push(`}`)
  })

  return lines.join('\n')
}

export function downloadSIE(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.se`
  a.click()
  URL.revokeObjectURL(url)
}
