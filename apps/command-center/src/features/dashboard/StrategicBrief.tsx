import { useState, useMemo } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { COMPETITORS, MARKET_METRICS, MISSIONS } from './strategyData'
import { CORP_ENTITIES, TEAM_MEMBERS } from '../../shared/data/systemData'

type Tab = 'mission' | 'products' | 'competitors' | 'market'  | 'compliance'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'mission',     label: 'Mission',      icon: '🎯' },
  { id: 'products',    label: 'Produkter',    icon: '🚀' },
  { id: 'competitors', label: 'Konkurrenter', icon: '⚔️' },
  { id: 'market',      label: 'Marknad',      icon: '📈' },
  { id: 'material',    label: 'Material',     icon: '📋' },
  { id: 'compliance',  label: 'Compliance',   icon: '✅' },
]

const THREAT_CONFIG = {
  hög:      { color: '#C0392B', bg: '#FDECEA', label: '🔴 Hög' },
  medel:    { color: '#B8760A', bg: '#FDF3E0', label: '🟡 Medel' },
  låg:      { color: '#2D7A4F', bg: '#E8F5ED', label: '🟢 Låg' },
  inaktivt: { color: '#8A8278', bg: '#F5F0E8', label: '⚫ Inaktivt' },
}

export function StrategicBrief() {
  const { activeEntity } = useEntityScope()
  const [activeTab, setActiveTab] = useState<Tab>('mission')
  const [selectedProduct, setSelectedProduct] = useState<string>('alla')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Vilken mission gäller?
  const entityKey = activeEntity.id === 'wg-dmcc' || activeEntity.id.startsWith('wavult')
    ? 'wavult-group'
    : activeEntity.id
  const mission = MISSIONS[entityKey] ?? MISSIONS['wavult-group']

  // Filtrera konkurrenter
  const filteredCompetitors = useMemo(() =>
    COMPETITORS.filter(c => selectedProduct === 'alla' || c.productId === selectedProduct),
  [selectedProduct])

  // Filtrera marknadsdata
  const filteredMarket = useMemo(() =>
    MARKET_METRICS.filter(m => selectedProduct === 'alla' || m.productId === selectedProduct),
  [selectedProduct])

  const productFilter = (
    <div className="flex gap-2 mb-6">
      {['alla', 'quixzoom', 'landvex'].map(p => (
        <button key={p} onClick={() => setSelectedProduct(p)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            selectedProduct === p
              ? 'bg-[#0A3D62] text-white'
              : 'bg-white border border-[#DDD5C5] text-gray-600 hover:border-[#0A3D62]'
          }`}>
          {p === 'alla' ? 'Alla' : p === 'quixzoom' ? '📷 quiXzoom' : '🏗️ LandveX'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#F5F0E8]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#DDD5C5] bg-[#FDFAF5] flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-bold text-[#0A3D62]">Strategic Brief</h1>
            <p className="text-xs text-gray-500 mt-0.5">{activeEntity.name ?? 'Wavult Group'} — internt strategidokument</p>
          </div>
          <span className="text-xs text-gray-400 italic">Konfidentiellt · Internt bruk</span>
        </div>
        {/* Tabs */}
        <div className="flex gap-0 mt-4 -mb-px overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#E8B84B] text-[#0A3D62] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-[#0A3D62]'
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* MISSION */}
        {activeTab === 'mission' && (
          <div className="space-y-6 max-w-3xl">
            <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #0A3D62 0%, #0d4d78 100%)' }}>
              <div className="text-[#E8B84B] text-xs font-bold uppercase tracking-widest mb-4">Vår mission</div>
              <h2 className="text-2xl font-bold text-white leading-tight">{mission.mission}</h2>
              <div className="h-px bg-[#E8B84B]/30 my-6" />
              <p className="text-[#F5F0E8]/80 text-sm leading-relaxed">{mission.vision}</p>
              <div className="mt-6 text-[#E8B84B] font-bold text-lg italic">"{mission.tagline}"</div>
            </div>

            {/* Koncernöversikt */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6">
              <h3 className="text-sm font-bold text-[#0A3D62] mb-4">Koncernstruktur</h3>
              {/* Dubai-gruppen */}
              <div className="mb-4">
                <div className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider mb-2">🇦🇪 Dubai — IP Holding + Ops</div>
                <div className="grid grid-cols-3 gap-2">
                  {CORP_ENTITIES.filter(e => e.jurisdictionCode === 'AE' && e.layer <= 1).map(e => (
                    <div key={e.id} className="rounded-xl border p-3" style={{ borderColor: e.color + '40', background: e.color + '08' }}>
                      <div className="text-xs font-bold mb-0.5" style={{ color: e.color }}>{e.shortName}</div>
                      <div className="text-[10px] text-gray-400">{e.name.split(' ').slice(0,2).join(' ')}</div>
                      <span className="mt-1.5 inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold">⏳ Bildas</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* quiXzoom */}
              <div className="mb-4">
                <div className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider mb-2">📷 quiXzoom</div>
                <div className="grid grid-cols-2 gap-2">
                  {CORP_ENTITIES.filter(e => e.products.some(p => p.toLowerCase().includes('quixzoom'))).map(e => (
                    <div key={e.id} className="rounded-xl border p-3" style={{ borderColor: e.color + '40', background: e.color + '08' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{e.flag}</span>
                        <span className="text-xs font-bold" style={{ color: e.color }}>{e.shortName}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{e.jurisdiction}</div>
                      <span className={`mt-1.5 inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold ${e.status === 'aktiv' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                        {e.status === 'aktiv' ? '✓ Aktiv' : '⏳ Bildas'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LandveX */}
              <div>
                <div className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider mb-2">🏗️ LandveX</div>
                <div className="grid grid-cols-3 gap-2">
                  {CORP_ENTITIES.filter(e => e.products.some(p => p.toLowerCase().includes('landvex'))).map(e => (
                    <div key={e.id} className="rounded-xl border p-3" style={{ borderColor: e.color + '40', background: e.color + '08' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{e.flag}</span>
                        <span className="text-xs font-bold" style={{ color: e.color }}>{e.shortName}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{e.jurisdiction}</div>
                      <span className={`mt-1.5 inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold ${e.status === 'aktiv' || e.status === 'under_namnbyte' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                        {e.status === 'under_namnbyte' ? '⟳ Namnbyte' : e.status === 'aktiv' ? '✓ Aktiv' : '⏳ Bildas'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6">
              <h3 className="text-sm font-bold text-[#0A3D62] mb-4">Ledarskap ({TEAM_MEMBERS.filter(m => m.roleId !== 'viewer').length} st)</h3>
              <div className="space-y-2">
                {TEAM_MEMBERS.filter(m => m.roleId !== 'viewer').map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-[#EDE8DC] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center text-xs font-bold text-[#0A3D62] flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[#0A3D62]">{m.name}</div>
                      <div className="text-[10px] text-gray-400">{m.role}</div>
                    </div>
                    <div className="text-[9px] text-gray-300 font-mono">{m.email}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KONKURRENTER */}
        {activeTab === 'competitors' && (
          <div className="max-w-4xl space-y-4">
            <div className="rounded-xl border border-[#E8B84B]/30 bg-[#FDF3E0] px-4 py-3 text-xs text-[#8B6914]">
              ⚡ <strong>Viktig distinktion:</strong> Vi konkurrerar inte om befintliga marknader — vi skapar en ny kategori.
              Dessa "konkurrenter" är vad kunder jämför oss med, inte vad vi faktiskt ersätter.
            </div>

            {productFilter}

            <div className="space-y-3">
              {filteredCompetitors.map(c => {
                const threat = THREAT_CONFIG[c.threat]
                const isExpanded = expandedId === c.id
                return (
                  <div key={c.id} className="rounded-2xl border border-[#DDD5C5] bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-sm font-bold text-[#0A3D62]">{c.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#8A8278]">{c.category}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: threat.bg, color: threat.color }}>
                            {threat.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                            background: c.productId === 'quixzoom' ? '#E8F5ED' : '#FDF3E0',
                            color: c.productId === 'quixzoom' ? '#2D7A4F' : '#8B6914',
                          }}>
                            {c.productId === 'quixzoom' ? 'quiXzoom' : 'LandveX'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">{c.whatTheyDo}</p>
                      </div>
                      <span className="text-gray-400 text-sm flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded analysis */}
                    {isExpanded && (
                      <div className="border-t border-[#EDE8DC] px-5 pb-5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-[#FDECEA] p-4">
                          <div className="text-[10px] font-bold text-[#C0392B] uppercase tracking-wider mb-2">Deras styrka</div>
                          <p className="text-xs text-[#7A1E12]">{c.theirStrength}</p>
                        </div>
                        <div className="rounded-xl bg-[#E8F5ED] p-4">
                          <div className="text-[10px] font-bold text-[#2D7A4F] uppercase tracking-wider mb-2">Deras svaghet = vår möjlighet</div>
                          <p className="text-xs text-[#1A4A30]">{c.theirWeakness}</p>
                        </div>
                        <div className="rounded-xl bg-[#F5F0E8] border border-[#E8B84B]/30 p-4">
                          <div className="text-[10px] font-bold text-[#8B6914] uppercase tracking-wider mb-2">Vår fördel</div>
                          <p className="text-xs text-[#3A3530] font-semibold">{c.ourAdvantage}</p>
                        </div>
                        <div className="rounded-xl bg-[#EFF6FF] p-4">
                          <div className="text-[10px] font-bold text-[#0A3D62] uppercase tracking-wider mb-2">Vår strategi mot dem</div>
                          <p className="text-xs text-[#0A3D62]">{c.ourStrategy}</p>
                        </div>
                        {c.hq && (
                          <div className="text-[10px] text-gray-400 col-span-full">
                            {c.hq && `HQ: ${c.hq}`}{c.employees && ` · ${c.employees} anställda`}{c.fundingStage && ` · ${c.fundingStage}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MARKNAD */}
        {activeTab === 'market' && (
          <div className="max-w-4xl space-y-6">
            {productFilter}

            {/* Marknadsprioritering */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-5 mb-2">
              <div className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider mb-4">Var vi lägger krut — per fas</div>
              <div className="space-y-3">
                {[
                  { phase: 'FAS 1', status: 'pågår', markets: [{ flag:'🇸🇪', name:'Sverige', note:'6 veckor till lansering. 290 kommuner via LOU.', owner:'Leon' }], color: '#E8B84B' },
                  { phase: 'FAS 2A', status: 'förbereder', markets: [
                    { flag:'🇳🇱', name:'Nederländerna', note:'Amsterdam + Rotterdam pilot. OZ-LT täcker juridiken.', owner:'TBD' },
                    { flag:'🇬🇧', name:'UK', note:'Crown Commercial Service — 333 kommuner med ett ramavtal.', owner:'TBD' },
                    { flag:'🇦🇪', name:'UAE via LandveX AC', note:'RTA + DEWA Dubai. Obegränsad infrastrukturbudget.', owner:'Erik' },
                  ], color: '#0A3D62' },
                  { phase: 'FAS 3', status: 'planerat', markets: [
                    { flag:'🇩🇪', name:'NRW, Tyskland', note:'396 kommuner, €2.4 Mdr/år. NIS2-driven adoption.', owner:'' },
                    { flag:'🇺🇸', name:'Texas, USA', note:'LandveX Inc. ERCOT-driven infrastrukturinvesteringar.', owner:'' },
                    { flag:'🌏', name:'Asien', note:'Singapore Trust som hub. 2027-2028.', owner:'' },
                  ], color: '#8A8278' },
                ].map(phase => (
                  <div key={phase.phase} className="rounded-xl border p-4" style={{ borderColor: phase.color + '30', background: phase.color + '05' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: phase.color }}>{phase.phase}</span>
                      <span className="text-[10px] text-gray-400 font-mono uppercase">{phase.status}</span>
                    </div>
                    <div className="space-y-2">
                      {phase.markets.map(m => (
                        <div key={m.name} className="flex items-start gap-3 text-xs">
                          <span className="text-base flex-shrink-0">{m.flag}</span>
                          <div className="flex-1">
                            <span className="font-semibold text-[#0A3D62]">{m.name}</span>
                            <span className="text-gray-400 ml-2">{m.note}</span>
                          </div>
                          {m.owner && <span className="text-[10px] text-gray-300 flex-shrink-0">{m.owner}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TAM/SAM per produkt — kompakt */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filteredMarket.filter(m => ['m1','m2','m6','m7'].includes(m.id)).map(m => (
                <div key={m.id} className="rounded-xl border border-[#DDD5C5] bg-white p-4 shadow-sm">
                  <div className="text-[9px] font-bold text-[#8A8278] uppercase tracking-wider mb-1">{m.label.split('(')[0].trim()}</div>
                  <div className="text-lg font-bold text-[#0A3D62]">{m.value}</div>
                  <div className="text-[9px] text-gray-400 mt-1">{m.source} · {m.asOf}</div>
                </div>
              ))}
            </div>

            {/* Go-to-market tidslinje */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6">
              <h3 className="text-sm font-bold text-[#0A3D62] mb-4">Go-to-Market — Tidslinje</h3>
              <div className="space-y-3">
                {[
                  { date: 'April 2026', event: 'Thailand Workcamp', desc: 'Teamsamling, produktstruktur, kodbas klar. Hela teamet på plats 11 april.', status: 'nu', product: 'Alla' },
                  { date: 'Maj 2026', event: 'quiXzoom Skärgårdstest', desc: 'Live-test med zoomers i Stockholms skärgård. Första bilddata. Zoomer-app live.', status: 'nara', product: 'quiXzoom' },
                  { date: 'Juni 2026', event: 'FAS 1 — Sverige-lansering', desc: 'quiXzoom och LandveX live. Mål: 3 kommunkontrakt, 500 aktiva zoomers. Referenskunder säkrade.', status: 'nara', product: 'Alla' },
                  { date: 'Q3 2026', event: 'FAS 2A — Parallell EU + UK', desc: 'NL: pilotkontrakt Amsterdam + Rotterdam via OZ-LT. UK: Crown Commercial Service-ansökan. Ingen ny bolagsregistrering — OZ-LT täcker hela EU.', status: 'framtid', product: 'quiXzoom' },
                  { date: 'Q3 2026', event: 'UAE — LandveX AC aktiveras', desc: 'Första säljkontakter RTA och DEWA Dubai. Dubai-närvaron ger direktaccess till GCC-marknaden. Nästan obegränsade infrastrukturbudgetar.', status: 'framtid', product: 'LandveX' },
                  { date: 'Q1 2027', event: 'FAS 2B — Skalning', desc: 'UK fullt aktiverat om CCS-ramavtal klart (öppnar 333 kommuner på en gång). 3-4 NL-kommuner live. Account managers rekryterade lokalt.', status: 'framtid', product: 'Alla' },
                  { date: 'Q2 2027', event: 'USA — Texas go-live', desc: 'LandveX Inc aktiveras. Texas = USA:s mest infrastructure-investerade stat (ERCOT-kris driver investeringar). Första US-kontrakt Texas.', status: 'framtid', product: 'LandveX' },
                  { date: '2027-2028', event: 'FAS 3 — Global hävstång', desc: 'Asien via Singapore Trust-hub. Aktivera alla EU-marknader via OZ-LT. Series A kapital används för att parallellköra 8-10 marknader simultant.', status: 'framtid', product: 'Alla' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      item.status === 'nu' ? 'bg-[#E8B84B] ring-4 ring-[#E8B84B]/20' :
                      item.status === 'nara' ? 'bg-[#0A3D62]' : 'bg-[#DDD5C5]'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-400">{item.date}</span>
                        <span className="text-xs font-bold text-[#0A3D62]">{item.event}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5F0E8] text-[#8A8278]">{item.product}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUKTER */}
        {activeTab === 'products' && (
          <div className="max-w-4xl space-y-4">
            {['quixzoom', 'landvex'].map(pid => {
              const m = MISSIONS[pid]
              const entities = CORP_ENTITIES.filter(e => e.products.some(p => p.toLowerCase().includes(pid)))
              return (
                <div key={pid} className="rounded-2xl border border-[#DDD5C5] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl">{pid === 'quixzoom' ? '📷' : '🏗️'}</span>
                    <div>
                      <h3 className="text-lg font-bold text-[#0A3D62]">{pid === 'quixzoom' ? 'quiXzoom' : 'LandveX'}</h3>
                      <p className="text-xs text-[#E8B84B] font-semibold mt-0.5">"{m?.tagline}"</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{m?.mission}</p>
                  <p className="text-xs text-gray-500 mb-4">{m?.vision}</p>
                  <div className="flex flex-wrap gap-2">
                    {entities.map(e => (
                      <span key={e.id} className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: e.color + '15', color: e.color }}>
                        {e.flag} {e.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div className="max-w-4xl space-y-6">

            {/* Strategisk rubrik */}
            <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #0A3D62 0%, #0d4d78 100%)' }}>
              <div className="text-[#E8B84B] text-xs font-bold uppercase tracking-widest mb-3">Vår konkurrensfördel</div>
              <h2 className="text-xl font-bold text-white mb-3">Compliance är inte en kostnad — det är vår säljpitch</h2>
              <p className="text-[#F5F0E8]/80 text-sm leading-relaxed">
                Wavult bygger compliance in i varje systemprocess från dag ett. Det innebär att vi kan sälja till myndigheter,
                kommuner och enterprise-kunder som kräver ISO-certifiering och GDPR-efterlevnad — marknader våra konkurrenter
                stängs ute från eftersom de inte klarar upphandlingskraven.
              </p>
            </div>

            {/* Varför vi håller extremt hög nivå */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6">
              <h3 className="text-sm font-bold text-[#0A3D62] mb-4">Varför vi håller extremt hög compliancenivå</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: '🏛️',
                    title: 'Offentlig sektor kräver det',
                    desc: 'Svenska kommuner upphandlar via LOU. EU-myndigheter kräver ISO 27001. Utan compliance — ingen affär. Det är inte förhandlingsbart.',
                  },
                  {
                    icon: '🔒',
                    title: 'Kundernas data är känslig',
                    desc: 'Infrastrukturdata, koordinater, bilddata av offentliga miljöer. GDPR, NIS2 och säkerhetskrav från dag ett — inte som eftertanke.',
                  },
                  {
                    icon: '🚀',
                    title: 'Snabbare enterprise-deals',
                    desc: 'En ISO 27001-certifierad leverantör skippas förbi upphandlingsbyråkratin. Tid-till-kontrakt halveras. Det är direkt affärsvärde.',
                  },
                ].map(c => (
                  <div key={c.title} className="rounded-xl bg-[#F5F0E8] p-4">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-xs font-bold text-[#0A3D62] mb-1">{c.title}</div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ramverk vi följer */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6">
              <h3 className="text-sm font-bold text-[#0A3D62] mb-4">Ramverk vi implementerar</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { standard: 'ISO 9001:2015', area: 'Kvalitetsledning', status: 'Implementeras', color: '#0A3D62' },
                  { standard: 'ISO 27001:2022', area: 'Informationssäkerhet', status: 'Implementeras', color: '#0A3D62' },
                  { standard: 'GDPR', area: 'Dataskydd (EU)', status: 'Aktivt', color: '#2D7A4F' },
                  { standard: 'NIS2', area: 'Cybersäkerhet (EU)', status: 'Förbereder', color: '#B8760A', tooltip: 'Art. 21: Riskanalys (QMS✓), Incidenthantering (rutiner saknas), Leverantörskedja (cert-auth✓), MFA/komm (cert-auth✓)' },
                ].map(s => (
                  <div key={s.standard} className="rounded-xl border border-[#DDD5C5] p-3 text-center">
                    <div className="text-[11px] font-bold mb-1" style={{ color: s.color }}>{s.standard}</div>
                    <div className="text-[10px] text-gray-500 mb-2">{s.area}</div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{
                      background: s.status === 'Aktivt' ? '#E8F5ED' : s.status === 'Implementeras' ? '#EFF6FF' : '#FDF3E0',
                      color: s.status === 'Aktivt' ? '#2D7A4F' : s.status === 'Implementeras' ? '#0A3D62' : '#B8760A',
                    }}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inbyggt i systemet */}
            <div className="rounded-2xl border border-[#E8B84B]/30 bg-[#FDF3E0] p-6">
              <h3 className="text-sm font-bold text-[#8B6914] mb-3">⚡ Compliance är inbyggt — inte påklistrat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#5A4A20]">
                {[
                  'Varje deploy kräver godkännande av grundare — inget slip through',
                  'All kod skannas automatiskt mot policy-regler före release',
                  'Audit-logg på varje systemhändelse — bevisbar historik',
                  'Veckovis automatisk compliancerapport med tekniska bevis',
                  'ED25519-certifikatautentisering — inga statiska API-nycklar',
                  'RBAC — varje roll ser bara det de får se, inget mer',
                  'S3 multi-region med CRR — RPO 1h, RTO 4h',
                  'Replay-logg med SHA-256-checksummor — tamper-proof',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#E8B84B] font-bold flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Länk till QMS */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-3">Detaljerad compliancestatus och bevisning finns i QMS-systemet</p>
              <a href="/qms" className="inline-block px-6 py-2.5 bg-[#0A3D62] text-white text-xs font-bold rounded-xl hover:bg-[#072E4A]">
                Öppna QMS & Compliance →
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
