import { useEffect, useState } from "react";

type Settings = {
  textsize: "normal" | "besar" | "sangat-besar";
  contrast: "normal" | "tinggi";
  motion: "normal" | "reduksi";
};

const KEY = "sidp.tampilan";
const DEFAULTS: Settings = { textsize: "normal", contrast: "normal", motion: "normal" };

function read(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

/** One settings panel for the whole app (not a separate "senior mode"). Values land on
    <html data-*> and the token file does the rest. */
export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    const stored = read();
    setSettings(stored);
    apply(stored);
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    apply(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div className="card">
      <p className="h-section" style={{ marginTop: 0 }}>
        Tampilan
      </p>

      <div className="segmented" role="group" aria-label="Ukuran huruf">
        {(
          [
            ["normal", "Biasa"],
            ["besar", "Besar"],
            ["sangat-besar", "Sangat besar"],
          ] as [Settings["textsize"], string][]
        ).map(([size, text]) => (
          <button
            key={size}
            type="button"
            className="segment"
            aria-pressed={settings.textsize === size}
            onClick={() => update({ textsize: size })}
          >
            {settings.textsize === size && <span className="segment-check" aria-hidden="true">✓</span>}
            {text}
          </button>
        ))}
      </div>

      <label className="option">
        Kontras tinggi
        <input
          type="checkbox"
          className="switch"
          checked={settings.contrast === "tinggi"}
          onChange={(event) => update({ contrast: event.target.checked ? "tinggi" : "normal" })}
        />
      </label>

      <label className="option">
        Kurangi animasi
        <input
          type="checkbox"
          className="switch"
          checked={settings.motion === "reduksi"}
          onChange={(event) => update({ motion: event.target.checked ? "reduksi" : "normal" })}
        />
      </label>
    </div>
  );
}

function apply(settings: Settings) {
  const root = document.documentElement;
  root.dataset.textsize = settings.textsize;
  root.dataset.contrast = settings.contrast;
  root.dataset.motion = settings.motion;
}
