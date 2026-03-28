import { useEffect, useRef, useState } from "react";
import { ChevronDown, Tag } from "lucide-react";
import type { ActivityTypeOption } from "../../types/activity";

export interface ActivityTypeSelectProps {
  id: string;
  types: ActivityTypeOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ActivityTypeSelect({
  id,
  types,
  value,
  onChange,
  disabled,
  loading,
}: ActivityTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = types.find((t) => String(t.id) === value);

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

  useEffect(() => {
    if (!open || !listRef.current || !value) return;
    const active = listRef.current.querySelector("[data-active='true']");
    if (active) (active as HTMLElement).scrollIntoView({ block: "nearest" });
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

  const isDisabled = disabled || loading || types.length === 0;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Type d'activité"
        disabled={isDisabled}
        onClick={() => !isDisabled && setOpen((o) => !o)}
        onKeyDown={handleKey}
        className={[
          "flex w-full min-h-[2.75rem] items-center gap-2 rounded-xl border px-3 py-2.5",
          "text-left text-sm font-medium shadow-sm transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selected
            ? "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-indigo-50 text-slate-800"
            : "border-gray-200 bg-white text-slate-400",
        ].join(" ")}
      >
        <Tag
          className={`h-4 w-4 shrink-0 ${selected ? "text-purple-500" : "text-gray-300"}`}
          aria-hidden
        />

        {loading ? (
          <span className="flex-1 text-slate-400">Chargement…</span>
        ) : selected ? (
          <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
            {selected.name}
          </span>
        ) : (
          <span className="flex-1">Sélectionnez un type</span>
        )}

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""} ${selected ? "text-purple-400" : "text-gray-300"}`}
          aria-hidden
        />
      </button>

      {open && types.length > 0 && (
        <div
          role="listbox"
          aria-label="Type d'activité"
          ref={listRef}
          className="absolute left-0 right-0 top-full z-[130] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-purple-200 bg-white shadow-xl shadow-purple-200/40 ring-1 ring-purple-100"
        >
          {types.map((t) => {
            const isActive = String(t.id) === value;
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                type="button"
                onClick={() => {
                  onChange(String(t.id));
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white"
                    : "text-slate-700 hover:bg-purple-50 hover:text-purple-800",
                ].join(" ")}
              >
                <Tag
                  className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white/80" : "text-purple-400"}`}
                  aria-hidden
                />
                <span className="truncate">{t.name}</span>
                {isActive && (
                  <svg
                    className="ml-auto h-4 w-4 shrink-0 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-5.121-5.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
