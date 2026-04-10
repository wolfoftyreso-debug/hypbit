export type Mode = "global" | "my_network" | "private";

const MODES: { value: Mode; label: string }[] = [
  { value: "global", label: "GLOBAL" },
  { value: "my_network", label: "MY NETWORK" },
  { value: "private", label: "PRIVATE" },
];

export function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        borderRadius: 999,
        background: "#0f172a",
        border: "1px solid #1f2937",
        padding: 2,
      }}
    >
      {MODES.map((m) => {
        const active = m.value === value;
        return (
          <button
            key={m.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.value)}
            style={{
              fontFamily: "inherit",
              fontSize: 11,
              letterSpacing: 1,
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: active ? "#2563eb" : "transparent",
              color: active ? "#ffffff" : "#94a3b8",
              transition: "background 0.15s",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
