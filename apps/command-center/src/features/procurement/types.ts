export type SupplierCategory = 'Tech/SaaS' | 'Juridik' | 'Redovisning' | 'Infrastruktur' | 'Marknadsföring'
export type SupplierStatus = 'aktiv' | 'inaktiv'

export interface SupplierCost {
  /** Månadsavgift i SEK (0 = ingen fast kostnad, t.ex. usage-based) */
  monthlyFixedSEK?: number
  /** Faktisk genomsnittlig kostnad per månad i SEK (används för visning) */
  avgMonthlySEK: number
  /** Föregående år total i SEK */
  prevYearTotalSEK?: number
  /** Notering om hur kostnaden beräknas */
  note?: string
}

export interface Supplier {
  id: string
  name: string
  category: SupplierCategory
  country: string
  contact: string
  email: string
  status: SupplierStatus
  cost?: SupplierCost
}

export type POStatus = 'utkast' | 'skickad' | 'godkänd' | 'betald'
export type Currency = 'SEK' | 'USD' | 'EUR'

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  description: string
  amount: number
  currency: Currency
  status: POStatus
  date: string
  createdBy: string
}

export interface Contract {
  id: string
  supplierId: string
  supplierName: string
  startDate: string
  endDate: string
  autoRenewal: boolean
  annualValue: number
  currency: Currency
  description: string
}

export type ApprovalStatus = 'väntande' | 'godkänd' | 'avslagen'

export interface ApprovalRequest {
  id: string
  purchaseOrderId: string
  supplierName: string
  description: string
  amount: number
  currency: Currency
  requestedBy: string
  requestedAt: string
  status: ApprovalStatus
  approver: string
}
