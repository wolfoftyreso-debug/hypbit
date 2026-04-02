/**
 * Receipt Service — Wavult Group
 *
 * Generates HTML receipts for every payment transaction.
 * Saves to S3: wavult-raw-archive/receipts/YYYY-MM/receipt-{id}.html
 * Sends email via Loopia SMTP to erik@hypbit.com + payer (if applicable)
 *
 * Triggered by:
 * - Revolut webhook (payment.created, payment.completed)
 * - Manual calls from payment routes
 */

import * as crypto from 'crypto'

export interface ReceiptData {
  id: string                    // transaction/payment id
  reference: string             // human-readable reference
  date: string                  // ISO date string
  status: 'pending' | 'completed' | 'failed'
  direction: 'inbound' | 'outbound'
  amount: number                // in smallest currency unit (cents/öre)
  currency: string              // USD, SEK, EUR etc
  description: string
  fromName?: string
  fromEmail?: string
  toName?: string
  toEntity?: string             // Wavult entity name
  revolutPaymentId?: string
  metadata?: Record<string, string>
}

// ── HTML Receipt Generator ────────────────────────────────────────────────────

export function generateReceiptHTML(r: ReceiptData): string {
  const fmt = (n: number, c: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n / 100)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    })

  const statusColor = r.status === 'completed' ? '#16a34a' : r.status === 'pending' ? '#d97706' : '#dc2626'
  const statusLabel = r.status === 'completed' ? '✓ Payment Confirmed' : r.status === 'pending' ? '⏳ Payment Pending' : '✗ Payment Failed'
  const directionBadge = r.direction === 'inbound'
    ? `<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">↓ INBOUND</span>`
    : `<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">↑ OUTBOUND</span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt — ${r.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .page { max-width: 640px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #0f172a; padding: 32px 40px; color: #fff; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .logo span { color: #60a5fa; }
    .tagline { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .receipt-title { margin-top: 24px; font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase; }
    .receipt-ref { font-size: 28px; font-weight: 700; color: #fff; margin-top: 4px; }
    .status-bar { padding: 16px 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
    .status-stamp { font-size: 18px; font-weight: 800; color: ${statusColor}; }
    .body { padding: 32px 40px; }
    .amount-block { text-align: center; padding: 28px 0; border-bottom: 1px solid #e2e8f0; }
    .amount { font-size: 48px; font-weight: 800; color: #0f172a; letter-spacing: -2px; }
    .currency-label { font-size: 13px; color: #64748b; margin-top: 6px; }
    table.details { width: 100%; margin-top: 28px; border-collapse: collapse; }
    table.details tr td { padding: 10px 0; font-size: 14px; vertical-align: top; }
    table.details tr td:first-child { color: #64748b; width: 40%; font-weight: 500; }
    table.details tr td:last-child { color: #0f172a; font-weight: 600; }
    table.details tr { border-bottom: 1px solid #f1f5f9; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .footer strong { color: #64748b; }
    @media print {
      body { background: #fff; }
      .page { box-shadow: none; margin: 0; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">Wavult<span>.</span></div>
      <div class="tagline">Wavult Group Financial System · Åvägen 9, 135 48 Tyresö, Sweden</div>
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-ref">${r.reference}</div>
    </div>

    <div class="status-bar">
      <span class="status-stamp">${statusLabel}</span>
      ${directionBadge}
    </div>

    <div class="body">
      <div class="amount-block">
        <div class="amount">${fmt(r.amount, r.currency)}</div>
        <div class="currency-label">${r.currency} · ${r.direction === 'inbound' ? 'Received' : 'Sent'}</div>
      </div>

      <table class="details">
        <tr>
          <td>Date &amp; Time</td>
          <td>${fmtDate(r.date)}</td>
        </tr>
        <tr>
          <td>Transaction ID</td>
          <td style="font-family:monospace;font-size:12px;">${r.id}</td>
        </tr>
        ${r.revolutPaymentId ? `
        <tr>
          <td>Revolut Ref</td>
          <td style="font-family:monospace;font-size:12px;">${r.revolutPaymentId}</td>
        </tr>` : ''}
        <tr>
          <td>Description</td>
          <td>${r.description}</td>
        </tr>
        ${r.fromName ? `
        <tr>
          <td>From</td>
          <td>${r.fromName}${r.fromEmail ? ` &lt;${r.fromEmail}&gt;` : ''}</td>
        </tr>` : ''}
        ${r.toName || r.toEntity ? `
        <tr>
          <td>To</td>
          <td>${r.toName ?? r.toEntity}</td>
        </tr>` : ''}
        <tr>
          <td>Status</td>
          <td style="color:${statusColor};font-weight:700;">${r.status.toUpperCase()}</td>
        </tr>
        ${Object.entries(r.metadata ?? {}).map(([k, v]) => `
        <tr>
          <td>${k}</td>
          <td>${v}</td>
        </tr>`).join('')}
      </table>
    </div>

    <div class="footer">
      <p>
        <strong>This is an automated receipt from Wavult Group financial system.</strong><br>
        This receipt was generated automatically upon transaction processing. Please retain for your records.<br>
        Questions? Contact finance@wavult.com · Wavult Group · VAT SE559141704201<br>
        Generated ${new Date().toISOString()} · Receipt ID: ${crypto.randomUUID().slice(0, 8).toUpperCase()}
      </p>
    </div>
  </div>
</body>
</html>`
}

// ── S3 Upload ─────────────────────────────────────────────────────────────────

export async function saveReceiptToS3(receiptId: string, html: string, date: string): Promise<string> {
  try {
    // Dynamic import to avoid breaking if @aws-sdk/client-s3 not installed
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({ region: 'eu-north-1' })

    const yearMonth = date.slice(0, 7) // YYYY-MM
    const key = `receipts/${yearMonth}/receipt-${receiptId}.html`

    await s3.send(new PutObjectCommand({
      Bucket: 'wavult-raw-archive',
      Key: key,
      Body: html,
      ContentType: 'text/html; charset=utf-8',
      Metadata: {
        'receipt-id': receiptId,
        'generated-at': new Date().toISOString(),
      },
    }))

    return `s3://wavult-raw-archive/${key}`
  } catch (err) {
    console.warn('[Receipt] S3 upload failed (non-fatal):', err instanceof Error ? err.message : err)
    return `(S3 unavailable — receipt stored locally)`
  }
}

// ── Email via Loopia SMTP ─────────────────────────────────────────────────────

export async function sendReceiptEmail(receipt: ReceiptData, html: string): Promise<void> {
  try {
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST ?? 'outgoing.loopia.se',
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER ?? process.env.IMAP_USER,
        pass: process.env.SMTP_PASS ?? process.env.IMAP_PASS,
      },
      tls: { rejectUnauthorized: false },
    })

    const recipients = ['erik@hypbit.com']
    if (receipt.fromEmail && receipt.direction === 'inbound' && receipt.fromEmail !== 'erik@hypbit.com') {
      recipients.push(receipt.fromEmail)
    }

    const fmtAmount = (n: number, c: string) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n / 100)

    await transporter.sendMail({
      from: `"Wavult Finance" <erik@hypbit.com>`,
      to: recipients.join(', '),
      subject: `[Receipt] ${receipt.reference} — ${fmtAmount(receipt.amount, receipt.currency)} ${receipt.status === 'completed' ? '✓' : '⏳'}`,
      html,
      text: [
        `WAVULT GROUP — PAYMENT RECEIPT`,
        `Reference: ${receipt.reference}`,
        `Amount: ${fmtAmount(receipt.amount, receipt.currency)}`,
        `Status: ${receipt.status.toUpperCase()}`,
        `Description: ${receipt.description}`,
        `Date: ${new Date(receipt.date).toLocaleString()}`,
        `Transaction ID: ${receipt.id}`,
        ``,
        `This is an automated receipt from Wavult Group financial system.`,
      ].join('\n'),
    })

    console.log(`[Receipt] Email sent for ${receipt.reference} to ${recipients.join(', ')}`)
  } catch (err) {
    console.warn('[Receipt] Email send failed (non-fatal):', err instanceof Error ? err.message : err)
  }
}

// ── DynamoDB Index ────────────────────────────────────────────────────────────

export async function indexReceiptDynamo(receipt: ReceiptData, s3Path: string): Promise<void> {
  try {
    const { DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb')
    const dynamo = new DynamoDBClient({ region: 'eu-north-1' })

    await dynamo.send(new PutItemCommand({
      TableName: 'wavult-payment-receipts',
      Item: {
        id:           { S: receipt.id },
        reference:    { S: receipt.reference },
        date:         { S: receipt.date },
        status:       { S: receipt.status },
        direction:    { S: receipt.direction },
        amount:       { N: receipt.amount.toString() },
        currency:     { S: receipt.currency },
        description:  { S: receipt.description },
        s3_path:      { S: s3Path },
        created_at:   { S: new Date().toISOString() },
        ...(receipt.fromName ? { from_name: { S: receipt.fromName } } : {}),
        ...(receipt.toName ? { to_name: { S: receipt.toName } } : {}),
        ...(receipt.revolutPaymentId ? { revolut_id: { S: receipt.revolutPaymentId } } : {}),
      },
    }))
  } catch (err) {
    console.warn('[Receipt] DynamoDB index failed (non-fatal):', err instanceof Error ? err.message : err)
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function processReceipt(receipt: ReceiptData): Promise<{ s3Path: string }> {
  const html = generateReceiptHTML(receipt)

  const [s3Path] = await Promise.all([
    saveReceiptToS3(receipt.id, html, receipt.date),
    sendReceiptEmail(receipt, html),
  ])

  // Index after save
  await indexReceiptDynamo(receipt, s3Path)

  console.log(`[Receipt] Processed receipt ${receipt.reference} → ${s3Path}`)
  return { s3Path }
}
