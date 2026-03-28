import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { DayPicker, DayFlag, getDefaultClassNames, SelectionState, UI } from "react-day-picker";
import { format, isValid, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

const triggerClass =
  "flex w-full min-h-[2.75rem] items-center gap-2 rounded-xl border border-indigo-200/90 " +
  "bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/60 px-3 py-2.5 text-left text-sm text-slate-800 " +
  "shadow-sm shadow-indigo-100/30 transition " +
  "hover:border-indigo-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400/35 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const panelClass =
  "absolute left-0 top-full z-[120] mt-2 w-max max-w-[min(100vw-2rem,22rem)] rounded-2xl border border-indigo-300 " +
  "bg-white p-3 shadow-xl shadow-indigo-200/40 " +
  "max-sm:right-0 max-sm:left-auto sm:max-w-none";

export interface ActivityDatePickerProps {
  id: string;
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
}

export function ActivityDatePicker({
  id,
  value,
  onChange,
  disabled,
}: ActivityDatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  const defaultClassNames = getDefaultClassNames();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const labelText = selected
    ? format(selected, "EEEE d MMMM yyyy", { locale: fr })
    : "Choisir une date";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={triggerClass}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{labelText}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-indigo-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className={panelClass} role="dialog" aria-label="Calendrier">
          <DayPicker
            mode="single"
            locale={fr}
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            defaultMonth={selected ?? new Date()}
            disabled={{ before: startOfDay(new Date()) }}
            classNames={{
              ...defaultClassNames,
              [UI.Root]: `${defaultClassNames.root} colife-rdp`,
              [UI.Months]: `${defaultClassNames.months} gap-2`,
              [UI.MonthCaption]: `${defaultClassNames.month_caption} mb-2 flex items-center justify-center`,
              [UI.CaptionLabel]: `${defaultClassNames.caption_label} text-sm font-semibold capitalize text-slate-800`,
              [UI.Nav]: `${defaultClassNames.nav} flex items-center justify-between gap-2`,
              [UI.PreviousMonthButton]: `${defaultClassNames.button_previous} flex h-9 w-9 items-center justify-center rounded-xl border border-purple-200/80 bg-white text-purple-700 shadow-sm transition hover:bg-purple-50`,
              [UI.NextMonthButton]: `${defaultClassNames.button_next} flex h-9 w-9 items-center justify-center rounded-xl border border-purple-200/80 bg-white text-purple-700 shadow-sm transition hover:bg-purple-50`,
              [UI.Weekdays]: `${defaultClassNames.weekdays} mb-1`,
              [UI.Weekday]: `${defaultClassNames.weekday} text-xs font-semibold uppercase text-slate-500`,
              [UI.DayButton]: `${defaultClassNames.day_button} text-sm font-medium text-slate-800`,
            }}
            modifiersClassNames={{
              [SelectionState.selected]:
                "!bg-gradient-to-br !from-blue-600 !to-purple-600 !text-white !border-transparent !shadow-md",
              [DayFlag.today]: "!font-bold !text-blue-600",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
