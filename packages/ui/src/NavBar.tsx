import type { ReactNode } from "react";

export type NavTab = { id: string; label: string; icon: ReactNode };

type Props = {
  tabs: NavTab[];
  current: string;
  onChange: (id: string) => void;
};

/** M3 navigation bar: icon + label on every destination (never icon-only), the active one
    marked with aria-current and a tonal indicator. */
export function NavBar({ tabs, current, onChange }: Props) {
  return (
    <nav className="navbar" aria-label="Menu utama">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="nav-item"
          aria-current={current === tab.id ? "page" : undefined}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
