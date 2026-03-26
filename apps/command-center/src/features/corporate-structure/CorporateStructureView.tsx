// ─── Corporate Structure — Main View ────────────────────────────────────────
// Combines holding structure, capital flows, setup checklist, and treasury prep.
// Tabs: Structure | Capital Flows | Setup Tracker | Treasury

import { useState } from 'react'
import { HoldingStructureView } from './HoldingStructureView'
import { CapitalFlowTracker } from './CapitalFlowTracker'
import { SetupChecklist } from './SetupChecklist'
import { TreasuryDashboard } from './TreasuryDashboard'
import { getChecklistProgress } from './corporateData'

type TabId = 'structure' | 'flows' | 'setup' | 'treasury'

interface Tab {
  id: TabId
  label: string
  icon: string
  badge?: string
}

export function CorporateStructureView() {
  const [activeTab, setActiveTab] = useState<TabId>('structure')
  const progress = getChecklistProgress()

  const tabs: Tab[] = [
    { id: 'structure', label: 'Holding Structure', icon: '◈' },
    { id: 'flows', label: 'Capital Flows', icon: '◆' },
    { id: 'setup', label: 'Setup Tracker', icon: '◉', badge: `${progress.done}/${progress.total}` },
    { id: 'treasury', label: 'Treasury', icon: '▣' },
  ]

  const accentColor = '#8B5CF6'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#08090F]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">Corporate Structure</h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Multi-jurisdictional holding architecture — Dubai → US → EU
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-lg border border-[#8B5CF625] bg-[#8B5CF608] text-[#8B5CF6] font-mono">
                BANK-LEVEL PREP
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 mt-4 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="text-xs pb-2 mr-5 transition-colors border-b-2 flex items-center gap-1.5"
                style={{
                  color: activeTab === tab.id ? accentColor : '#6B7280',
                  borderColor: activeTab === tab.id ? accentColor : 'transparent',
                }}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'structure' && <HoldingStructureView />}
        {activeTab === 'flows' && <CapitalFlowTracker />}
        {activeTab === 'setup' && <SetupChecklist />}
        {activeTab === 'treasury' && <TreasuryDashboard />}
      </div>
    </div>
  )
}
