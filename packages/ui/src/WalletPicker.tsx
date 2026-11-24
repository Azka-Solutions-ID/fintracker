import { IconCheck } from "./Icons";

type Wallet = { id: string; name: string; hint?: string };

type Props = {
  legend: string;
  name: string;
  wallets: Wallet[];
  value: string | null;
  onChange: (id: string) => void;
};

/** Wallet choice as native radios inside M3 cards — tap to pick, never drag (WCAG 2.5.7).
    Selected state carries a word plus a tick, so it never depends on colour alone (1.4.1). */
export function WalletPicker({ legend, name, wallets, value, onChange }: Props) {
  return (
    <fieldset className="wallets">
      <legend>{legend}</legend>
      {wallets.map((wallet) => (
        <label key={wallet.id} className={`wallet ${value === wallet.id ? "wallet-selected" : ""}`}>
          <input
            type="radio"
            name={name}
            value={wallet.id}
            checked={value === wallet.id}
            onChange={() => onChange(wallet.id)}
          />
          <span className="wallet-head">
            <span className="wallet-name">{wallet.name}</span>
            {value === wallet.id && (
              <span className="wallet-check">
                <IconCheck /> Dipilih
              </span>
            )}
          </span>
          {wallet.hint && <span className="wallet-hint">{wallet.hint}</span>}
        </label>
      ))}
    </fieldset>
  );
}
