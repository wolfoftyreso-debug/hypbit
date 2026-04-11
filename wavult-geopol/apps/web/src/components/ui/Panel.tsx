import type { CSSProperties, ReactNode } from "react";
import { Button } from "./Button.js";

type Props = {
  children: ReactNode;
  onClose?: () => void;
  floating?: boolean;
  style?: CSSProperties;
};

export function Panel({ children, onClose, floating, style }: Props) {
  const className = floating ? "wg-panel wg-panel--floating" : "wg-panel";
  return (
    <aside className={className} style={style}>
      {onClose && (
        <div className="wg-panel__close">
          <Button variant="icon" onClick={onClose} aria-label="Close">
            ×
          </Button>
        </div>
      )}
      {children}
    </aside>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="wg-section-label">{children}</div>;
}
