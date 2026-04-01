import { useState } from 'react'
import { KnowledgeBase } from './KnowledgeBase'
import { KnowledgeGraph } from './KnowledgeGraph'
import { AccessControlCenter } from './AccessControlCenter'
import { PortfolioView } from './PortfolioView'

type Tab = 'kunskapsbas' | 'systemöversikt' | 'kunskapsgraf' | 'portfolio'

const TABS: { id: Tab; label: string }[] = [
  { id: 'kunskapsbas',    label: 'Kunskapsbas' },
  { id: 'systemöversikt', label: 'Systemöversikt' },
  { id: 'kunskapsgraf',   label: 'Kunskapsgraf' },
  { id: 'portfolio',      label: 'Idéportfolio' },
]

export function KnowledgeHub() {
  const [activeTab, setActiveTab] = useState<Tab>('kunskapsbas')

  return (
    <div className="flex flex-col h-full bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-surface-border px-4 md:px-6 pt-4 md:pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Access & System Control</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Wavult Groups systemregister, åtkomststatus och operativ kontrollpanel
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
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4 md:p-6" style={{ minHeight: 0 }}>
        {activeTab === 'kunskapsbas'    && <KnowledgeBase />}
        {activeTab === 'systemöversikt' && <AccessControlCenter />}
        {activeTab === 'kunskapsgraf'   && <KnowledgeGraph />}
        {activeTab === 'portfolio'      && <PortfolioView />}
      </div>
    </div>
  )
}
