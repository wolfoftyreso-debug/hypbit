import { Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './shared/layout/Shell'
import { CommandDashboard } from './features/dashboard/CommandDashboard'
import { TransactionFeed } from './features/transactions/TransactionFeed'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<CommandDashboard />} />
        <Route path="/transactions" element={<TransactionFeed />} />
      </Routes>
    </Shell>
  )
}
