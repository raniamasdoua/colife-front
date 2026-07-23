function fmt2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseHm(value: string): { h: number; m: number } {
  if (!value || !value.includes(":")) return { h: -1, m: -1 };
  const [a, b] = value.split(":");
  const h = Number.parseInt(a, 10);
  const rawMin = Number.parseInt(b, 10);
  const m = Number.isNaN(rawMin) ? -1 : Math.min(Math.round(rawMin / 5) * 5, 55);
  return { h: Number.isNaN(h) ? -1 : Math.max(0, Math.min(h, 23)), m };
}

export interface ActivityTimeSelectProps {
  idPrefix: string;
  value: string;
  onChange: (hm: string) => void;
  disabled?: boolean;
}

export function ActivityTimeSelect({ idPrefix, value, onChange, disabled }: ActivityTimeSelectProps) {
  const { h, m } = parseHm(value);

  const adjustH = (delta: number) => {
    const base = h < 0 ? 8 : h;
    const nh = ((base + delta) + 24) % 24;
    onChange(`${fmt2(nh)}:${m < 0 ? "00" : fmt2(m)}`);
  };

  const adjustM = (delta: number) => {
    const base = m < 0 ? 0 : m;
    const nm = ((base + delta * 5) + 60) % 60;
    onChange(`${h < 0 ? "08" : fmt2(h)}:${fmt2(nm)}`);
  };

  const btnCls =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold leading-none " +
    "text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition " +
    "disabled:cursor-not-allowed disabled:opacity-40 select-none";

  const digitCls = "w-6 text-center text-sm font-bold tabular-nums text-slate-800 select-none";

  return (
    <div
      id={idPrefix}
      className="flex items-center justify-center gap-0.5 rounded-xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/60 px-2 py-2 shadow-sm"
    >
      <button type="button" onClick={() => adjustH(-1)} disabled={disabled} className={btnCls} aria-label="Diminuer les heures">−</button>
      <span className={digitCls}>{h < 0 ? "--" : fmt2(h)}</span>
      <button type="button" onClick={() => adjustH(1)} disabled={disabled} className={btnCls} aria-label="Augmenter les heures">+</button>

      <span className="mx-1 text-sm font-bold text-slate-400 select-none" aria-hidden>:</span>

      <button type="button" onClick={() => adjustM(-1)} disabled={disabled} className={btnCls} aria-label="Diminuer les minutes">−</button>
      <span className={digitCls}>{m < 0 ? "--" : fmt2(m)}</span>
      <button type="button" onClick={() => adjustM(1)} disabled={disabled} className={btnCls} aria-label="Augmenter les minutes">+</button>
    </div>
  );
}
