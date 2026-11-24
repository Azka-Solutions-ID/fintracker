/** Inline Material-style icons. Decorative only: every icon sits next to a text label,
    so screen readers get the words and skip the glyph. */
type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true as const,
  focusable: "false" as const,
});

export function IconPlus({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
  );
}

export function IconWallet({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12v2H5a1 1 0 0 0 0 2h12a2 2 0 0 1 2 2v-1h2zm1 1h-2v2h2v-2zm-6 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    </svg>
  );
}

export function IconChart({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 20h3v-7H4zm6.5 0h3V4h-3zM17 20h3v-11h-3z" />
    </svg>
  );
}

export function IconList({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 6h14v2H5zm0 5h14v2H5zm0 5h9v2H5z" />
    </svg>
  );
}

export function IconGrid({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" />
    </svg>
  );
}

export function IconCheck({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9.5 17.5 4 12l1.5-1.5L9.5 14.5 18.5 5.5 20 7z" />
    </svg>
  );
}

/* ---- destination icons: every nav item carries one, so a 5-item bar and a 12-item sidebar
   stay scannable at a glance (labels still do the work — icons never stand alone) ---- */

export function IconTarget({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7zm0 4a5 5 0 1 0 5 5h-2a3 3 0 1 1-3-3zm0 4a1 1 0 1 0 1 1h6V9h-7z" />
    </svg>
  );
}

export function IconScale({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M11 3h2v3.2l4.6 1.9a2 2 0 0 1 1.2 1.9V12h-2V10l-3.8-1.6V19h5v2H6v-2h5V8.4L7.2 10v2H5V10a2 2 0 0 1 1.2-1.9L11 6.2z" />
    </svg>
  );
}

export function IconTag({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20.6 12.2 12 3.6H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8zM7.5 9A1.5 1.5 0 1 1 9 7.5 1.5 1.5 0 0 1 7.5 9z" />
    </svg>
  );
}

export function IconHeart({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 20 4.3 12.3a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2a4.6 4.6 0 0 1 6.5 6.5z" />
    </svg>
  );
}

export function IconCalendar({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zm12 8H5v10h14zM7 12h4v4H7z" />
    </svg>
  );
}

export function IconCalculator({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm2 3v4h10V5zm0 7h3v3H7zm5 0h3v3h-3zm5 0h-1v3h1zm-10 5h3v3H7zm5 0h3v3h-3z" />
    </svg>
  );
}

export function IconStar({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m12 2 3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}

export function IconDownload({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M11 3h2v8h3.5L12 16.5 7.5 11H11zM4 18h16v2H4z" />
    </svg>
  );
}

export function IconPie({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M11 3v9h9a9 9 0 0 1-9 9 9 9 0 0 1 0-18zm2 0a9 9 0 0 1 7.6 7.6H13z" />
    </svg>
  );
}

export function IconCard({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 6h18a1 1 0 0 1 1 1v3H2V7a1 1 0 0 1 1-1zm-1 6h20v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function IconMenu({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
    </svg>
  );
}

export function IconHelp({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-.1 3a3 3 0 0 0-3 3h2a1 1 0 1 1 1.6.8c-.8.6-1.5 1.2-1.5 2.7h2c0-.7.2-.9.8-1.4A3 3 0 0 0 11.9 7zM11 15.5h2V17h-2z" />
    </svg>
  );
}
