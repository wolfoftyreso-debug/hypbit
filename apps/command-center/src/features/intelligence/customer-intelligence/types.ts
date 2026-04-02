/**
 * Customer Intelligence Layer
 * Every interaction = a signal. Every signal = product intelligence.
 */

export type SignalSource =
  | 'invoice_payment'       // betalningsbeteende
  | 'support_contact'       // kontaktade support — varför?
  | 'feature_usage'         // vilka moduler används mest
  | 'device_heartbeat'      // Lunina: enhet aktiv/inaktiv
  | 'content_consumption'   // vilken utbildningskontent används
  | 'zoomer_activity'       // quiXzoom: uppdragsfrekvens
  | 'alert_response'        // LandveX: svarstid på larm
  | 'login_pattern'         // när/hur ofta loggar de in
  | 'upgrade_inquiry'       // frågade om uppgradering
  | 'referral_action'       // har de refererat någon
  | 'contract_renewal'      // förnyade / förnyade inte
  | 'nps_response'          // NPS-svar
  | 'churn_signal'          // riskbeteende

export type ProductFit =
  | 'quixzoom_zoomer'       // borde vara zoomer
  | 'quixzoom_business'     // borde köpa leadspaket
  | 'landvex_municipality'  // kommuner
  | 'landvex_property'      // fastighetsägare
  | 'landvex_finance'       // banker/försäkring
  | 'lunina_school'         // skola
  | 'lunina_government'     // utbildningsministerium
  | 'supportfounds_donor'   // potentiell donator
  | 'supportfounds_partner' // strategiskt partnerskap

export interface CustomerSignal {
  id: string
  customer_id: string
  source: SignalSource
  timestamp: string
  value: number            // 0–100 signalstyrka
  metadata: Record<string, unknown>
  product_hint?: ProductFit
}

export interface CustomerIntelligenceProfile {
  customer_id: string
  customer_name: string
  last_updated: string

  // Beteendemönster
  payment_reliability: number        // 0–100: betalar alltid i tid?
  engagement_score: number           // 0–100: hur aktiv är kunden?
  support_burden: number             // 0–100: hög = kostsam att serva
  referral_potential: number         // 0–100: trolig att rekommendera?
  churn_risk: number                 // 0–100: hög = riskerar att lämna

  // Produktpassning
  product_fit: {
    product: ProductFit
    score: number          // 0–100
    reason: string
    recommended_action: string
  }[]

  // Livstidsvärde
  current_mrr: number                // monthly recurring revenue
  predicted_ltv: number              // predicted lifetime value
  ltv_confidence: number             // 0–100
  months_to_next_expansion: number   // estimerat

  // Senaste signaler
  recent_signals: CustomerSignal[]

  // AI-genererad insight
  ai_summary: string
  next_best_action: string
  optimal_contact_timing: string     // t.ex. "Tuesday 09:00 local time"
}
