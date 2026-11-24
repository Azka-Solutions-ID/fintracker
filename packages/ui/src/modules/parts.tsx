import type { ReactNode } from "react";
import type { Book, Kind } from "../store";

export type Vocab = { masuk: string; keluar: string; laba: string; minus: string };

export type ModuleProps = {
  book: Book;
  walletIds: string[];
  v: Vocab;
  /** localStorage namespace of the app that hosts this module */
  namespace: string;
};

export function Intro({ children }: { children: ReactNode }) {
  return <p className="support">{children}</p>;
}

export function Rows({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="row">
      <span className="row-label">{label}</span>
      <span className={strong ? "amount-hero" : "amount"}>{value}</span>
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="support">{children}</p>;
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label className="module-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "tel";
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      className="module-input"
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select id={id} className="module-select" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Two options max, always with a word — never an icon-only or colour-only state. */
export function Pair({
  legend,
  value,
  onChange,
  labels,
}: {
  legend: string;
  value: string;
  onChange: (next: string) => void;
  labels: { id: string; label: string }[];
}) {
  return (
    <div className="segmented" role="group" aria-label={legend}>
      {labels.map((item) => (
        <button
          key={item.id}
          type="button"
          className="segment"
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          <span className="segment-check" aria-hidden="true">
            {value === item.id ? "✓" : ""}
          </span>
          <span className="segment-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function kindOptions(v: Vocab): { id: Kind; label: string }[] {
  return [
    { id: "masuk", label: v.masuk },
    { id: "keluar", label: v.keluar },
  ];
}

/** Progress with the numbers spelled out beside it: a bar alone would be colour-only meaning. */
export function Meter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const capped = Math.min(percent, 100);
  const over = used > limit;
  return (
    <div className="meter-block">
      <div className="meter" aria-hidden="true">
        <span className={over ? "meter-fill meter-over" : "meter-fill"} style={{ width: `${capped}%` }} />
      </div>
      <p className="meter-text">
        {label}: {percent}% {over ? "— lewat batas" : `— sisa Rp ${(limit - used).toLocaleString("id-ID")}`}
      </p>
    </div>
  );
}
