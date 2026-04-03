/**
 * PaymentReceipt — Wavult Group
 *
 * Renders a printable/exportable receipt for any Wavult payment.
 * Can be used:
 * 1. Standalone viewer (pass receipt data as props)
 * 2. Auto-triggered after successful Revolut payment
 * 3. Embedded in FinanceHub as receipt browser
 *
 * Print/PDF: window.print() — the @media print CSS hides everything except the receipt
 */

import { useRef, useCallback } from 'react'

export interface PaymentReceiptData {
  id: string
  reference: string
  date: string                       // ISO string
  status: 'pending' | 'completed' | 'failed'
  direction: 'inbound' | 'outbound'
  amount: number                     // cents (e.g. 32500 = $325.00)
  currency: string
  description: string
  fromName?: string
  fromEmail?: string
  toName?: string
  toEntity?: string
  revolutPaymentId?: string
  metadata?: Record<string, string>
}

// ── Formatter helpers ─────────────────────────────────────────────────────────

function fmtAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZoneName: 'short',
  })
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: '⏳ Payment Pending',
    color: '#d97706',
    bg: '#fef3c7',
    borderColor: '#fde68a',
    badgeColor: '#92400e',
    badgeBg: '#fef3c7',
  },
  completed: {
    label: '✓ Payment Confirmed',
    color: '#16a34a',
    bg: '#f0fdf4',
    borderColor: '#bbf7d0',
    badgeColor: '#166534',
    badgeBg: '#dcfce7',
  },
  failed: {
    label: '✗ Payment Failed',
    color: '#dc2626',
    bg: '#fef2f2',
    borderColor: '#fecaca',
    badgeColor: '#991b1b',
    badgeBg: '#fee2e2',
  },
}

// ── Main component ────────────────────────────────────────────────────────────

export function PaymentReceipt({ receipt, onClose }: {
  receipt: PaymentReceiptData
  onClose?: () => void
}) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const statusCfg = STATUS_CONFIG[receipt.status]

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadHTML = useCallback(() => {
    const el = receiptRef.current
    if (!el) return

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receipt.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; }
    .receipt { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="receipt">${el.outerHTML}</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receipt.reference.replace(/[^a-zA-Z0-9-]/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [receipt.reference])

  const detailRows: Array<[string, string, boolean?]> = [
    ['Date & Time', fmtDate(receipt.date)],
    ['Transaction ID', receipt.id, true],
    ...(receipt.revolutPaymentId ? [['Revolut Ref', receipt.revolutPaymentId, true] as [string, string, boolean]] : []),
    ['Description', receipt.description],
    ...(receipt.fromName ? [['From', `${receipt.fromName}${receipt.fromEmail ? ` <${receipt.fromEmail}>` : ''}`] as [string, string]] : []),
    ...(receipt.toName || receipt.toEntity ? [['To', receipt.toName ?? receipt.toEntity ?? ''] as [string, string]] : []),
    ['Status', receipt.status.toUpperCase()],
    ...Object.entries(receipt.metadata ?? {}) as Array<[string, string]>,
  ]

  return (
    <>
      {/* Print-only CSS — injects globally via style tag */}
      <style>{`
        @media print {
          body > *:not(.wavult-receipt-print) { display: none !important; }
          .wavult-receipt-print { display: block !important; }
          .receipt-actions { display: none !important; }
        }
      `}</style>

      <div className="wavult-receipt-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
        <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

          {/* Action bar */}
          <div className="receipt-actions flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Payment Receipt</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadHTML}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-[#0A3D62] hover:bg-blue-500 transition-colors"
              >
                ⬇ Download
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
              >
                🖨️ Print
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[#8A8A9A] hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Receipt body */}
          <div className="overflow-y-auto flex-1">
            <div ref={receiptRef} className="bg-white">

              {/* Header */}
              <div className="px-8 pt-8 pb-6" style={{ background: '#FFFFFF' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-[#0A3D62] tracking-tight">
                      Wavult<span style={{ color: '#60a5fa' }}>.</span>
                    </div>
                    <div className="text-xs text-[#8A8A9A] mt-1">Wavult Group · Åvägen 9, 135 48 Tyresö, Sweden</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-xs font-mono text-[#8A8A9A] uppercase tracking-widest">Receipt</div>
                    <div className="text-sm font-bold text-[#0A3D62] mt-0.5">{receipt.reference}</div>
                  </div>
                </div>
              </div>

              {/* Status banner */}
              <div
                className="flex items-center justify-between px-8 py-3"
                style={{ background: statusCfg.bg, borderBottom: `1px solid ${statusCfg.borderColor}` }}
              >
                <span className="font-bold text-sm" style={{ color: statusCfg.color }}>
                  {statusCfg.label}
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: statusCfg.badgeBg, color: statusCfg.badgeColor }}
                >
                  {receipt.direction === 'inbound' ? '↓ INBOUND' : '↑ OUTBOUND'}
                </span>
              </div>

              {/* Amount block */}
              <div className="px-8 py-8 text-center border-b border-gray-100">
                <div className="text-5xl font-extrabold text-[#0A3D62] tracking-tight" style={{ letterSpacing: '-2px' }}>
                  {fmtAmount(receipt.amount, receipt.currency)}
                </div>
                <div className="text-sm text-[#8A8A9A] mt-2">
                  {receipt.currency} · {receipt.direction === 'inbound' ? 'Received' : 'Sent'}
                </div>
              </div>

              {/* Details table */}
              <div className="px-8 py-6">
                <table className="w-full">
                  <tbody>
                    {detailRows.map(([label, value, mono], i) => (
                      <tr key={i} className="border-b border-[#DDD5C5]">
                        <td className="py-2.5 pr-4 text-sm text-[#8A8A9A] font-medium w-2/5 align-top">{label}</td>
                        <td
                          className="py-2.5 text-sm font-semibold text-[#0A3D62] align-top"
                          style={mono ? { fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' } : {}}
                        >
                          {label === 'Status' ? (
                            <span className="font-bold" style={{ color: statusCfg.color }}>{value}</span>
                          ) : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-[#F5F0E8] border-t border-[#DDD5C5]">
                <p className="text-xs text-[#8A8A9A] leading-relaxed">
                  <strong className="text-[#8A8A9A]">This is an automated receipt from Wavult Group financial system.</strong>{' '}
                  Retain for your records. Questions? finance@wavult.com{' '}
                  · Generated {new Date().toLocaleString()}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Compact inline receipt card (for lists/feeds) ─────────────────────────────

export function PaymentReceiptCard({ receipt, onClick }: {
  receipt: PaymentReceiptData
  onClick?: () => void
}) {
  const statusCfg = STATUS_CONFIG[receipt.status]
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl border border-[#DDD5C5] bg-[#F0EBE1] hover:bg-[#F0EBE1] transition-colors"
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
        style={{ background: statusCfg.badgeBg, color: statusCfg.badgeColor }}
      >
        {receipt.direction === 'inbound' ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">{receipt.description}</span>
          <span className="text-sm font-bold flex-shrink-0" style={{ color: statusCfg.color }}>
            {receipt.direction === 'outbound' ? '−' : '+'}{fmtAmount(receipt.amount, receipt.currency)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[#8A8A9A] font-mono">{receipt.reference}</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: statusCfg.badgeBg, color: statusCfg.badgeColor }}>
            {receipt.status}
          </span>
          <span className="text-xs text-[#8A8A9A] ml-auto">{new Date(receipt.date).toLocaleDateString()}</span>
        </div>
      </div>
    </button>
  )
}
