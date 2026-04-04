import { useState } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { ModuleHeader } from '../../shared/maturity/ModuleHeader'
import { PipelineView } from './PipelineView'
import { ProspectList } from './ProspectList'
import { ContactsView } from './ContactsView'
import { DealsView } from './DealsView'
import { ActivityLog } from './ActivityLog'
import { TargetsView } from './TargetsView'
import { ApolloView } from './ApolloView'
import { useCrmPipelineStats } from './hooks/useCRM'

type Tab = 'pipeline' | 'prospects' | 'contacts' | 'deals' | 'activities' | 'targets' | 'apollo'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pipeline',    label: 'Pipeline' },
  { id: 'prospects',   label: 'Prospects' },
  { id: 'contacts',    label: 'Kontakter' },
  { id: 'deals',       label: 'Avtal' },
  { id: 'activities',  label: 'Aktiviteter' },
  { id: 'targets',     label: 'Targets' },
  { id: 'apollo',      label: '🎯 Apollo' },
]

function QuickStats() {
  const { data: stats } = useCrmPipelineStats()

  const activeProspects = stats?.totalCount ?? 0
  const pipelineValue   = stats?.totalPipeline ?? 0
  const wonValue        = stats?.wonValue ?? 0

  return (
    <div className="flex gap-4 flex-wrap text-xs">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE8DC] border border-surface-border">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        <span className="text-text-muted">Aktiva:</span>
        <span className="text-text-primary font-semibold">{activeProspects}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE8DC] border border-surface-border">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
        <span className="text-text-muted">Pipeline:</span>
        <span className="text-text-primary font-semibold">
          {new Intl.NumberFormat('sv-SE', { notation: 'compact', maximumFractionDigits: 0 }).format(pipelineValue)} kr
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE8DC] border border-surface-border">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        <span className="text-text-muted">Vunnet:</span>
        <span className="text-text-primary font-semibold">
          {new Intl.NumberFormat('sv-SE', { notation: 'compact', maximumFractionDigits: 0 }).format(wonValue)} kr
        </span>
      </div>
    </div>
  )
}

export function CRMHub() {
  const [activeTab, setActiveTab] = useState<Tab>('pipeline')
  const { activeEntity } = useEntityScope()

  return (
    <div className="flex flex-col h-full">
      <ModuleHeader moduleId="crm" />
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-0 flex flex-col gap-4 flex-shrink-0">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-sm font-semibold text-text-primary">CRM</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {activeEntity.shortName} Sales — quiXzoom · Landvex · Wavult OS
            </p>
          </div>
          <QuickStats />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30'
                  : 'text-text-muted hover:text-gray-600 hover:bg-[#EDE8DC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4 md:py-5">
        {activeTab === 'pipeline' && <PipelineView />}
        {activeTab === 'prospects' && <ProspectList />}
        {activeTab === 'contacts' && <ContactsView />}
        {activeTab === 'deals' && <DealsView />}
        {activeTab === 'activities' && <ActivityLog />}
        {activeTab === 'targets' && <TargetsView />}
        {activeTab === 'apollo' && <ApolloView />}
      </div>
    </div>
  )
}
