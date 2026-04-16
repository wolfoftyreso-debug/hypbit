import type { ReactNode } from "react";

type Severity = "CRITICAL" | "IMPORTANT" | "INFO";
type Access = "HIGH" | "MEDIUM" | "LOW";

type Props = {
  children: ReactNode;
  severity?: Severity;
  access?: Access;
  title?: string;
};

export function Badge({ children, severity, access, title }: Props) {
  const variant = severity
    ? `wg-badge--severity-${severity.toLowerCase()}`
    : access
    ? `wg-badge--access-${access.toLowerCase()}`
    : "wg-badge--neutral";
  return (
    <span className={`wg-badge ${variant}`} title={title}>
      {children}
    </span>
  );
}
