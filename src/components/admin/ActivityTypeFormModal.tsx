import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { COLIFE_CARD } from "./adminTheme";

export type ActivityTypeFormValues = { name: string };

type ActivityTypeFormModalProps = {
  open: boolean;
  title: string;
  initialName: string;
  submitLabel: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: ActivityTypeFormValues) => void;
};

const inputClass =
  "w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent " +
  "transition placeholder:text-slate-300 disabled:opacity-50";

export function ActivityTypeFormModal({
  open,
  title,
  initialName,
  submitLabel,
  loading,
  onClose,
  onSubmit,
}: ActivityTypeFormModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError("");
    }
  }, [open, initialName]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Le nom est obligatoire.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Le nom ne doit pas dépasser 60 caractères.");
      return;
    }
    setError("");
    onSubmit({ name: trimmed });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-type-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full max-w-md ${COLIFE_CARD} p-5 shadow-2xl`}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="activity-type-form-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-purple-50 hover:text-purple-700 transition disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="activity-type-name" className="block text-xs font-semibold text-slate-600 mb-1">
              Nom du type
            </label>
            <input
              id="activity-type-name"
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Ex. Sport, Culture…"
              maxLength={60}
              disabled={loading}
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-400">{name.trim().length}/60</p>
            {error && (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:opacity-90 transition disabled:opacity-60 shadow-md shadow-purple-500/20"
            >
              {loading ? "Enregistrement…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
