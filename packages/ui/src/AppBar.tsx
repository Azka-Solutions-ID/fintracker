type Props = {
  title: string;
  /** module screens open from "Lainnya": a labelled back target beats a gesture (2.5.7). */
  onBack?: () => void;
  /** WhatsApp of the facilitator: a route to a human, in the same corner on every screen (3.2.6). */
  helpContact?: string;
  brand?: string;
};

/** Top app bar: product mark, title, one trailing action. Stays in normal flow, so it can never
    cover the field being typed into (WCAG 2.4.11). */
export function AppBar({ title, helpContact = "6281234567890", brand = "S", onBack }: Props) {
  return (
    <header className="appbar">
      {onBack ? (
        <button type="button" className="appbar-back" onClick={onBack} aria-label="Kembali ke daftar fitur">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M15.4 5.4 8.8 12l6.6 6.6 1.4-1.4-5.2-5.2 5.2-5.2z" />
          </svg>
        </button>
      ) : (
        <span className="appbar-mark" aria-hidden="true">
          {brand}
        </span>
      )}
      <h1 className="appbar-title">{title}</h1>
      <a
        className="appbar-action"
        href={`https://wa.me/${helpContact}?text=${encodeURIComponent("Saya butuh bantuan memakai aplikasi catatan keuangan.")}`}
        aria-label="Bantuan: chat pendamping di WhatsApp"
        title="Bantuan"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-.1 3a3 3 0 0 0-3 3h2a1 1 0 1 1 1.6.8c-.8.6-1.5 1.2-1.5 2.7h2c0-.7.2-.9.8-1.4A3 3 0 0 0 11.9 7zM11 15.5h2V17h-2z" />
        </svg>
      </a>
    </header>
  );
}
