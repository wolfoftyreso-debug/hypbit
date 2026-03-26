import { Supplier, PurchaseOrder, Contract, ApprovalRequest } from './types'

export const SUPPLIERS: Supplier[] = [
  { id: 's1',  name: 'AWS',        category: 'Infrastruktur', country: 'USA',     contact: 'aws-support@amazon.com',   email: 'billing@amazon.com',         status: 'aktiv' },
  { id: 's2',  name: 'Supabase',   category: 'Tech/SaaS',     country: 'USA',     contact: 'support@supabase.io',      email: 'billing@supabase.io',        status: 'aktiv' },
  { id: 's3',  name: 'Cloudflare', category: 'Infrastruktur', country: 'USA',     contact: 'support@cloudflare.com',   email: 'billing@cloudflare.com',     status: 'aktiv' },
  { id: 's4',  name: 'Stripe',     category: 'Tech/SaaS',     country: 'USA',     contact: 'support@stripe.com',       email: 'billing@stripe.com',         status: 'aktiv' },
  { id: 's5',  name: 'Revolut',    category: 'Tech/SaaS',     country: 'UK',      contact: 'support@revolut.com',      email: 'business@revolut.com',       status: 'aktiv' },
  { id: 's6',  name: 'Loopia',     category: 'Infrastruktur', country: 'Sverige', contact: 'support@loopia.se',        email: 'faktura@loopia.se',          status: 'aktiv' },
  { id: 's7',  name: '46elks',     category: 'Tech/SaaS',     country: 'Sverige', contact: 'hello@46elks.com',         email: 'billing@46elks.com',         status: 'aktiv' },
  { id: 's8',  name: 'Twilio',     category: 'Tech/SaaS',     country: 'USA',     contact: 'help@twilio.com',          email: 'billing@twilio.com',         status: 'inaktiv' },
  { id: 's9',  name: 'GitHub',     category: 'Tech/SaaS',     country: 'USA',     contact: 'support@github.com',       email: 'billing@github.com',         status: 'aktiv' },
  { id: 's10', name: 'Fortnox',    category: 'Redovisning',   country: 'Sverige', contact: 'support@fortnox.se',       email: 'faktura@fortnox.se',         status: 'aktiv' },
]

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 'po1', supplierId: 's1',  supplierName: 'AWS',        description: 'ECS + RDS eu-north-1 Q1 2026',         amount: 24500,  currency: 'SEK', status: 'betald',   date: '2026-01-15', createdBy: 'Erik Svensson' },
  { id: 'po2', supplierId: 's2',  supplierName: 'Supabase',   description: 'Pro plan — databas & auth',             amount: 850,    currency: 'USD', status: 'betald',   date: '2026-01-01', createdBy: 'Johan Berglund' },
  { id: 'po3', supplierId: 's3',  supplierName: 'Cloudflare', description: 'Workers + R2 lagring',                  amount: 520,    currency: 'USD', status: 'godkänd',  date: '2026-02-01', createdBy: 'Johan Berglund' },
  { id: 'po4', supplierId: 's9',  supplierName: 'GitHub',     description: 'GitHub Teams — 5 seats',               amount: 2200,   currency: 'SEK', status: 'godkänd',  date: '2026-02-10', createdBy: 'Johan Berglund' },
  { id: 'po5', supplierId: 's10', supplierName: 'Fortnox',    description: 'Bokföringsprogram årsavgift',           amount: 5990,   currency: 'SEK', status: 'skickad',  date: '2026-03-01', createdBy: 'Winston Bjarnemark' },
  { id: 'po6', supplierId: 's7',  supplierName: '46elks',     description: 'SMS-krediter Thailand workcamp',        amount: 3200,   currency: 'SEK', status: 'skickad',  date: '2026-03-10', createdBy: 'Leon Russo' },
  { id: 'po7', supplierId: 's1',  supplierName: 'AWS',        description: 'Utökat ECS-kluster QuixZoom beta',      amount: 48000,  currency: 'SEK', status: 'utkast',   date: '2026-03-20', createdBy: 'Johan Berglund' },
  { id: 'po8', supplierId: 's4',  supplierName: 'Stripe',     description: 'Stripe Connect onboarding tillägg',     amount: 12500,  currency: 'SEK', status: 'utkast',   date: '2026-03-22', createdBy: 'Erik Svensson' },
]

const today = new Date('2026-03-26')

function daysFromToday(days: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysAgo(days: number): string {
  return daysFromToday(-days)
}

export const CONTRACTS: Contract[] = [
  { id: 'c1', supplierId: 's1',  supplierName: 'AWS',        startDate: '2025-01-01', endDate: '2026-12-31', autoRenewal: true,  annualValue: 120000, currency: 'SEK', description: 'AWS Enterprise Agreement' },
  { id: 'c2', supplierId: 's2',  supplierName: 'Supabase',   startDate: '2025-06-01', endDate: daysFromToday(60), autoRenewal: false, annualValue: 12000,  currency: 'SEK', description: 'Supabase Pro SLA' },
  { id: 'c3', supplierId: 's3',  supplierName: 'Cloudflare', startDate: '2025-01-01', endDate: '2027-01-01', autoRenewal: true,  annualValue: 8500,   currency: 'SEK', description: 'Cloudflare Business' },
  { id: 'c4', supplierId: 's4',  supplierName: 'Stripe',     startDate: '2024-03-01', endDate: daysFromToday(45), autoRenewal: false, annualValue: 0,      currency: 'SEK', description: 'Stripe Platform Agreement (usage-based)' },
  { id: 'c5', supplierId: 's6',  supplierName: 'Loopia',     startDate: '2024-07-01', endDate: daysFromToday(20), autoRenewal: true,  annualValue: 4800,   currency: 'SEK', description: 'Domän & hosting — hypbit.com, wavult.com' },
  { id: 'c6', supplierId: 's9',  supplierName: 'GitHub',     startDate: '2025-02-01', endDate: '2026-11-30', autoRenewal: true,  annualValue: 5500,   currency: 'SEK', description: 'GitHub Teams' },
  { id: 'c7', supplierId: 's10', supplierName: 'Fortnox',    startDate: '2025-01-01', endDate: '2026-12-31', autoRenewal: true,  annualValue: 5990,   currency: 'SEK', description: 'Fortnox Bokföring + Lön' },
  { id: 'c8', supplierId: 's5',  supplierName: 'Revolut',    startDate: '2025-09-01', endDate: daysFromToday(80), autoRenewal: false, annualValue: 3600,   currency: 'SEK', description: 'Revolut Business Premium' },
]

export const APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'ap1', purchaseOrderId: 'po7',
    supplierName: 'AWS', description: 'Utökat ECS-kluster QuixZoom beta',
    amount: 48000, currency: 'SEK',
    requestedBy: 'Johan Berglund', requestedAt: '2026-03-20T09:14:00',
    status: 'väntande', approver: 'CFO',
  },
  {
    id: 'ap2', purchaseOrderId: 'po8',
    supplierName: 'Stripe', description: 'Stripe Connect onboarding tillägg',
    amount: 12500, currency: 'SEK',
    requestedBy: 'Erik Svensson', requestedAt: '2026-03-22T14:30:00',
    status: 'väntande', approver: 'CFO',
  },
  {
    id: 'ap3', purchaseOrderId: 'po1',
    supplierName: 'AWS', description: 'ECS + RDS eu-north-1 Q1 2026',
    amount: 24500, currency: 'SEK',
    requestedBy: 'Erik Svensson', requestedAt: '2026-01-14T11:00:00',
    status: 'godkänd', approver: 'CFO',
  },
]

// suppress unused import warning
void daysAgo
