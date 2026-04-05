import { useState, useMemo } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { COMPETITORS, MARKET_METRICS, MISSIONS } from './strategyData'
import { CORP_ENTITIES, TEAM_MEMBERS } from '../../shared/data/systemData'

type Tab = 'mission' | 'products' | 'competitors' | 'market' | 'material' | 'compliance'

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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CORP_ENTITIES.map(e => (
                  <div key={e.id} className="rounded-xl border p-3" style={{ borderColor: e.color + '30', background: e.color + '08' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{e.flag}</span>
                      <span className="text-xs font-bold" style={{ color: e.color }}>{e.shortName}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">{e.jurisdiction}</div>
                    <div className="mt-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        e.status === 'aktiv' ? 'bg-green-50 text-green-700' :
                        e.status === 'under_namnbyte' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {e.status === 'aktiv' ? '✓ Aktiv' : e.status === 'under_namnbyte' ? '⟳ Namnbyte' : '⏳ Bildas'}
                      </span>
                    </div>
                  </div>
                ))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMarket.map(m => (
                <div key={m.id} className="rounded-2xl border border-[#DDD5C5] bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider mb-2">{m.label}</div>
                  <div className="text-2xl font-bold text-[#0A3D62] mb-2">{m.value}</div>
                  <p className="text-xs text-gray-500 mb-3">{m.detail}</p>
                  <div className="text-[9px] text-gray-300">Källa: {m.source} · {m.asOf}</div>
                </div>
              ))}
            </div>

            {/* Go-to-market tidslinje */}
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6">
              <h3 className="text-sm font-bold text-[#0A3D62] mb-4">Go-to-Market — Tidslinje</h3>
              <div className="space-y-3">
                {[
                  { date: 'April 2026', event: 'Thailand Workcamp', desc: 'Teamsamling. Projektstruktur. Kodbas klar.', status: 'nu', product: 'Alla' },
                  { date: 'Maj 2026', event: 'quiXzoom Skärgårdstest', desc: 'Live-test med zoomers i Stockholms skärgård. Första bilddata.', status: 'nara', product: 'quiXzoom' },
                  { date: 'Juni 2026', event: 'Sverige-lansering', desc: 'quiXzoom och LandveX live på svenska marknaden. Första kunder.', status: 'nara', product: 'Alla' },
                  { date: 'Q1 2027', event: 'Internationell expansion', desc: 'Nederländerna som fas 2. PE-kapital söks.', status: 'framtid', product: 'quiXzoom' },
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

        {/* MATERIAL */}
        {activeTab === 'material' && (
          <div className="max-w-3xl space-y-3">
            <p className="text-xs text-gray-500 mb-4">Interna dokument och pitch-material. Uppdateras kontinuerligt.</p>
            {[
              { name: 'Investor One-Pager', desc: 'Komprimerad översikt för investerardialog', status: 'utkast', format: 'PDF' },
              { name: 'Pitch Deck', desc: 'Fullständig presentationsdeck', status: 'pågår', format: 'Slides' },
              { name: 'Corporate Compendium', desc: 'Fullständig bolagsdokumentation per mottagare', status: 'live', format: 'PDF', link: '/corporate/compendium' },
              { name: 'Competitive Analysis', desc: 'Detaljerad konkurrentanalys per produkt', status: 'pågår', format: 'PDF' },
              { name: 'Go-to-Market Playbook', desc: 'Sverige-lanseringsplan med milstolpar', status: 'utkast', format: 'PDF' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-[#DDD5C5] bg-white p-4 flex items-center gap-4">
                <div className="text-2xl">{item.format === 'PDF' ? '📄' : item.format === 'Slides' ? '📊' : '📋'}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#0A3D62]">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                  item.status === 'live' ? 'bg-green-50 text-green-700' :
                  item.status === 'pågår' ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  {item.status === 'live' ? '✓ Live' : item.status === 'pågår' ? '⟳ Pågår' : '✎ Utkast'}
                </span>
                {'link' in item && item.link && (
                  <a href={item.link} className="text-xs text-[#0A3D62] underline hover:text-[#E8B84B]">Öppna →</a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div className="max-w-3xl">
            <p className="text-xs text-gray-500 mb-4">
              Compliance-status hämtas från QMS-systemet. <a href="/qms" className="text-[#0A3D62] underline">Gå till QMS →</a>
            </p>
            <div className="rounded-2xl border border-[#DDD5C5] bg-white p-6 text-center">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-sm font-bold text-[#0A3D62] mb-2">QMS & Compliance</h3>
              <p className="text-xs text-gray-500">Full compliance-data finns i QMS-modulen. ISO 9001, ISO 27001, GDPR och NIS2.</p>
              <a href="/qms" className="mt-4 inline-block px-4 py-2 bg-[#0A3D62] text-white text-xs font-bold rounded-lg hover:bg-[#072E4A]">
                Öppna QMS →
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
