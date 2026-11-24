import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "filled" | "tonal" | "text" | "outline";
  children: ReactNode;
};

/** M3 button. Filled is the page's one primary action; tonal for the secondary; text for
    inline actions (undo, bantuan). Sizes come from tokens, never from this file. */
export function Button({ variant = "tonal", children, className = "", ...rest }: Props) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
