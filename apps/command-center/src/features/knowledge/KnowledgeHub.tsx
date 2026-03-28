import { useState } from 'react'
import { KnowledgeBase } from './KnowledgeBase'
import { KnowledgeGraph } from './KnowledgeGraph'
import { AcademyView } from './AcademyView'
import { ZoomerCert } from './ZoomerCert'
import { PortfolioView } from './PortfolioView'

type Tab = 'kunskapsbas' | 'kunskapsgraf' | 'utbildning' | 'zoomer-cert' | 'portfolio'

const TABS: { id: Tab; label: string }[] = [
  { id: 'kunskapsbas',  label: 'Kunskapsbas' },
  { id: 'kunskapsgraf', label: 'Kunskapsgraf' },
  { id: 'utbildning',   label: 'Utbildning' },
  { id: 'zoomer-cert',  label: 'Zoomer-cert' },
  { id: 'portfolio',    label: 'Idéportfolio' },
]

export function KnowledgeHub() {
  const [activeTab, setActiveTab] = useState<Tab>('kunskapsbas')

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-4 md:px-6 pt-4 md:pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Knowledge Hub</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Wavult Groups samlade kunskap, strukturer och utbildningsmaterial —{' '}
              <button
                onClick={() => setActiveTab('utbildning')}
                className="text-[#8B5CF6] hover:underline"
              >
                Ny i teamet? Börja med Utbildning
              </button>
            </p>
          </div>
        </div>

        {/* Tabs — pill style */}
        <div className="flex gap-1 pb-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30'
                  : 'text-gray-500 hover:text-gray-600 hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        {activeTab === 'kunskapsbas' && <KnowledgeBase />}
        {activeTab === 'kunskapsgraf' && <KnowledgeGraph />}
        {activeTab === 'utbildning' && <AcademyView />}
        {activeTab === 'zoomer-cert' && <ZoomerCert />}
        {activeTab === 'portfolio' && <PortfolioView />}
      </div>
    </div>
  )
}
