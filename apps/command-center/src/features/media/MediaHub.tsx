import { useState } from 'react'
import { ModuleHeader } from '../../shared/maturity/ModuleHeader'
import { CampaignView } from './CampaignView'
import { ChannelView } from './ChannelView'

type Tab = 'campaigns' | 'channels'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'campaigns', label: 'Kampanjer', icon: '📣' },
  { id: 'channels', label: 'Kanaler', icon: '📡' },
]

export function MediaHub() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns')

  return (
    <div className="flex flex-col h-full bg-[#07080F] text-white">
      <ModuleHeader moduleId="media" />

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-white border-blue-500 bg-blue-500/10'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'campaigns' && <CampaignView />}
        {activeTab === 'channels' && <ChannelView />}
      </div>
    </div>
  )
}
