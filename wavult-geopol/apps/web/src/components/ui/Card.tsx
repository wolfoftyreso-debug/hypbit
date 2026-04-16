import type { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "flat" | "elevated";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function Card({
  variant = "default",
  title,
  subtitle,
  actions,
  className = "",
  children,
  ...rest
}: Props) {
  const classes = [
    "wg-card",
    variant !== "default" && `wg-card--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {(title || actions) && (
        <div className="wg-card__header">
          <div>
            {title && <h2 className="wg-card__title">{title}</h2>}
            {subtitle && <p className="wg-card__subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
