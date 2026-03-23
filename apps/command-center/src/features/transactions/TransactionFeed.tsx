export function TransactionFeed() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 mt-1">Multi-entity ledger — coming in v2.1</p>
      </div>

      <div className="bg-surface-raised border border-surface-border rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">↕</div>
        <h3 className="text-lg font-semibold text-white mb-2">Ledger Core — Building</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Multi-currency transaction engine med intercompany clearing.
          Rullar ut i v2.1 (Q2 2026).
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <span className="px-3 py-1 bg-brand-warning/10 text-brand-warning border border-brand-warning/30 text-xs rounded-full">SEK · EUR · USD · AED</span>
          <span className="px-3 py-1 bg-brand-accent/10 text-brand-accent border border-brand-accent/30 text-xs rounded-full">TX ↔ LT ↔ DIFC</span>
        </div>
      </div>
    </div>
  )
}
