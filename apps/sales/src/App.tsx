import { useState } from "react";
import { useApi } from "./useApi";

// ─── Colour palette ──────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F7", card: "#FFFFFF", border: "#E5E5EA", text: "#1D1D1F",
  sec: "#86868B", tert: "#AEAEB2", blue: "#007AFF", green: "#34C759",
  yellow: "#FF9500", red: "#FF3B30", fill: "#F2F2F7", purple: "#AF52DE",
};
const shadow = "0 1px 3px rgba(0,0,0,0.06)";
const API = "https://api.bc.pixdrift.com";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatEur = (n: number) => `€${(n || 0).toLocaleString("sv-SE")}`;

// ─── UI Primitives ─────────────────────────────────────────────────────────
const Card = ({ title, children, style: st }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", boxShadow: shadow, ...st }}>
    {title && <div style={{ fontSize: 13, fontWeight: 600, color: C.sec, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>}
    {children}
  </div>
);

const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span style={{ background: color + "18", color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>
);

const Row = ({ children, border = true }: { children: React.ReactNode; border?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: border ? `0.5px solid ${C.border}` : "none" }}>{children}</div>
);

const Bar = ({ pct, color = C.blue, height = 8 }: { pct: number; color?: string; height?: number }) => (
  <div style={{ flex: 1, height, background: C.fill, borderRadius: height / 2, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: height / 2, transition: "width 0.3s" }} />
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: `2px solid ${C.fill}`, borderTop: `2px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div style={{ textAlign: "center", padding: "40px 0", color: C.tert, fontSize: 14 }}>{msg}</div>
);

// ─── Nav ─────────────────────────────────────────────────────────────────────
type NavItem = { id: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  { id: "overview", label: "Översikt", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: "pipeline", label: "Pipeline", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: "reports", label: "Rapporter", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: "payouts", label: "Utbetalningar", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { id: "currencies", label: "Valutor", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: "forecast", label: "Prognoser", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
];

// ─── Fallback data ────────────────────────────────────────────────────────────
const FALLBACK_DEALS = [
  { id: "1", name: "Fastighetsbolaget – OMS", value: 18500, stage: "WON", probability: 100, company: "Fastighetsbolaget AB", owner: "Erik Svensson", close: "2026-03-15" },
  { id: "2", name: "Kommun X – Systemavtal", value: 35000, stage: "PROPOSAL", probability: 65, company: "Kommun X", owner: "Leon Ritzén", close: "2026-04-30" },
  { id: "3", name: "Bygg & Co – OMS-licens", value: 42000, stage: "QUALIFIED", probability: 40, company: "Bygg & Co", owner: "Leon Ritzén", close: "2026-05-15" },
  { id: "4", name: "RealEstate – Inspektionstjänst", value: 22000, stage: "WON", probability: 100, company: "RealEstate Group", owner: "Erik Svensson", close: "2026-03-01" },
  { id: "5", name: "TechStart – Pilot", value: 5500, stage: "NEW", probability: 20, company: "TechStart AB", owner: "Dennis Lindqvist", close: "2026-06-01" },
  { id: "6", name: "Enterprise – Sthlm Stad", value: 95000, stage: "PROPOSAL", probability: 55, company: "Stockholms Stad", owner: "Erik Svensson", close: "2026-06-30" },
  { id: "7", name: "Logistik AB – SaaS", value: 28000, stage: "QUALIFIED", probability: 45, company: "Logistik AB", owner: "Leon Ritzén", close: "2026-05-30" },
];

const FALLBACK_PAYOUTS = [
  { id: "1", recipient: "Leon Ritzén", amount: 4500, currency: "EUR", status: "PENDING", type: "COMMISSION", date: "2026-03-25", deal: "Fastighetsbolaget – OMS" },
  { id: "2", recipient: "Erik Svensson", amount: 7200, currency: "EUR", status: "APPROVED", type: "BONUS", date: "2026-03-20", deal: "RealEstate – Inspektionstjänst" },
  { id: "3", recipient: "Dennis Lindqvist", amount: 2800, currency: "EUR", status: "PAID", type: "COMMISSION", date: "2026-03-15", deal: "Pilot Q1" },
  { id: "4", recipient: "Winston Adeyemi", amount: 1500, currency: "EUR", status: "PENDING", type: "BONUS", date: "2026-03-28", deal: "Q1 Performance" },
  { id: "5", recipient: "Leon Ritzén", amount: 9500, currency: "EUR", status: "REJECTED", type: "COMMISSION", date: "2026-03-10", deal: "Avbrutet deal" },
];

const FALLBACK_CURRENCIES = [
  { code: "EUR", name: "Euro", rate_to_sek: 11.42, rate_to_usd: 1.085, exposure: 125000, change_24h: 0.12 },
  { code: "SEK", name: "Svensk Krona", rate_to_sek: 1.0, rate_to_usd: 0.0955, exposure: 48000, change_24h: -0.05 },
  { code: "USD", name: "US Dollar", rate_to_sek: 10.48, rate_to_usd: 1.0, exposure: 32000, change_24h: -0.22 },
  { code: "GBP", name: "Brittiskt Pund", rate_to_sek: 13.21, rate_to_usd: 1.261, exposure: 18000, change_24h: 0.08 },
  { code: "NOK", name: "Norsk Krone", rate_to_sek: 0.962, rate_to_usd: 0.0918, exposure: 9500, change_24h: -0.15 },
];

const FALLBACK_INCOME_STATEMENT = {
  revenue: 145200, cost_of_revenue: 58400, gross_profit: 86800,
  operating_expenses: 45600, ebitda: 41200, depreciation: 3200,
  ebit: 38000, interest: 1200, ebt: 36800, tax: 8832, net_income: 27968,
  period: "Q1 2026",
};

const FALLBACK_BALANCE_SHEET = {
  assets: { cash: 68400, accounts_receivable: 42100, inventory: 8200, fixed_assets: 34500, total: 153200 },
  liabilities: { accounts_payable: 18900, short_term_debt: 12000, long_term_debt: 35000, total: 65900 },
  equity: { share_capital: 50000, retained_earnings: 27968, other: 9332, total: 87300 },
  period: "2026-03-21",
};

const FALLBACK_CASHFLOW = {
  operating: 38200, investing: -12400, financing: -8000, net: 17800,
  opening_balance: 50600, closing_balance: 68400,
  period: "Q1 2026",
};

const FALLBACK_EXCHANGE_RATES = [
  { from: "EUR", to: "SEK", rate: 11.42, change: 0.12 },
  { from: "EUR", to: "USD", rate: 1.085, change: -0.03 },
  { from: "EUR", to: "GBP", rate: 0.857, change: 0.05 },
  { from: "EUR", to: "NOK", rate: 11.87, change: -0.18 },
  { from: "USD", to: "SEK", rate: 10.48, change: -0.22 },
];

const stageColor = (s: string) =>
  s === "WON" ? C.green : s === "LOST" ? C.red : s === "PROPOSAL" ? C.purple : s === "QUALIFIED" ? C.blue : C.tert;
const payoutColor = (s: string) =>
  s === "PAID" ? C.green : s === "APPROVED" ? C.blue : s === "PENDING" ? C.yellow : C.red;

// ─── Views ────────────────────────────────────────────────────────────────────
function OverviewView() {
  const { data: salesDash, loading } = useApi<{ revenue_mtd: number; pipeline_value: number; win_rate: number; avg_deal_size: number }>(`${API}/api/dashboards/sales`);

  const deals = FALLBACK_DEALS;
  const wonDeals = deals.filter(d => d.stage === "WON");
  const wonVal = wonDeals.reduce((s, d) => s + d.value, 0);
  const pipelineVal = deals.filter(d => !["WON", "LOST"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const winRate = deals.length > 0 ? Math.round(wonDeals.length / deals.length * 100) : 0;
  const avgDeal = wonDeals.length > 0 ? Math.round(wonVal / wonDeals.length) : 0;

  const kpis = salesDash ? [
    { label: "Revenue (MTD)", value: formatEur(salesDash.revenue_mtd ?? wonVal), sub: "Innevarande månad", color: C.green, trend: "↑" },
    { label: "Pipeline-värde", value: formatEur(salesDash.pipeline_value ?? pipelineVal), sub: `${deals.filter(d => !["WON", "LOST"].includes(d.stage)).length} aktiva deals`, color: C.blue, trend: "↑" },
    { label: "Win Rate", value: `${salesDash.win_rate ?? winRate}%`, sub: "Senaste 30 dagar", color: C.purple, trend: winRate >= 50 ? "↑" : "↓" },
    { label: "Snitt deal-storlek", value: formatEur(salesDash.avg_deal_size ?? avgDeal), sub: "Vunna deals", color: C.yellow, trend: "↑" },
  ] : [
    { label: "Revenue (MTD)", value: formatEur(wonVal), sub: "Innevarande månad", color: C.green, trend: "↑" },
    { label: "Pipeline-värde", value: formatEur(pipelineVal), sub: `${deals.filter(d => !["WON", "LOST"].includes(d.stage)).length} aktiva deals`, color: C.blue, trend: "↑" },
    { label: "Win Rate", value: `${winRate}%`, sub: "Baserat på deals", color: C.purple, trend: winRate >= 50 ? "↑" : "↓" },
    { label: "Snitt deal-storlek", value: formatEur(avgDeal), sub: "Vunna deals", color: C.yellow, trend: "↑" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {loading ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 12, padding: "18px 20px", boxShadow: shadow, borderTop: `3px solid ${kpi.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: C.sec }}>{kpi.label}</div>
                <span style={{ fontSize: 14, color: kpi.trend === "↑" ? C.green : C.red }}>{kpi.trend}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, marginTop: 6 }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: C.tert, marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline forecast */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card title="Pipeline Forecast">
          {["NEW", "QUALIFIED", "PROPOSAL"].map(stage => {
            const stDeals = deals.filter(d => d.stage === stage);
            const stVal = stDeals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
            const rawVal = stDeals.reduce((s, d) => s + d.value, 0);
            const pct = rawVal / (pipelineVal || 1) * 100;
            const color = stageColor(stage);
            return (
              <div key={stage} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{stage}</span>
                    <Badge color={color}>{stDeals.length}</Badge>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{formatEur(rawVal)}</div>
                    <div style={{ fontSize: 11, color: C.tert }}>Vägt: {formatEur(Math.round(stVal))}</div>
                  </div>
                </div>
                <Bar pct={pct} color={color} height={6} />
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTop: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.sec }}>Total pipeline</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>{formatEur(pipelineVal)}</span>
          </div>
        </Card>

        <Card title="Win / Loss (MTD)">
          {[
            { label: "Vunna", val: wonVal, count: wonDeals.length, color: C.green },
            { label: "Förlorade", val: deals.filter(d => d.stage === "LOST").reduce((s, d) => s + d.value, 0), count: deals.filter(d => d.stage === "LOST").length, color: C.red },
          ].map((item, i) => (
            <div key={i} style={{ padding: "14px 0", borderBottom: i === 0 ? `0.5px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Badge color={item.color}>{item.label}</Badge>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{formatEur(item.val)}</span>
              </div>
              <div style={{ fontSize: 13, color: C.sec }}>{item.count} deals</div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "14px 16px", background: C.fill, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: C.sec, marginBottom: 4 }}>Win Rate</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Bar pct={winRate} color={winRate >= 50 ? C.green : C.yellow} height={10} />
              <span style={{ fontSize: 18, fontWeight: 700, color: winRate >= 50 ? C.green : C.yellow, minWidth: 45 }}>{winRate}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PipelineView() {
  const deals = FALLBACK_DEALS;
  const stages = ["NEW", "QUALIFIED", "PROPOSAL", "WON"];
  const maxVal = Math.max(...stages.map(s => deals.filter(d => d.stage === s).reduce((sum, d) => sum + d.value, 0)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="Pipeline per fas">
        {stages.map(stage => {
          const stDeals = deals.filter(d => d.stage === stage);
          const stVal = stDeals.reduce((s, d) => s + d.value, 0);
          const color = stageColor(stage);
          const pct = maxVal > 0 ? stVal / maxVal * 100 : 0;
          return (
            <div key={stage} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{stage}</span>
                  <span style={{ fontSize: 12, color: C.sec }}>{stDeals.length} deals</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{formatEur(stVal)}</span>
              </div>
              <Bar pct={pct} color={color} height={12} />
            </div>
          );
        })}
      </Card>

      {/* Deal list per stage */}
      {stages.map(stage => {
        const stDeals = deals.filter(d => d.stage === stage);
        if (stDeals.length === 0) return null;
        return (
          <Card key={stage} title={`${stage} (${stDeals.length})`}>
            {stDeals.map((d, i) => (
              <Row key={i} border={i < stDeals.length - 1}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: C.sec }}>{d.company} · {d.owner}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{formatEur(d.value)}</div>
                  <div style={{ fontSize: 11, color: C.tert }}>{d.probability}% sannolikhet</div>
                </div>
                <div style={{ width: 60 }}>
                  <div style={{ height: 4, background: C.fill, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${d.probability}%`, background: stageColor(d.stage), borderRadius: 2 }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: C.tert, fontFamily: "monospace" }}>{d.close}</span>
              </Row>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

function ReportsView() {
  const [tab, setTab] = useState<"income" | "balance" | "cashflow">("income");
  const { data: incomeData, loading: incLoading } = useApi<typeof FALLBACK_INCOME_STATEMENT>(`${API}/api/reports/income-statement`);
  const { data: balanceData, loading: balLoading } = useApi<typeof FALLBACK_BALANCE_SHEET>(`${API}/api/reports/balance-sheet`);
  const { data: cashData, loading: cashLoading } = useApi<typeof FALLBACK_CASHFLOW>(`${API}/api/reports/cashflow`);

  const income = incomeData ?? FALLBACK_INCOME_STATEMENT;
  const balance = balanceData ?? FALLBACK_BALANCE_SHEET;
  const cash = cashData ?? FALLBACK_CASHFLOW;

  const tabs = [
    { id: "income" as const, label: "Resultaträkning" },
    { id: "balance" as const, label: "Balansräkning" },
    { id: "cashflow" as const, label: "Kassaflöde" },
  ];

  const incomeRows = [
    { label: "Intäkter", value: income.revenue, bold: false, indent: false, color: C.text },
    { label: "Kostnad sålda varor", value: -income.cost_of_revenue, bold: false, indent: true, color: C.red },
    { label: "Bruttoresultat", value: income.gross_profit, bold: true, indent: false, color: C.green },
    { label: "Rörelsekostnader", value: -income.operating_expenses, bold: false, indent: true, color: C.red },
    { label: "EBITDA", value: income.ebitda, bold: true, indent: false, color: C.blue },
    { label: "Avskrivningar", value: -income.depreciation, bold: false, indent: true, color: C.sec },
    { label: "EBIT", value: income.ebit, bold: false, indent: false, color: C.text },
    { label: "Räntekostnader", value: -income.interest, bold: false, indent: true, color: C.red },
    { label: "Resultat före skatt", value: income.ebt, bold: false, indent: false, color: C.text },
    { label: "Skatt", value: -income.tax, bold: false, indent: true, color: C.red },
    { label: "Nettoresultat", value: income.net_income, bold: true, indent: false, color: income.net_income >= 0 ? C.green : C.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: C.fill, borderRadius: 10, padding: 3, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? C.card : "transparent",
            color: tab === t.id ? C.text : C.sec,
            border: "none", borderRadius: 8, padding: "7px 16px",
            fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            cursor: "pointer", boxShadow: tab === t.id ? shadow : "none",
            transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Income Statement */}
      {tab === "income" && (
        incLoading ? <Spinner /> : (
          <Card title={`Resultaträkning — ${income.period}`}>
            {incomeRows.map((row, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: `${row.bold ? 12 : 8}px 0`,
                borderBottom: row.bold ? `0.5px solid ${C.border}` : `0.5px solid ${C.fill}`,
                paddingLeft: row.indent ? 20 : 0,
              }}>
                <span style={{ fontSize: row.bold ? 14 : 13, fontWeight: row.bold ? 700 : 400, color: C.sec }}>{row.label}</span>
                <span style={{ fontSize: row.bold ? 15 : 13, fontWeight: row.bold ? 700 : 400, color: row.color, fontFamily: "monospace" }}>
                  {row.value >= 0 ? formatEur(row.value) : `-${formatEur(Math.abs(row.value))}`}
                </span>
              </div>
            ))}
          </Card>
        )
      )}

      {/* Balance Sheet */}
      {tab === "balance" && (
        balLoading ? <Spinner /> : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title={`Tillgångar — ${balance.period}`}>
              {Object.entries(balance.assets).filter(([k]) => k !== "total").map(([key, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.fill}` }}>
                  <span style={{ fontSize: 13, color: C.sec, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                  <span style={{ fontSize: 13, fontFamily: "monospace" }}>{formatEur(val)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `0.5px solid ${C.border}`, fontWeight: 700 }}>
                <span>Totalt</span>
                <span style={{ color: C.blue, fontFamily: "monospace" }}>{formatEur(balance.assets.total)}</span>
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card title="Skulder">
                {Object.entries(balance.liabilities).filter(([k]) => k !== "total").map(([key, val], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.fill}` }}>
                    <span style={{ fontSize: 13, color: C.sec, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: C.red }}>{formatEur(val)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>
                  <span>Totalt</span>
                  <span style={{ color: C.red, fontFamily: "monospace" }}>{formatEur(balance.liabilities.total)}</span>
                </div>
              </Card>
              <Card title="Eget kapital">
                {Object.entries(balance.equity).filter(([k]) => k !== "total").map(([key, val], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.fill}` }}>
                    <span style={{ fontSize: 13, color: C.sec, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: C.green }}>{formatEur(val)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>
                  <span>Totalt</span>
                  <span style={{ color: C.green, fontFamily: "monospace" }}>{formatEur(balance.equity.total)}</span>
                </div>
              </Card>
            </div>
          </div>
        )
      )}

      {/* Cashflow */}
      {tab === "cashflow" && (
        cashLoading ? <Spinner /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Från rörelsen", value: cash.operating, color: C.green },
                { label: "Investeringar", value: cash.investing, color: C.red },
                { label: "Finansiering", value: cash.financing, color: C.yellow },
              ].map((c, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
                  <div style={{ fontSize: 12, color: C.sec }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.color, marginTop: 6 }}>
                    {c.value >= 0 ? "+" : ""}{formatEur(c.value)}
                  </div>
                </div>
              ))}
            </div>
            <Card title={`Kassaflödesanalys — ${cash.period}`}>
              {[
                { label: "Ingående kassa", value: cash.opening_balance, color: C.text },
                { label: "Kassaflöde rörelse", value: cash.operating, color: cash.operating >= 0 ? C.green : C.red },
                { label: "Kassaflöde investeringar", value: cash.investing, color: cash.investing >= 0 ? C.green : C.red },
                { label: "Kassaflöde finansiering", value: cash.financing, color: cash.financing >= 0 ? C.green : C.red },
                { label: "Netto kassaflöde", value: cash.net, color: cash.net >= 0 ? C.green : C.red, bold: true },
                { label: "Utgående kassa", value: cash.closing_balance, color: C.blue, bold: true },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: `${row.bold ? 12 : 9}px 0`, borderBottom: `0.5px solid ${row.bold ? C.border : C.fill}` }}>
                  <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 400, color: C.sec }}>{row.label}</span>
                  <span style={{ fontSize: row.bold ? 15 : 13, fontWeight: row.bold ? 700 : 500, color: row.color, fontFamily: "monospace" }}>
                    {row.value >= 0 ? "+" : ""}{formatEur(row.value)}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )
      )}
    </div>
  );
}

function PayoutsView() {
  const { data, loading } = useApi<typeof FALLBACK_PAYOUTS>(`${API}/api/payouts`);
  const payouts = (data && data.length > 0) ? data : FALLBACK_PAYOUTS;
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? payouts : payouts.filter(p => p.status === filter);
  const statuses = ["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Väntande", value: formatEur(payouts.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0)), color: C.yellow, count: payouts.filter(p => p.status === "PENDING").length },
          { label: "Godkänt", value: formatEur(payouts.filter(p => p.status === "APPROVED").reduce((s, p) => s + p.amount, 0)), color: C.blue, count: payouts.filter(p => p.status === "APPROVED").length },
          { label: "Utbetalt", value: formatEur(payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0)), color: C.green, count: payouts.filter(p => p.status === "PAID").length },
          { label: "Avvisade", value: formatEur(payouts.filter(p => p.status === "REJECTED").reduce((s, p) => s + p.amount, 0)), color: C.red, count: payouts.filter(p => p.status === "REJECTED").length },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "14px 18px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label} ({s.count})</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? C.blue : C.card,
            color: filter === s ? "#FFF" : C.sec,
            border: `0.5px solid ${filter === s ? C.blue : C.border}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{s === "ALL" ? "Alla" : s}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Card title={`Utbetalningar (${filtered.length})`}>
          {filtered.length === 0 ? <Empty msg="Inga utbetalningar" /> : filtered.map((p, i) => (
            <Row key={i} border={i < filtered.length - 1}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: payoutColor(p.status) + "15", color: payoutColor(p.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {(p.recipient ?? "?")[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.recipient}</div>
                <div style={{ fontSize: 12, color: C.sec }}>{p.type} · {p.deal}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{formatEur(p.amount)}</div>
                <div style={{ fontSize: 11, color: C.tert, fontFamily: "monospace" }}>{p.date}</div>
              </div>
              <Badge color={payoutColor(p.status)}>{p.status}</Badge>
              {p.status === "PENDING" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: C.green + "18", color: C.green, border: `0.5px solid ${C.green}30`, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✓ Godkänn</button>
                  <button style={{ background: C.red + "18", color: C.red, border: `0.5px solid ${C.red}30`, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✕ Avvisa</button>
                </div>
              )}
            </Row>
          ))}
        </Card>
      )}
    </div>
  );
}

function CurrenciesView() {
  const { data: ratesData, loading: ratesLoading } = useApi<typeof FALLBACK_EXCHANGE_RATES>(`${API}/api/exchange-rates`);
  const { data: curData, loading: curLoading } = useApi<typeof FALLBACK_CURRENCIES>(`${API}/api/currencies`);

  const rates = (ratesData && ratesData.length > 0) ? ratesData : FALLBACK_EXCHANGE_RATES;
  const currencies = (curData && curData.length > 0) ? curData : FALLBACK_CURRENCIES;
  const totalExposure = currencies.reduce((s, c) => s + (c.exposure ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Total FX-exponering", value: formatEur(totalExposure), color: C.blue },
          { label: "EUR/SEK", value: `${FALLBACK_CURRENCIES[0].rate_to_sek}`, color: C.text },
          { label: "EUR/USD", value: `${FALLBACK_CURRENCIES[0].rate_to_usd}`, color: C.text },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FX Exposure */}
      <Card title="Valutaexponering">
        {(curLoading ? FALLBACK_CURRENCIES : currencies).map((c, i) => {
          const pct = (c.exposure ?? 0) / (totalExposure || 1) * 100;
          const changeColor = (c.change_24h ?? 0) >= 0 ? C.green : C.red;
          return (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < currencies.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.fill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.sec }}>{c.code}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.code} — {c.name}</div>
                  <div style={{ fontSize: 12, color: C.sec }}>1 {c.code} = {c.rate_to_sek} SEK · {c.rate_to_usd} USD</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{formatEur(c.exposure)}</div>
                  <div style={{ fontSize: 11, color: changeColor }}>{(c.change_24h ?? 0) >= 0 ? "+" : ""}{c.change_24h}%</div>
                </div>
              </div>
              <Bar pct={pct} color={C.blue} height={4} />
            </div>
          );
        })}
      </Card>

      {/* Exchange Rates Table */}
      <Card title="Växelkurser">
        {ratesLoading ? <Spinner /> : (
          <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 80px", fontSize: 13 }}>
            {["Från", "Till", "Kurs", "24h"].map(h => (
              <div key={h} style={{ padding: "8px 0", fontWeight: 600, color: C.sec, borderBottom: `0.5px solid ${C.border}` }}>{h}</div>
            ))}
            {rates.map((r, i) => [
              <div key={`f${i}`} style={{ padding: "10px 0", borderBottom: `0.5px solid ${C.fill}`, fontWeight: 600 }}>{r.from}</div>,
              <div key={`t${i}`} style={{ padding: "10px 0", borderBottom: `0.5px solid ${C.fill}`, color: C.sec }}>{r.to}</div>,
              <div key={`r${i}`} style={{ padding: "10px 0", borderBottom: `0.5px solid ${C.fill}`, fontFamily: "monospace" }}>{r.rate}</div>,
              <div key={`c${i}`} style={{ padding: "10px 0", borderBottom: `0.5px solid ${C.fill}`, color: (r.change ?? 0) >= 0 ? C.green : C.red, fontFamily: "monospace" }}>
                {(r.change ?? 0) >= 0 ? "+" : ""}{r.change}%
              </div>,
            ])}
          </div>
        )}
      </Card>
    </div>
  );
}

function ForecastView() {
  const deals = FALLBACK_DEALS.filter(d => !["WON", "LOST"].includes(d.stage));

  // Generate monthly forecast from deals
  const months = ["Apr 2026", "Maj 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"];
  const closeMonths: Record<string, number> = {
    "2026-04": 0, "2026-05": 0, "2026-06": 0, "2026-07": 0, "2026-08": 0, "2026-09": 0,
  };

  deals.forEach(d => {
    const key = d.close?.slice(0, 7);
    if (key && closeMonths[key] !== undefined) {
      closeMonths[key] += d.value * (d.probability / 100);
    }
  });

  const forecastData = months.map((m, i) => {
    const key = Object.keys(closeMonths)[i];
    return { month: m, weighted: Math.round(closeMonths[key] || 0), raw: deals.filter(d => d.close?.startsWith(key)).reduce((s, d) => s + d.value, 0) };
  });

  const maxForecast = Math.max(...forecastData.map(f => f.raw));
  const totalWeighted = forecastData.reduce((s, f) => s + f.weighted, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Total forecast (vägt)", value: formatEur(totalWeighted), color: C.blue },
          { label: "Total pipeline (brutto)", value: formatEur(deals.reduce((s, d) => s + d.value, 0)), color: C.text },
          { label: "Aktiva deals", value: deals.length, color: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <Card title="Månadsvis prognos (vägt)">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 160, marginBottom: 8 }}>
          {forecastData.map((f, i) => {
            const barH = maxForecast > 0 ? (f.raw / maxForecast) * 120 : 0;
            const weightedH = maxForecast > 0 ? (f.weighted / maxForecast) * 120 : 0;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>{f.weighted > 0 ? formatEur(f.weighted) : "—"}</div>
                <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                  <div style={{ flex: 1, height: barH, background: C.blue + "30", borderRadius: "4px 4px 0 0" }} />
                  <div style={{ flex: 1, height: weightedH, background: C.blue, borderRadius: "4px 4px 0 0" }} />
                </div>
                <div style={{ fontSize: 10, color: C.tert }}>{f.month}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", paddingTop: 8, borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: C.blue + "30" }}/><span style={{ fontSize: 11, color: C.sec }}>Brutto</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: C.blue }}/><span style={{ fontSize: 11, color: C.sec }}>Vägt</span></div>
        </div>
      </Card>

      {/* Deal-level forecast */}
      <Card title="Deals i prognosen">
        {deals.map((d, i) => (
          <Row key={i} border={i < deals.length - 1}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: C.sec }}>{d.company} · Stänger: {d.close}</div>
            </div>
            <div style={{ textAlign: "right", minWidth: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{formatEur(d.value)}</div>
              <div style={{ fontSize: 11, color: C.tert }}>{d.probability}%</div>
            </div>
            <div style={{ minWidth: 90, textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>{formatEur(Math.round(d.value * d.probability / 100))}</div>
              <div style={{ fontSize: 11, color: C.tert }}>vägt</div>
            </div>
            <Badge color={stageColor(d.stage)}>{d.stage}</Badge>
          </Row>
        ))}
      </Card>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("overview");

  const viewComponents: Record<string, React.ReactNode> = {
    overview: <OverviewView />,
    pipeline: <PipelineView />,
    reports: <ReportsView />,
    payouts: <PayoutsView />,
    currencies: <CurrenciesView />,
    forecast: <ForecastView />,
  };

  const current = navItems.find(n => n.id === view)!;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", color: C.text, WebkitFontSmoothing: "antialiased" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.card, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Sales</div>
              <div style={{ fontSize: 11, color: C.tert }}>Pixdrift OMS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, border: "none",
                  background: active ? "#007AFF15" : "transparent",
                  color: active ? C.blue : C.sec,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: "pointer", textAlign: "left", width: "100%",
                  transition: "all 0.15s",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 16px", borderTop: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.green + "18", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Erik Svensson</div>
            <div style={{ fontSize: 11, color: C.tert }}>Sales Director</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${C.border}`, padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>{current?.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.tert, fontFamily: "monospace" }}>{new Date().toLocaleDateString("sv-SE")}</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <div style={{ fontSize: 12, color: C.sec }}>Live data</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "24px 28px 60px" }}>
          {viewComponents[view] ?? <Empty msg="Vy saknas" />}
        </div>
      </div>
    </div>
  );
}
