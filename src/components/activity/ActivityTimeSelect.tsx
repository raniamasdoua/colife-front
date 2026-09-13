import { useEffect, useState } from "react";

function fmt2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseHm(value: string): { h: number; m: number } {
  if (!value || !value.includes(":")) return { h: -1, m: -1 };
  const [a, b] = value.split(":");
  const h = Number.parseInt(a, 10);
  const m = Number.parseInt(b, 10);
  return {
    h: Number.isNaN(h) ? -1 : Math.max(0, Math.min(h, 23)),
    m: Number.isNaN(m) ? -1 : Math.max(0, Math.min(m, 59)),
  };
}

function onlyDigits(text: string): string {
  return text.replace(/\D/g, "").slice(0, 2);
}

export interface ActivityTimeSelectProps {
  idPrefix: string;
  value: string;
  onChange: (hm: string) => void;
  disabled?: boolean;
}

export function ActivityTimeSelect({ idPrefix, value, onChange, disabled }: ActivityTimeSelectProps) {
  const { h, m } = parseHm(value);

  const [hourText, setHourText] = useState(h < 0 ? "" : fmt2(h));
  const [minuteText, setMinuteText] = useState(m < 0 ? "" : fmt2(m));

  useEffect(() => {
    setHourText(h < 0 ? "" : fmt2(h));
  }, [h]);

  useEffect(() => {
    setMinuteText(m < 0 ? "" : fmt2(m));
  }, [m]);

  const adjustH = (delta: number) => {
    const base = h < 0 ? 8 : h;
    const nh = ((base + delta) + 24) % 24;
    onChange(`${fmt2(nh)}:${m < 0 ? "00" : fmt2(m)}`);
  };

  const adjustM = (delta: number) => {
    const base = m < 0 ? 0 : m;
    const nm = ((base + delta) + 60) % 60;
    onChange(`${h < 0 ? "08" : fmt2(h)}:${fmt2(nm)}`);
  };

  const commitHour = (text: string) => {
    const parsed = Number.parseInt(text, 10);
    const nh = Number.isNaN(parsed) ? (h < 0 ? 8 : h) : Math.max(0, Math.min(parsed, 23));
    onChange(`${fmt2(nh)}:${m < 0 ? "00" : fmt2(m)}`);
  };

  const commitMinute = (text: string) => {
    const parsed = Number.parseInt(text, 10);
    const nm = Number.isNaN(parsed) ? (m < 0 ? 0 : m) : Math.max(0, Math.min(parsed, 59));
    onChange(`${h < 0 ? "08" : fmt2(h)}:${fmt2(nm)}`);
  };

  const btnCls =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold leading-none " +
    "text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition " +
    "disabled:cursor-not-allowed disabled:opacity-40 select-none";

  const inputCls =
    "w-6 shrink-0 border-0 bg-transparent text-center text-sm font-bold tabular-nums text-slate-800 " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400 rounded " +
    "disabled:cursor-not-allowed";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div
      id={idPrefix}
      className="flex items-center justify-center gap-0.5 rounded-xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/60 px-2 py-2 shadow-sm"
    >
      <button type="button" onClick={() => adjustH(-1)} disabled={disabled} className={btnCls} aria-label="Diminuer les heures">−</button>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="--"
        aria-label="Heures"
        value={hourText}
        disabled={disabled}
        onChange={(e) => setHourText(onlyDigits(e.target.value))}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commitHour(e.target.value)}
        onKeyDown={handleKeyDown}
        className={inputCls}
      />
      <button type="button" onClick={() => adjustH(1)} disabled={disabled} className={btnCls} aria-label="Augmenter les heures">+</button>

      <span className="mx-1 text-sm font-bold text-slate-400 select-none" aria-hidden>:</span>

      <button type="button" onClick={() => adjustM(-1)} disabled={disabled} className={btnCls} aria-label="Diminuer les minutes">−</button>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="--"
        aria-label="Minutes"
        value={minuteText}
        disabled={disabled}
        onChange={(e) => setMinuteText(onlyDigits(e.target.value))}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commitMinute(e.target.value)}
        onKeyDown={handleKeyDown}
        className={inputCls}
      />
      <button type="button" onClick={() => adjustM(1)} disabled={disabled} className={btnCls} aria-label="Augmenter les minutes">+</button>
    </div>
  );
}
