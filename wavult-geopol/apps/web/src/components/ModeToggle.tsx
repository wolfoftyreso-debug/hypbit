export type Mode = "global" | "my_network" | "private";

const MODES: { value: Mode; label: string }[] = [
  { value: "global", label: "GLOBAL" },
  { value: "my_network", label: "MY NETWORK" },
  { value: "private", label: "PRIVATE" },
];

export function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="tablist" className="wg-tabs">
      {MODES.map((m) => {
        const active = m.value === value;
        return (
          <button
            key={m.value}
            role="tab"
            aria-selected={active}
            className={`wg-tabs__tab ${active ? "wg-tabs__tab--active" : ""}`}
            onClick={() => onChange(m.value)}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
