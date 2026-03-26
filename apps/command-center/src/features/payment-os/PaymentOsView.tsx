// ─── Payment OS — Main View ─────────────────────────────────────────────────
// Enterprise Payment Operating System. 4-layer architecture.
// Tabs: Architecture | Transaction Flows | Split Engine | Compliance | Deploy

import { useState } from 'react'
import { ArchitectureView } from './ArchitectureView'
import { TransactionFlowView } from './TransactionFlowView'
import { SplitEngineView } from './SplitEngineView'
import { ComplianceView } from './ComplianceView'
import { DeployView } from './DeployView'
import { getSystemStats } from './paymentOsData'

type TabId = 'architecture' | 'flows' | 'split' | 'compliance' | 'deploy'

export function PaymentOsView() {
  const [activeTab, setActiveTab] = useState<TabId>('architecture')
  const stats = getSystemStats()

  const tabs: { id: TabId; label: string; icon: string; badge?: string }[] = [
    { id: 'architecture', label: 'Architecture', icon: '◈' },
    { id: 'flows', label: 'Transaction Flows', icon: '◆' },
    { id: 'split', label: 'Split Engine', icon: '▣' },
    { id: 'compliance', label: 'Compliance', icon: '◉' },
    { id: 'deploy', label: 'Deploy Blueprint', icon: '▲' },
  ]

  const accentColor = '#EF4444'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#08090F]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-white">Payment OS</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-lg border border-[#EF444425] bg-[#EF444408] text-[#EF4444] font-mono">
                  PRIVATE GLOBAL PAYMENT NETWORK
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Stripe + Adyen + SAP + SWIFT — privately owned. Modular monolith + microservice adapters.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#10B981]">{stats.live} live</span>
                <span className="text-gray-600">·</span>
                <span className="text-[#F59E0B]">{stats.planned} planned</span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-500">{stats.evaluating} eval</span>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-gray-500 font-mono">
                {stats.total} components
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'flows' && <TransactionFlowView />}
        {activeTab === 'split' && <SplitEngineView />}
        {activeTab === 'compliance' && <ComplianceView />}
        {activeTab === 'deploy' && <DeployView />}
      </div>
    </div>
  )
}
