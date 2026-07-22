import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function todayParts() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const [y, mo, day] = iso.split("-").map(Number);
  if (!y || mo == null || !day) return null;
  return { y, m: mo - 1, d: day };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatFr(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso + "T00:00:00"));
  } catch {
    return "";
  }
}

function getDaysGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(i);
  return grid;
}

export interface ActivityDatePickerProps {
  id: string;
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
}

export function ActivityDatePicker({ id, value, onChange, disabled }: ActivityDatePickerProps) {
  const today = todayParts();
  const selected = parseIso(value);

  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(selected?.y ?? today.y);
  const [viewM, setViewM] = useState(selected?.m ?? today.m);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const prevMonth = () => {
    if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); }
    else setViewM((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); }
    else setViewM((m) => m + 1);
  };

  const isPast = (d: number) => {
    if (viewY < today.y) return true;
    if (viewY === today.y && viewM < today.m) return true;
    if (viewY === today.y && viewM === today.m && d < today.d) return true;
    return false;
  };

  const grid = getDaysGrid(viewY, viewM);
  const label = value ? formatFr(value) : "Choisir une date";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          "flex w-full min-h-[2.75rem] items-center gap-2 rounded-xl border border-indigo-200/90 " +
          "bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/60 px-3 py-2.5 text-left text-sm " +
          "shadow-sm shadow-indigo-100/30 transition " +
          "hover:border-indigo-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400/35 " +
          "disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        <Calendar className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
        <span
          className={`min-w-0 flex-1 truncate font-medium capitalize ${
            !value ? "text-slate-400" : "text-slate-800"
          }`}
        >
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-indigo-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendrier"
          className={
            "absolute left-0 top-full z-[120] mt-2 w-64 rounded-2xl border border-indigo-200 " +
            "bg-white p-3 shadow-xl shadow-indigo-200/40 max-sm:left-auto max-sm:right-0"
          }
        >
          {/* Navigation mois */}
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Mois précédent"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-purple-600 transition hover:bg-purple-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-slate-800">
              {MONTHS_FR[viewM]} {viewY}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Mois suivant"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-200 text-purple-600 transition hover:bg-purple-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS_FR.map((day) => (
              <span
                key={day}
                className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Grille jours */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {grid.map((day, i) => {
              if (!day) return <span key={i} />;
              const past = isPast(day);
              const isToday = viewY === today.y && viewM === today.m && day === today.d;
              const isSel =
                selected !== null &&
                viewY === selected.y &&
                viewM === selected.m &&
                day === selected.d;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={past}
                  onClick={() => {
                    if (!past) {
                      onChange(toIso(viewY, viewM, day));
                      setOpen(false);
                    }
                  }}
                  className={[
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition",
                    isSel
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white shadow-md"
                      : isToday
                      ? "font-bold text-blue-600 hover:bg-blue-50"
                      : past
                      ? "cursor-not-allowed text-slate-300"
                      : "font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
