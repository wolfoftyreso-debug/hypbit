import { useState } from 'react'
import { AcademyView } from './AcademyView'
import { KnowledgeBase } from './KnowledgeBase'
import { ZoomerCert } from './ZoomerCert'
import { AccessControlCenter } from './AccessControlCenter'
import { PortfolioView } from './PortfolioView'

type Tab = 'systemskola' | 'kunskapsbas' | 'zoomer-cert' | 'systemöversikt' | 'portfolio'

const TABS: { id: Tab; label: string }[] = [
  { id: 'systemskola',    label: '🎓 Systemskolan' },
  { id: 'kunskapsbas',    label: '📚 Kunskapsbas' },
  { id: 'zoomer-cert',    label: '🏆 Zoomer-cert' },
  { id: 'systemöversikt', label: '🖥️ Systemöversikt' },
  { id: 'portfolio',      label: '💡 Portfolio' },
]

export function KnowledgeHub() {
  const [activeTab, setActiveTab] = useState<Tab>('systemskola')

  return (
    <div className="flex flex-col h-full bg-[#F0EBE1] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-border px-4 md:px-6 pt-4 md:pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Knowledge Hub</h1>
            <p className="text-sm text-[#8A8A9A] mt-0.5">
              Systemskolan, kunskapsbas, Zoomer-certifiering och systemöversikt
            </p>
          </div>
        </div>

        {/* Tabs — pill style */}
        <div className="flex gap-1 pb-3 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30'
                  : 'text-[#8A8A9A] hover:text-[#2C5F8A] hover:bg-[#EDE8DC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ minHeight: 0 }}>
        {activeTab === 'systemskola'    && <AcademyView />}
        {activeTab === 'kunskapsbas'    && <KnowledgeBase />}
        {activeTab === 'zoomer-cert'    && <ZoomerCert />}
        {activeTab === 'systemöversikt' && <AccessControlCenter />}
        {activeTab === 'portfolio'      && <PortfolioView />}
      </div>
    </div>
  )
}
