// ─── Wavult OS — Application Root ───────────────────────────────────────────
// Business OS. Revenue → Execution → Feedback → Decision.
// Provider hierarchy: Role → EntityScope → Operator → Events → Shell

import { Routes, Route, Navigate } from 'react-router-dom'
import { RoleProvider, useRole } from './shared/auth/RoleContext'
import { EntityScopeProvider } from './shared/scope/EntityScopeContext'
import { OperatorProvider } from './core/operator/OperatorContext'
import { EventProvider } from './core/events/EventContext'
import { RoleLogin } from './shared/auth/RoleLogin'
import { BusinessShell } from './shared/layout/BusinessShell'

// ─── Core modules (always loaded) ──────────────────────────────────────────
import { DashboardView } from './features/biz-dashboard/DashboardView'
import { FinanceView } from './features/biz-finance/FinanceView'
import { OperationsView } from './features/biz-operations/OperationsView'
import { SalesView } from './features/biz-sales/SalesView'
import { PeopleView } from './features/people/PeopleView'

// ─── Secondary modules ─────────────────────────────────────────────────────
import { EntityView } from './features/entity/EntityView'
import { CorporateStructureView } from './features/corporate-structure'
import { PaymentOsView } from './features/payment-os'
import { WalletOsView } from './features/wallet-os'
import { LegalHub } from './features/legal/LegalHub'
import { OrgGraph } from './features/org-graph/OrgGraph'

function AuthenticatedApp() {
  const { role } = useRole()

  if (!role) return <RoleLogin />

  return (
    <OperatorProvider>
      <EventProvider>
        <BusinessShell>
          <Routes>
            {/* Core */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/operations" element={<OperationsView />} />
            <Route path="/sales" element={<SalesView />} />
            <Route path="/finance" element={<FinanceView />} />
            <Route path="/people" element={<PeopleView />} />

            {/* Secondary */}
            <Route path="/entities" element={<EntityView />} />
            <Route path="/entities/:entityId" element={<EntityView />} />
            <Route path="/corporate" element={<CorporateStructureView />} />
            <Route path="/payment-os" element={<PaymentOsView />} />
            <Route path="/wallet-os" element={<WalletOsView />} />
            <Route path="/legal" element={<LegalHub />} />

            {/* System */}
            <Route path="/org" element={<OrgGraph />} />
          </Routes>
        </BusinessShell>
      </EventProvider>
    </OperatorProvider>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <EntityScopeProvider>
        <AuthenticatedApp />
      </EntityScopeProvider>
    </RoleProvider>
  )
}
