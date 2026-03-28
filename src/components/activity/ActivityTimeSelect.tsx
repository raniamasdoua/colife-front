import { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function parseHm(value: string): { h: string; m: string } {
  if (!value || !value.includes(":")) return { h: "", m: "" };
  const [a, b] = value.split(":");
  const rawMin = b?.padStart(2, "0") ?? "";
  const n = parseInt(rawMin, 10);
  const snapped = isNaN(n) ? "" : String(Math.round(n / 5) * 5 > 55 ? 55 : Math.round(n / 5) * 5).padStart(2, "0");
  return { h: a?.padStart(2, "0") ?? "", m: snapped };
}

const VARIANT = {
  start: {
    trigger:
      "flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-violet-300 " +
      "bg-gradient-to-br from-white to-violet-50 px-3 text-sm font-semibold text-slate-800 shadow-sm " +
      "transition hover:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 " +
      "disabled:cursor-not-allowed disabled:opacity-50",
    panel:
      "absolute left-0 top-full z-[130] mt-1.5 min-w-[4.5rem] rounded-xl border border-violet-200 " +
      "bg-white shadow-lg shadow-violet-200/40 ring-1 ring-violet-100 overflow-hidden",
    item: "w-full cursor-pointer px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700",
    active: "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:bg-none hover:text-white",
    icon: "text-violet-500",
    chevron: "text-violet-400",
  },
  end: {
    trigger:
      "flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-fuchsia-300 " +
      "bg-gradient-to-br from-white to-fuchsia-50 px-3 text-sm font-semibold text-slate-800 shadow-sm " +
      "transition hover:border-fuchsia-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 " +
      "disabled:cursor-not-allowed disabled:opacity-50",
    panel:
      "absolute left-0 top-full z-[130] mt-1.5 min-w-[4.5rem] rounded-xl border border-fuchsia-200 " +
      "bg-white shadow-lg shadow-fuchsia-200/40 ring-1 ring-fuchsia-100 overflow-hidden",
    item: "w-full cursor-pointer px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-fuchsia-50 hover:text-fuchsia-700",
    active: "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:bg-none hover:text-white",
    icon: "text-fuchsia-500",
    chevron: "text-fuchsia-400",
  },
} as const;

interface DropdownProps {
  id: string;
  label: string;
  options: string[];
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  variant: "start" | "end";
  prefix?: React.ReactNode;
}

function TimeDropdown({
  id,
  label,
  options,
  value,
  placeholder,
  onChange,
  disabled,
  variant,
  prefix,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const v = VARIANT[variant];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll active item into view when panel opens
  useEffect(() => {
    if (!open || !listRef.current || !value) return;
    const active = listRef.current.querySelector("[data-active='true']");
    if (active) {
      (active as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((o) => !o);
    }
    if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        id={id}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKey}
        className={v.trigger}
      >
        {prefix}
        <span className="min-w-0 flex-1 text-center tabular-nums">
          {value || <span className="text-slate-400">{placeholder}</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""} ${v.chevron}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          ref={listRef}
          className={`${v.panel} max-h-52 overflow-y-auto`}
        >
          {options.map((opt) => {
            const isActive = opt === value;
            return (
              <button
                key={opt}
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`${v.item} ${isActive ? v.active : ""}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface ActivityTimeSelectProps {
  idPrefix: string;
  value: string;
  onChange: (hm: string) => void;
  disabled?: boolean;
  variant: "start" | "end";
}

export function ActivityTimeSelect({
  idPrefix,
  value,
  onChange,
  disabled,
  variant,
}: ActivityTimeSelectProps) {
  const { h, m } = parseHm(value);
  const v = VARIANT[variant];

  const onHour = (nh: string) => onChange(`${nh}:${m || "00"}`);
  const onMin = (nm: string) => onChange(`${h || "08"}:${nm}`);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <TimeDropdown
        id={`${idPrefix}-h`}
        label="Heure"
        options={HOURS}
        value={h}
        placeholder="HH"
        onChange={onHour}
        disabled={disabled}
        variant={variant}
        prefix={
          <Clock className={`h-4 w-4 shrink-0 ${v.icon}`} aria-hidden />
        }
      />

      <span className="shrink-0 text-base font-bold text-slate-400" aria-hidden>
        :
      </span>

      <TimeDropdown
        id={`${idPrefix}-m`}
        label="Minutes"
        options={MINUTES}
        value={m}
        placeholder="MM"
        onChange={onMin}
        disabled={disabled}
        variant={variant}
      />
    </div>
  );
}
