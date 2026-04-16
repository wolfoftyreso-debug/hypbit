import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "subtle" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  full = false,
  className = "",
  children,
  ...rest
}: Props) {
  const classes = [
    "wg-button",
    `wg-button--${variant}`,
    full && "wg-button--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
