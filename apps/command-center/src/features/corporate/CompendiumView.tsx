import { useState, useEffect } from 'react'
import { Entity, getChildren } from '../org-graph/data'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { JURISDICTIONS } from '../legal/jurisdictionData'
import { TEAM_MEMBERS } from '../people-intelligence/peopleData'
import './pdf-styles.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Audience = 'investor' | 'staff' | 'supplier' | 'partner' | 'customer'

interface AudienceTab {
  id: Audience
  label: string
  icon: string
}

const AUDIENCE_TABS: AudienceTab[] = [
  { id: 'investor', label: 'Investerare', icon: '💼' },
  { id: 'staff',    label: 'Personal',    icon: '👤' },
  { id: 'supplier', label: 'Leverantörer', icon: '🏭' },
  { id: 'partner',  label: 'Partners',    icon: '🤝' },
  { id: 'customer', label: 'Kunder',      icon: '📋' },
]

// ─── Products per entity ──────────────────────────────────────────────────────

const ENTITY_PRODUCTS: Record<string, string[]> = {
  'wavult-group':   ['Wavult OS', 'quiXzoom', 'LandveX', 'DISSG', 'Apifly'],
  'financo-fzco':   ['Treasury Management', 'Zoomer Payouts', 'Intercompany Settlement'],
  'devops-fzco':    ['Infrastructure', 'AWS ECS', 'CI/CD Pipeline'],
  'quixzoom-uab':   ['quiXzoom EU', 'Bilddata API'],
  'quixzoom-inc':   ['quiXzoom US'],
  'landvex-inc':    ['LandveX US'],
  'landvex-ab':     ['LandveX SE'],
}

// ─── Jurisdiction lookup ──────────────────────────────────────────────────────

// Maps org-graph entity ids → CORP_ENTITIES numeric ids used in jurisdictionData
const ORG_TO_CORP_ID: Record<string, string> = {
  'wavult-group':  '1',
  'quixzoom-uab':  '3',
  'quixzoom-inc':  '4',
  'landvex-ab':    '5',
  'landvex-inc':   '6',
}

function getJurisdictionForEntity(entity: Entity): (typeof JURISDICTIONS)[number] | undefined {
  const corpId = ORG_TO_CORP_ID[entity.id]
  if (corpId) return JURISDICTIONS.find(j => j.entity_ids.includes(corpId))
  // Fallback: country name match
  return JURISDICTIONS.find(j =>
    entity.jurisdiction.toLowerCase().includes(j.country.toLowerCase()) ||
    entity.jurisdiction.toLowerCase().includes(j.country_code.toLowerCase())
  )
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(status: string): string {
  if (status === 'live')    return '✓ Aktiv'
  if (status === 'forming') return '⟳ Under etablering'
  return '○ Planerad'
}

function statusPill(status: string): string {
  if (status === 'live') return 'bg-[#E8F5ED] text-[#2D7A4F]'
  return 'bg-[#FDF3E0] text-[#B8760A]'
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#DDD5C5] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-[#0A3D62] mb-4">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-[#0A3D62]">{value}</div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ entity }: { entity: Entity }) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 border border-[#DDD5C5] shadow-sm">
      {/* Cream gradient — ALDRIG mörk tech-bild */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F5F0E8 0%, #FDFAF5 60%, #EDE8DC 100%)',
          minHeight: 200,
        }}
        className="px-8 py-10"
      >
        {/* Label */}
        <div className="text-xs font-bold text-[#E8B84B] uppercase tracking-widest mb-3">
          CORPORATE COMPENDIUM
        </div>

        {/* Flagga + namn */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{entity.flag}</span>
          <div>
            <h1 className="text-3xl font-black text-[#0A3D62] leading-tight">{entity.name}</h1>
            <p className="text-base text-[#8A8278] mt-1">{entity.description}</p>
          </div>
        </div>

        {/* Status-pills */}
        <div className="flex gap-3 flex-wrap mt-4">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#0A3D62] text-white">
            {entity.jurisdiction}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusPill(entity.active_status)}`}>
            {statusLabel(entity.active_status)}
          </span>
          {entity.metadata?.['Legal form'] && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5F0E8] text-[#5A5245] border border-[#DDD5C5]">
              {entity.metadata['Legal form']}
            </span>
          )}
        </div>
      </div>

      {/* Gold accent-linje */}
      <div className="h-1 bg-gradient-to-r from-[#E8B84B] to-[#E8B84B]/20" />
    </div>
  )
}

// ─── Investor View ────────────────────────────────────────────────────────────

function InvestorView({ entity }: { entity: Entity }) {
  const children = getChildren(entity.id)
  const jurisdiction = getJurisdictionForEntity(entity)
  const products = ENTITY_PRODUCTS[entity.id] ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Vänster: Bolagsfakta */}
      <div className="lg:col-span-2 space-y-6">

        {/* Om bolaget */}
        <SectionCard title="📋 Om bolaget">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Bolagsform"   value={entity.type} />
            <InfoRow label="Jurisdiktion" value={entity.jurisdiction} />
            <InfoRow label="Status"       value={statusLabel(entity.active_status)} />
            {entity.metadata?.['Legal form'] && (
              <InfoRow label="Juridisk form" value={entity.metadata['Legal form']} />
            )}
            {jurisdiction && (
              <>
                <InfoRow label="Bolagsskatt" value={jurisdiction.tax_rate_corporate} />
                <InfoRow label="Moms"        value={jurisdiction.tax_rate_vat} />
              </>
            )}
          </div>
        </SectionCard>

        {/* Dotterbolag */}
        {children.length > 0 && (
          <SectionCard title="🏗️ Dotterbolag">
            {children.map(child => (
              <div
                key={child.id}
                className="flex items-center justify-between py-2.5 border-b border-[#EDE8DC] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span>{child.flag}</span>
                  <span className="text-sm font-semibold text-[#0A3D62]">{child.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{child.jurisdiction}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusPill(child.active_status)}`}>
                    {child.active_status === 'live' ? 'Aktiv' : 'Under bildning'}
                  </span>
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* Produkter */}
        {products.length > 0 && (
          <SectionCard title="📦 Produkter & Tjänster">
            <div className="flex flex-wrap gap-2">
              {products.map(p => (
                <span
                  key={p}
                  className="px-3 py-2 rounded-xl bg-[#F5F0E8] text-[#0A3D62] text-sm font-semibold border border-[#DDD5C5]"
                >
                  {p}
                </span>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Höger: KPIs + Kontakt */}
      <div className="space-y-6">
        <SectionCard title="📊 Nyckeltal">
          <div className="space-y-3">
            {[
              { label: 'Revenue',    value: '—',                              sub: 'Pre-revenue' },
              { label: 'Entiteter', value: `${1 + children.length}`,          sub: 'inkl dotterbolag' },
              { label: 'Compliance', value: '—',                              sub: 'Hämtas från API' },
            ].map(kpi => (
              <div key={kpi.label} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F0E8]">
                <div>
                  <div className="text-xs text-gray-500">{kpi.label}</div>
                  <div className="text-xs text-gray-400">{kpi.sub}</div>
                </div>
                <div className="text-xl font-black text-[#0A3D62]">{kpi.value}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="📬 Kontakt">
          <div className="space-y-3 text-sm">
            <InfoRow label="Email"    value="info@wavult.com" />
            <InfoRow label="Svarstid" value="1-2 arbetsdagar" />
            <InfoRow label="Support"  value="support@wavult.com" />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ─── Staff View ───────────────────────────────────────────────────────────────

function StaffView({ entity }: { entity: Entity }) {
  const members = TEAM_MEMBERS.filter(m => m.entity === entity.id)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <div key={m.id} className="rounded-2xl border border-[#DDD5C5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F0E8] border border-[#DDD5C5] flex items-center justify-center text-lg font-black text-[#0A3D62]">
                {m.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm text-[#0A3D62]">{m.name}</div>
                <div className="text-xs text-[#E8B84B] font-semibold">{m.title}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              {m.workDescription.length > 80
                ? m.workDescription.slice(0, 80) + '…'
                : m.workDescription}
            </div>
            {m.email && <div className="text-xs text-[#0A3D62] mt-2 font-medium">{m.email}</div>}
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400">
            <span className="text-3xl block mb-2">👤</span>
            <span className="text-sm">Inga teammedlemmar kopplade till detta bolag ännu</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Suppliers View ───────────────────────────────────────────────────────────

function SuppliersView({ entity }: { entity: Entity }) {
  const API = (import.meta as any).env?.VITE_API_URL ?? 'https://api.wavult.com'
  const [counterparts, setCounterparts] = useState<any[]>([])

  useEffect(() => {
    fetch(`${API}/api/legal/counterparts?entityId=${entity.id}`, {
      headers: { Authorization: 'Bearer bypass' },
    })
      .then(r => (r.ok ? r.json() : []))
      .then(setCounterparts)
      .catch(() => {})
  }, [entity.id, API])

  return (
    <div className="space-y-4">
      <SectionCard title="💳 Betalningsvillkor">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Betalningsvillkor" value="30 dagar netto" />
          <InfoRow label="Valuta"            value="SEK / USD / AED" />
          <InfoRow label="Momsregistrering"  value="SE559141-7042" />
          <InfoRow label="Bankgiro"          value="Kontakta ekonomi" />
        </div>
      </SectionCard>

      <SectionCard title="📋 Registrerade motparter">
        {counterparts.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            Inga leverantörer registrerade — lägg till via Legal Hub
          </div>
        ) : (
          counterparts.map((cp: any) => (
            <div
              key={cp.id}
              className="flex items-center justify-between py-2 border-b border-[#EDE8DC] last:border-0 text-sm"
            >
              <div>
                <div className="font-semibold text-[#0A3D62]">{cp.name}</div>
                <div className="text-xs text-gray-500">{cp.country}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#5A5245] capitalize">
                {cp.type}
              </span>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  )
}

// ─── Partners View ────────────────────────────────────────────────────────────

function PartnersView() {
  return (
    <div className="space-y-4">
      <SectionCard title="🤝 Vad Wavult erbjuder partners">
        <div className="space-y-3">
          {[
            {
              title: 'API & Integrationer',
              desc: 'REST API med OAuth 2.0 eller API-nyckel. Sandbox-miljö tillgänglig för certifierade partners.',
            },
            {
              title: 'Revenue Share',
              desc: 'Kommersiella villkor fastställs i partneravtalet. Revenue share och avtalsperiod per överenskommelse.',
            },
            {
              title: 'Co-marketing',
              desc: 'Gemensamma kampanjer, cross-promotion och joint go-to-market för kompatibla partners.',
            },
            {
              title: 'Teknikpartner',
              desc: 'Bygg tillägg och tjänster ovanpå Wavult-plattformen med fullständig API-access.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-xl bg-[#F5F0E8] p-4 border border-[#DDD5C5]">
              <div className="font-bold text-[#0A3D62] text-sm mb-1">{item.title}</div>
              <div className="text-xs text-[#5A5245]">{item.desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="📑 Komma igång som partner">
        <div className="space-y-2">
          {[
            { step: '1', title: 'Inledande dialog',   desc: 'Kontakta oss för att utforska partnerskap' },
            { step: '2', title: 'NDA & LOI',           desc: 'Sekretessavtal och avsiktsförklaring' },
            { step: '3', title: 'Partneravtal',        desc: 'Villkor, scope och kommersiella termer' },
            { step: '4', title: 'Teknisk onboarding',  desc: 'API-nyckel, sandbox och dokumentation' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3 rounded-xl border border-[#DDD5C5] bg-white px-4 py-3">
              <div className="w-6 h-6 rounded-full bg-[#E8B84B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0A3D62]">{s.title}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="📬 Partnercontakt">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Partnerships"       value="erik@wavult.com" />
          <InfoRow label="Teknisk integration" value="johan@wavult.com" />
          <InfoRow label="Svarstid"            value="1-2 arbetsdagar" />
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Customer View ────────────────────────────────────────────────────────────

function CustomerView({ entity }: { entity: Entity }) {
  const products = ENTITY_PRODUCTS[entity.id] ?? ENTITY_PRODUCTS['wavult-group'] ?? []

  return (
    <div className="space-y-4">
      <SectionCard title="🏢 Om oss">
        <div className="rounded-xl bg-[#F5F0E8] p-4 border border-[#DDD5C5] text-sm text-[#0A3D62] mb-4 leading-relaxed">
          {entity.description}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Jurisdiktion" value={entity.jurisdiction} />
          <InfoRow label="Status"       value={statusLabel(entity.active_status)} />
        </div>
      </SectionCard>

      {products.length > 0 && (
        <SectionCard title="📦 Produkter & Tjänster">
          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <span
                key={p}
                className="px-3 py-2 rounded-xl bg-[#F5F0E8] text-[#0A3D62] text-sm font-semibold border border-[#DDD5C5]"
              >
                {p}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="🛠️ Support">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="E-post support" value="support@wavult.com" />
          <InfoRow label="Svarstid"       value="Inom 2 arbetsdagar" />
          <InfoRow label="Affärstider"    value="Mån–Fre 09:00–18:00" />
          <InfoRow label="SLA"            value="Enligt avtal" />
        </div>
      </SectionCard>

      <SectionCard title="📬 Kundkontakt">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Kundansvarig"    value="leon@wavult.com" />
          <InfoRow label="Teknisk support" value="johan@wavult.com" />
          <InfoRow label="Faktura"         value="invoice@wavult.com" />
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CompendiumView() {
  const [audience, setAudience] = useState<Audience>('investor')
  const { activeEntity, level, brandGroup, scopedEntities } = useEntityScope()

  // Välj rätt entitet för Kompendium:
  // - brand level → använd den primära entiteten i brand gruppen
  // - entity level → använd activeEntity direkt
  // - group level → använd moderbolaget (layer 0)
  const compendiumEntity = (() => {
    if (level === 'brand' && brandGroup && scopedEntities.length > 0) {
      return scopedEntities[0] // primär entitet i brand group
    }
    return activeEntity
  })()

  function handlePrint() {
    // Sätt entity data-attribut på root för CI-färger
    document.documentElement.setAttribute('data-entity', activeEntity.id)
    // Öppna utskriftsdialog
    window.print()
    // Återställ
    setTimeout(() => {
      document.documentElement.removeAttribute('data-entity')
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F5F0E8' }}>

      {/* ── Cover page (only visible in print) ── */}
      <div className="pdf-cover" style={{ display: 'none' }} data-pdf-only>
        <div className="confidential">Konfidentiellt</div>
        <img src="/wavult-logo.svg" alt="Wavult" className="logo" />
        <div className="gold-divider" />
        <h1>Corporate Compendium</h1>
        <p className="subtitle">
          {compendiumEntity?.name ?? brandGroup?.name ?? 'Wavult Group'} · Version 2.0 · {new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })} · Konfidentiellt
        </p>
        <div className="gold-divider" />
      </div>

      {/* ── PDF Header (shows on each printed page) ── */}
      <div className="pdf-header">
        <img src="/wavult-logo-black.svg" alt="Wavult" style={{ height: 20 }} />
        <span style={{ fontSize: '8pt', color: '#8A8278', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {compendiumEntity?.name ?? brandGroup?.name ?? 'Wavult Group'}
        </span>
        <span style={{ fontSize: '8pt', color: '#C4BFB2' }}>Konfidentiellt</span>
      </div>

      {/* ── PDF Footer ── */}
      <div className="pdf-footer">
        <span>https://os.wavult.com/corporate/compendium</span>
        <span>{new Date().toLocaleDateString('sv-SE')}</span>
        <span>Wavult Group DMCC · Alla rättigheter förbehållna</span>
      </div>

      {/* ── Top bar ── */}
      <div
        className="px-4 md:px-6 py-3 border-b flex-shrink-0 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: '#F5F0E8', borderColor: '#E8D9C0' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <h1 className="text-[15px] font-bold text-[#0A3D62]">Corporate Compendium</h1>
            <p className="text-xs text-[#9A8870] font-mono">
              {compendiumEntity?.name ?? brandGroup?.name ?? 'Wavult Group'} · {new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0A3D62] text-white hover:bg-[#072E4A] transition-colors"
        >
          📄 Exportera PDF
        </button>
      </div>

      {/* ── Tabs — gold underline på aktiv ── */}
      <div
        className="flex gap-1 px-4 md:px-6 py-1 border-b flex-shrink-0 overflow-x-auto"
        style={{ background: '#F5F0E8', borderColor: '#E8D9C0' }}
      >
        {AUDIENCE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setAudience(tab.id)}
            className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
            style={{ color: audience === tab.id ? '#0A3D62' : '#7A6A55' }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {audience === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#E8B84B' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <HeroSection entity={compendiumEntity} />
          {audience === 'investor' && <InvestorView  entity={compendiumEntity} />}
          {audience === 'staff'    && <StaffView     entity={compendiumEntity} />}
          {audience === 'supplier' && <SuppliersView entity={compendiumEntity} />}
          {audience === 'partner'  && <PartnersView />}
          {audience === 'customer' && <CustomerView  entity={compendiumEntity} />}
        </div>
      </div>
    </div>
  )
}
