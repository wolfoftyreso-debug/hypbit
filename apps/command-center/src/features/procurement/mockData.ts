import { Supplier, PurchaseOrder, Contract, ApprovalRequest } from './types'

// ─── Leverantörer — fyll i verkliga belopp under avgMonthlySEK ───────────────
// avgMonthlySEK = din faktiska genomsnittliga kostnad per månad i SEK
// Lämna 0 om du inte vet ännu — visas som "–" i UI
export const SUPPLIERS: Supplier[] = [
  {
    id: 's1', name: 'AWS', category: 'Infrastruktur', country: 'USA',
    contact: 'aws-support@amazon.com', email: 'billing@amazon.com', status: 'aktiv',
    cost: { avgMonthlySEK: 0, note: 'Usage-based — varierar per månad' }
  },
  {
    id: 's2', name: 'Supabase', category: 'Tech/SaaS', country: 'USA',
    contact: 'support@supabase.io', email: 'billing@supabase.io', status: 'aktiv',
    cost: { avgMonthlySEK: 0, note: 'Self-hosted på ECS — ingen Supabase Cloud-avgift' }
  },
  {
    id: 's3', name: 'Cloudflare', category: 'Infrastruktur', country: 'USA',
    contact: 'support@cloudflare.com', email: 'billing@cloudflare.com', status: 'aktiv',
    cost: { avgMonthlySEK: 0 }
  },
  {
    id: 's4', name: 'Stripe', category: 'Tech/SaaS', country: 'USA',
    contact: 'support@stripe.com', email: 'billing@stripe.com', status: 'aktiv',
    cost: { avgMonthlySEK: 0, note: 'Transaktionsbaserad' }
  },
  {
    id: 's5', name: 'Revolut', category: 'Tech/SaaS', country: 'UK',
    contact: 'support@revolut.com', email: 'business@revolut.com', status: 'aktiv',
    cost: { avgMonthlySEK: 0 }
  },
  {
    id: 's6', name: 'Loopia', category: 'Infrastruktur', country: 'Sverige',
    contact: 'support@loopia.se', email: 'faktura@loopia.se', status: 'aktiv',
    cost: { avgMonthlySEK: 0 }
  },
  {
    id: 's7', name: '46elks', category: 'Tech/SaaS', country: 'Sverige',
    contact: 'hello@46elks.com', email: 'billing@46elks.com', status: 'aktiv',
    cost: { avgMonthlySEK: 0, note: 'Usage-based — SMS/röst per enhet' }
  },
  {
    id: 's8', name: 'Twilio', category: 'Tech/SaaS', country: 'USA',
    contact: 'help@twilio.com', email: 'billing@twilio.com', status: 'inaktiv',
    cost: { avgMonthlySEK: 0 }
  },
  {
    id: 's9', name: 'GitHub', category: 'Tech/SaaS', country: 'USA',
    contact: 'support@github.com', email: 'billing@github.com', status: 'aktiv',
    cost: { avgMonthlySEK: 0 }
  },
]

// ─── Inköpsordrar — tomma tills konfigurerat ─────────────────────────────────
// Registrera verkliga POs via procurement-modulen
export const PURCHASE_ORDERS: PurchaseOrder[] = []

// ─── Kontrakt — tomma tills konfigurerat ─────────────────────────────────────
// Registrera verkliga avtal via contracts-modulen
export const CONTRACTS: Contract[] = []

// ─── Godkännandeärenden — tomma tills konfigurerat ───────────────────────────
export const APPROVAL_REQUESTS: ApprovalRequest[] = []
