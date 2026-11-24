import { useId } from "react";
import { groupDigits, parseDigits, rupiahWords } from "./money";

type Quick = { label: string; value: number };

type Props = {
  id?: string;
  label?: string;
  hint?: string;
  /** raw digits, e.g. "125000" */
  value: string;
  onChange: (digits: string) => void;
  quick?: Quick[];
};

/* Four chips keep one row at 390px: five wrapped and pushed the Save action off screen. */
const DEFAULT_QUICK: Quick[] = [
  { label: "5 rb", value: 5_000 },
  { label: "10 rb", value: 10_000 },
  { label: "25 rb", value: 25_000 },
  { label: "50 rb", value: 50_000 },
];

/** M3 filled field for money, built around the #1 failure of this audience: a wrong zero.
    The label sits inside the field, the number is the biggest thing on the screen, the amount
    is echoed in Indonesian words, and quick chips cover the amounts people actually type. */
export function MoneyInput({ id, label = "Jumlah uang", hint, value, onChange, quick = DEFAULT_QUICK }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const wordsId = `${inputId}-kata`;
  const hintId = `${inputId}-hint`;
  const describedBy = [wordsId, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className="field">
      <div className="money-field">
        <label className="money-label" htmlFor={inputId}>
          {label}
        </label>
        <div className="money-row">
          <span className="money-prefix" aria-hidden="true">
            Rp
          </span>
          <input
            id={inputId}
            className="money-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={groupDigits(value)}
            onChange={(event) => onChange(parseDigits(event.target.value))}
            aria-describedby={describedBy}
          />
        </div>
      </div>

      <p id={wordsId} className="money-words" aria-live="polite">
        {value ? rupiahWords(value) : "Tulis jumlahnya tanpa titik."}
      </p>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}

      <div className="chips" role="group" aria-label="Nominal cepat">
        {quick.map((item) => (
          <button
            key={item.value}
            type="button"
            className="chip"
            onClick={() => onChange(String(Number(value || "0") + item.value))}
          >
            + {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
