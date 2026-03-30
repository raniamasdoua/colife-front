import { useEffect, useId, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { createActivity, getActivityTypes } from "../services/activityService";
import { ApiRequestError } from "../services/api";
import type { ActivityTypeOption } from "../types/activity";
import { ActivityDatePicker } from "./activity/ActivityDatePicker";
import { ActivityTimeSelect } from "./activity/ActivityTimeSelect";
import { ActivityTypeSelect } from "./activity/ActivityTypeSelect";

const inputClass =
  "w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent " +
  "disabled:opacity-50 disabled:bg-gray-50";

const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_STREET = 255;
const MAX_COMPLEMENT = 255;
const MAX_CITY = 120;

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toBackendTime(value: string): string {
  if (!value) return value;
  const parts = value.split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const min = parts[1].padStart(2, "0");
    const sec = (parts[2] ?? "0").padStart(2, "0");
    return `${h}:${min}:${sec}`;
  }
  return value;
}

function emptyForm() {
  return {
    title: "",
    activityTypeId: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: "",
    street: "",
    complement: "",
    postalCode: "",
    city: "",
  };
}

export interface CreateActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateActivityModal({ open, onOpenChange }: CreateActivityModalProps) {
  const titleId = useId();
  const [types, setTypes] = useState<ActivityTypeOption[]>([]);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [title, setTitle] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [street, setStreet] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdActivityTitle, setCreatedActivityTitle] = useState("");

  const minDate = useMemo(() => todayIso(), []);

  useEffect(() => {
    if (!open) return;
    const initial = emptyForm();
    setTitle(initial.title);
    setActivityTypeId(initial.activityTypeId);
    setDescription(initial.description);
    setDate(initial.date);
    setStartTime(initial.startTime);
    setEndTime(initial.endTime);
    setCapacity(initial.capacity);
    setStreet(initial.street);
    setComplement(initial.complement);
    setPostalCode(initial.postalCode);
    setCity(initial.city);
    setSubmitError(null);
    setCreateSuccess(false);
    setCreatedActivityTitle("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingTypes(true);
    setTypesError(null);
    (async () => {
      try {
        const list = await getActivityTypes();
        if (!cancelled) {
          setTypes(list);
          setTypesError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setTypesError(
            e instanceof ApiRequestError
              ? e.message
              : "Impossible de charger les types d’activité."
          );
        }
      } finally {
        if (!cancelled) setLoadingTypes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onOpenChange]);

  useEffect(() => {
    if (!createSuccess) return;
    const t = window.setTimeout(() => onOpenChange(false), 2800);
    return () => window.clearTimeout(t);
  }, [createSuccess, onOpenChange]);

  const validateClient = (): string | null => {
    if (!title.trim()) return "Le titre est obligatoire.";
    if (!activityTypeId) return "Le type d’activité est obligatoire.";
    if (!date) return "La date est obligatoire.";
    if (!startTime || !endTime) return "Les heures de début et de fin sont obligatoires.";
    if (!capacity.trim()) return "La capacité est obligatoire.";
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) return "La capacité doit être un nombre positif.";
    if (!street.trim()) return "L’adresse (rue) est obligatoire.";
    if (!postalCode.trim()) return "Le code postal est obligatoire.";
    if (!/^\d{5}$/.test(postalCode.trim())) {
      return "Le code postal doit contenir 5 chiffres.";
    }
    if (!city.trim()) return "La ville est obligatoire.";

    const start = toBackendTime(startTime);
    const end = toBackendTime(endTime);
    if (start >= end) return "L’heure de fin doit être après l’heure de début.";

    if (date < minDate) return "La date ne peut pas être dans le passé.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const v = validateClient();
    if (v) {
      setSubmitError(v);
      return;
    }

    const cap = Number(capacity);
    const desc = description.trim();
    const payload = {
      title: title.trim(),
      description: desc.length > 0 ? desc : null,
      activityTypeId: Number(activityTypeId),
      date,
      startTime: toBackendTime(startTime),
      endTime: toBackendTime(endTime),
      capacity: cap,
      location: {
        street: street.trim(),
        complement: complement.trim() || null,
        postalCode: postalCode.trim(),
        city: city.trim(),
      },
    };

    try {
      setSubmitting(true);
      const created = await createActivity(payload);
      setCreatedActivityTitle(created.title?.trim() || payload.title);
      setCreateSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Impossible de créer l’activité. Réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={() => !submitting && onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-live={createSuccess ? "polite" : undefined}
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200 sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-lg">
              {createSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-white" aria-hidden />
              ) : (
                <Sparkles className="h-6 w-6 text-white" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent sm:text-2xl"
              >
                {createSuccess ? "C’est enregistré !" : "Créer une activité"}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {createSuccess
                  ? "Votre activité a bien été créée."
                  : "Organisez une activité entre collègues"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onOpenChange(false)}
            className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Fermer"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {createSuccess ? (
            <div className="flex flex-col items-center justify-center gap-5 py-8 text-center sm:py-10">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-700 shadow-lg shadow-emerald-500/25"
                aria-hidden
              >
                <CheckCircle2 className="h-11 w-11 text-white" strokeWidth={2.25} />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="text-lg font-bold text-slate-900">Activité créée avec succès</p>
                <p className="text-sm leading-relaxed text-slate-600">
                  « <span className="font-semibold text-slate-800">{createdActivityTitle}</span> » a été
                  enregistrée. Vous pouvez la retrouver dans votre planning.
                </p>
              </div>
              <p className="text-xs text-slate-400">Cette fenêtre se fermera automatiquement…</p>
            </div>
          ) : null}

          {!createSuccess ? (
            <>
          {typesError ? (
            <div
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              {typesError}
            </div>
          ) : null}

          {!loadingTypes && !typesError && types.length === 0 ? (
            <div
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="status"
            >
              Aucun type d&apos;activité n&apos;est disponible. Ajoutez des types côté serveur (base de
              données) pour pouvoir créer une activité.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <section className="space-y-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 shadow-lg sm:p-5">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                  <FileText className="h-4 w-4 text-white" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900">Informations de base</h3>
              </div>

              <div>
                <label htmlFor="act-title" className={labelClass}>
                  Titre de l&apos;activité *
                </label>
                <input
                  id="act-title"
                  type="text"
                  required
                  maxLength={MAX_TITLE}
                  autoComplete="off"
                  className={inputClass}
                  placeholder="Ex : Session piscine du vendredi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="act-type" className={labelClass}>
                  Type d&apos;activité *
                </label>
                <ActivityTypeSelect
                  id="act-type"
                  types={types}
                  value={activityTypeId}
                  onChange={setActivityTypeId}
                  disabled={submitting}
                  loading={loadingTypes}
                />
              </div>

              <div>
                <label htmlFor="act-desc" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="act-desc"
                  rows={4}
                  maxLength={MAX_DESCRIPTION}
                  className={`${inputClass} resize-none`}
                  placeholder="Décrivez votre activité, le niveau requis, ce qu’il faut apporter…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 sm:p-6">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" aria-hidden />
                <h3 className="font-bold text-gray-900">Date et horaires</h3>
              </div>

              {/* Date — pleine largeur */}
              <div>
                <label htmlFor="act-date" className={labelClass}>
                  Date *
                </label>
                <ActivityDatePicker
                  id="act-date"
                  value={date}
                  onChange={setDate}
                  disabled={submitting}
                />
              </div>

              {/* Heure début et fin côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="act-start-h" className={labelClass}>
                    Heure de début *
                  </label>
                  <ActivityTimeSelect
                    idPrefix="act-start"
                    value={startTime}
                    onChange={setStartTime}
                    disabled={submitting}
                    variant="start"
                  />
                </div>
                <div>
                  <label htmlFor="act-end-h" className={labelClass}>
                    Heure de fin *
                  </label>
                  <ActivityTimeSelect
                    idPrefix="act-end"
                    value={endTime}
                    onChange={setEndTime}
                    disabled={submitting}
                    variant="end"
                  />
                </div>
              </div>
            </section>

            {/* Capacité */}
            <section className="space-y-4 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-5">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                  <Users className="h-4 w-4 text-white" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900">Capacité</h3>
              </div>
              <div>
                <label htmlFor="act-cap" className={labelClass}>
                  Nombre de places *
                </label>
                <div className="relative">
                  <Users
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400"
                    aria-hidden
                  />
                  <input
                    id="act-cap"
                    type="number"
                    required
                    min={1}
                    inputMode="numeric"
                    className={`${inputClass} pl-9`}
                    placeholder="Ex : 10"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100/40 p-4 sm:p-6">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" aria-hidden />
                <h3 className="font-bold text-gray-900">Lieu</h3>
              </div>

              <div>
                <label htmlFor="act-street" className={labelClass}>
                  Adresse (rue, n°) *
                </label>
                <input
                  id="act-street"
                  type="text"
                  required
                  maxLength={MAX_STREET}
                  autoComplete="street-address"
                  className={inputClass}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="act-complement" className={labelClass}>
                  Complément (bâtiment, salle…)
                </label>
                <input
                  id="act-complement"
                  type="text"
                  maxLength={MAX_COMPLEMENT}
                  className={inputClass}
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="act-postal" className={labelClass}>
                    Code postal *
                  </label>
                  <input
                    id="act-postal"
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    className={inputClass}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="act-city" className={labelClass}>
                    Ville *
                  </label>
                  <input
                    id="act-city"
                    type="text"
                    required
                    maxLength={MAX_CITY}
                    autoComplete="address-level2"
                    className={inputClass}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </section>

            {submitError ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={() => !submitting && onOpenChange(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || loadingTypes || types.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Création…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Créer l&apos;activité
                  </>
                )}
              </button>
            </div>
          </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
