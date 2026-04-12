import { X } from "lucide-react";

type MessageModalProps = {
  open: boolean;
  /** Titre affiché au-dessus du message */
  title?: string;
  message: string;
  onClose: () => void;
  /** Libellé du bouton principal */
  confirmLabel?: string;
  /** "success" : mise en avant verte (ex. inscription réussie) */
  variant?: "default" | "success";
};

/**
 * Modale simple (message + bouton OK), au-dessus des autres overlays (ex. détail activité).
 */
export function MessageModal({
  open,
  title = "Inscription impossible",
  message,
  onClose,
  confirmLabel = "OK",
  variant = "default",
}: MessageModalProps) {
  if (!open) return null;

  const isSuccess = variant === "success";

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ${
          isSuccess ? "ring-emerald-200 shadow-emerald-900/5" : "ring-slate-200"
        }`}
      >
        {isSuccess && (
          <div
            className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-500"
            aria-hidden
          />
        )}
        <div className={`flex items-start justify-between gap-3 ${isSuccess ? "pt-0.5" : ""}`}>
          <h2
            id="message-modal-title"
            className={`pr-2 text-lg font-bold leading-snug ${
              isSuccess ? "text-emerald-900" : "text-slate-900"
            }`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 ${
              isSuccess
                ? "text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-500"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-purple-500"
            }`}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className={`mt-3 text-sm leading-relaxed ${isSuccess ? "text-emerald-900/90" : "text-slate-600"}`}>
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isSuccess
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 focus-visible:ring-emerald-500"
              : "bg-slate-900 hover:bg-slate-800 focus-visible:ring-purple-500"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
