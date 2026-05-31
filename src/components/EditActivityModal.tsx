import { useEffect, useId, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  FileText,
  MapPin,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  updateActivity,
  getActivityTypes,
  getActivityCarpools,
  createCarpoolAsSubscriber,
  updateCarpool,
  cancelCarpoolByDriver,
} from "../services/activityService";
import { ApiRequestError } from "../services/api";
import type {
  ActivityCarpoolsResponse,
  ActivityResponse,
  ActivityTypeOption,
  CarpoolDetail,
  LocationType,
} from "../types/activity";
import { ActivityDatePicker } from "./activity/ActivityDatePicker";
import { ActivityTimeSelect } from "./activity/ActivityTimeSelect";
import { ActivityTypeSelect } from "./activity/ActivityTypeSelect";

/* ── Constantes ─────────────────────────────────────────────────────────────── */

const inputClass =
  "w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent " +
  "disabled:opacity-50 disabled:bg-gray-50";

const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_STREET = 255;
const MAX_COMPLEMENT = 255;
const MAX_CITY = 120;
const MAX_ROOM = 255;

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function todayIso(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
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

function toPickerTime(value: string): string {
  return value ? value.slice(0, 5) : "";
}

/* ── Props ───────────────────────────────────────────────────────────────────── */

export interface EditActivityModalProps {
  activity: ActivityResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: ActivityResponse) => void;
  /** Mode admin : affichage lecture seule des covoiturages (pas d'actions conducteur) */
  readOnlyCarpool?: boolean;
}

/* ── Composant ───────────────────────────────────────────────────────────────── */

export function EditActivityModal({
  activity,
  open,
  onOpenChange,
  onSuccess,
  readOnlyCarpool = false,
}: EditActivityModalProps) {
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

  const [locationType, setLocationType] = useState<LocationType>("OFF_SITE");
  const [room, setRoom] = useState("");
  const [street, setStreet] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  /* ── État covoiturage ─────────────────────────────────────────────────── */
  const [carpoolData, setCarpoolData] = useState<ActivityCarpoolsResponse | null>(null);
  const [carpoolLoading, setCarpoolLoading] = useState(false);
  // Proposition (NONE → créer)
  const [carpoolProposeEnabled, setCarpoolProposeEnabled] = useState(false);
  const [carpoolNewDeparture, setCarpoolNewDeparture] = useState("");
  const [carpoolNewMax, setCarpoolNewMax] = useState("1");
  const [carpoolProposeLoading, setCarpoolProposeLoading] = useState(false);
  const [carpoolProposeError, setCarpoolProposeError] = useState<string | null>(null);
  // Modification (DRIVER → éditer)
  const [carpoolEditing, setCarpoolEditing] = useState(false);
  const [carpoolEditDeparture, setCarpoolEditDeparture] = useState("");
  const [carpoolEditMax, setCarpoolEditMax] = useState("1");
  const [carpoolEditLoading, setCarpoolEditLoading] = useState(false);
  const [carpoolEditError, setCarpoolEditError] = useState<string | null>(null);
  // Annulation (DRIVER → annuler)
  const [carpoolCancelLoading, setCarpoolCancelLoading] = useState(false);
  const [carpoolCancelError, setCarpoolCancelError] = useState<string | null>(null);
  const [carpoolReadOnlyError, setCarpoolReadOnlyError] = useState<string | null>(null);

  /* ── Formulaire principal ─────────────────────────────────────────────── */
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState("");

  const minDate = useMemo(() => todayIso(), []);

  /* Pré-remplissage quand la modale s'ouvre */
  useEffect(() => {
    if (!open || !activity) return;
    setTitle(activity.title);
    setActivityTypeId(String(activity.activityType.id));
    setDescription(activity.description ?? "");
    setDate(activity.date);
    setStartTime(toPickerTime(activity.startTime));
    setEndTime(toPickerTime(activity.endTime));
    setCapacity(String(activity.capacity));
    setLocationType(activity.locationType ?? "OFF_SITE");
    setRoom(activity.location.room ?? "");
    setStreet(activity.location.street ?? "");
    setComplement(activity.location.complement ?? "");
    setPostalCode(activity.location.postalCode ?? "");
    setCity(activity.location.city ?? "");
    setSubmitError(null);
    setUpdateSuccess(false);
    setUpdatedTitle("");
    // Reset carpool state
    setCarpoolData(null);
    setCarpoolProposeEnabled(false);
    setCarpoolNewDeparture("");
    setCarpoolNewMax("1");
    setCarpoolProposeError(null);
    setCarpoolEditing(false);
    setCarpoolEditDeparture("");
    setCarpoolEditMax("1");
    setCarpoolEditError(null);
    setCarpoolCancelError(null);
    setCarpoolReadOnlyError(null);
  }, [open, activity]);

  /* Chargement des covoiturages (activités hors-site uniquement) */
  useEffect(() => {
    if (!open || !activity || (activity.locationType ?? "OFF_SITE") === "ON_SITE") return;
    let cancelled = false;
    setCarpoolLoading(true);
    (async () => {
      try {
        const data = await getActivityCarpools(activity.id);
        if (!cancelled) {
          setCarpoolData(data);
          if (readOnlyCarpool) setCarpoolReadOnlyError(null);
          // Pré-remplir le formulaire d'édition si déjà conducteur
          const myCarpool = data.userRole === "DRIVER"
            ? data.carpools.find((c: CarpoolDetail) => c.id === data.userCarpoolId)
            : null;
          if (myCarpool) {
            setCarpoolEditDeparture(myCarpool.departureTime.slice(0, 5));
            setCarpoolEditMax(String(myCarpool.maxPassengers));
          }
        }
      } catch (e) {
        if (!cancelled && readOnlyCarpool) {
          setCarpoolReadOnlyError(
            e instanceof ApiRequestError ? e.message : "Impossible de charger les covoiturages."
          );
        }
      } finally {
        if (!cancelled) setCarpoolLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, activity, readOnlyCarpool]);

  /* Chargement des types */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingTypes(true);
    setTypesError(null);
    (async () => {
      try {
        const list = await getActivityTypes();
        if (!cancelled) setTypes(list);
      } catch (e) {
        if (!cancelled)
          setTypesError(
            e instanceof ApiRequestError
              ? e.message
              : "Impossible de charger les types d'activité."
          );
      } finally {
        if (!cancelled) setLoadingTypes(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  /* Bloquer le scroll */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Fermeture au clavier */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onOpenChange]);

  /* Auto-fermeture après succès */
  useEffect(() => {
    if (!updateSuccess) return;
    const t = window.setTimeout(() => onOpenChange(false), 2800);
    return () => window.clearTimeout(t);
  }, [updateSuccess, onOpenChange]);

  /* Indique si un changement vers "Sur site" annulera des covoiturages existants */
  const hasCarpools = !!activity?.carpool;
  const willCancelCarpools =
    locationType === "ON_SITE" &&
    (activity?.locationType ?? "OFF_SITE") === "OFF_SITE" &&
    hasCarpools;

  /* Validation côté client */
  const validateClient = (): string | null => {
    if (!title.trim()) return "Le titre est obligatoire.";
    if (!activityTypeId) return "Le type d'activité est obligatoire.";
    if (!date) return "La date est obligatoire.";
    if (!startTime || !endTime) return "Les heures de début et de fin sont obligatoires.";
    if (!capacity.trim()) return "La capacité est obligatoire.";
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) return "La capacité doit être un nombre positif.";

    if (locationType === "ON_SITE") {
      if (!room.trim()) return "La salle est obligatoire pour une activité sur site.";
    } else {
      if (!street.trim()) return "L'adresse (rue) est obligatoire.";
      if (!postalCode.trim()) return "Le code postal est obligatoire.";
      if (!/^\d{5}$/.test(postalCode.trim())) return "Le code postal doit contenir 5 chiffres.";
      if (!city.trim()) return "La ville est obligatoire.";
    }

    const start = toBackendTime(startTime);
    const end = toBackendTime(endTime);
    if (start >= end) return "L'heure de fin doit être après l'heure de début.";
    if (date < minDate) return "La date ne peut pas être dans le passé.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const err = validateClient();
    if (err) { setSubmitError(err); return; }
    if (!activity) return;

    const cap = Number(capacity);
    const desc = description.trim();

    const locationPayload =
      locationType === "ON_SITE"
        ? { room: room.trim() }
        : {
            street: street.trim(),
            complement: complement.trim() || null,
            postalCode: postalCode.trim(),
            city: city.trim(),
          };

    const payload = {
      title: title.trim(),
      description: desc.length > 0 ? desc : null,
      activityTypeId: Number(activityTypeId),
      date,
      startTime: toBackendTime(startTime),
      endTime: toBackendTime(endTime),
      capacity: cap,
      locationType,
      location: locationPayload,
    };

    try {
      setSubmitting(true);
      const updated = await updateActivity(activity.id, payload);
      setUpdatedTitle(updated.title?.trim() || payload.title);
      setUpdateSuccess(true);
      onSuccess(updated);
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "Impossible de modifier l'activité. Réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !activity) return null;

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
        aria-live={updateSuccess ? "polite" : undefined}
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200 sm:rounded-3xl"
      >
        {/* En-tête */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-600 shadow-lg">
              {updateSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-white" aria-hidden />
              ) : (
                <Pencil className="h-6 w-6 text-white" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent sm:text-2xl"
              >
                {updateSuccess ? "Modifications enregistrées !" : "Modifier l'activité"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                {updateSuccess ? "Vos participants ont bien été notifiés." : activity.title}
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

        {/* Corps */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">

          {/* Écran succès */}
          {updateSuccess && (
            <div className="flex flex-col items-center justify-center gap-5 py-8 text-center sm:py-10">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-violet-600 shadow-lg shadow-purple-500/25"
                aria-hidden
              >
                <CheckCircle2 className="h-11 w-11 text-white" strokeWidth={2.25} />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="text-lg font-bold text-slate-900">Activité mise à jour</p>
                <p className="text-sm leading-relaxed text-slate-600">
                  «{" "}
                  <span className="font-semibold text-slate-800">{updatedTitle}</span>{" "}
                  » a bien été modifiée. Retrouvez-la dans votre planning.
                </p>
              </div>
              <p className="text-xs text-slate-400">Cette fenêtre se fermera automatiquement…</p>
            </div>
          )}

          {/* Formulaire */}
          {!updateSuccess && (
            <>
              {typesError && (
                <div
                  className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                  role="alert"
                >
                  {typesError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* Informations de base */}
                <section className="space-y-4 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 p-4 shadow-lg sm:p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                      <FileText className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <h3 className="font-bold text-gray-900">Informations de base</h3>
                  </div>

                  <div>
                    <label htmlFor="edit-title" className={labelClass}>
                      Titre de l&apos;activité *
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      required
                      maxLength={MAX_TITLE}
                      autoComplete="off"
                      className={inputClass}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-type" className={labelClass}>
                      Type d&apos;activité *
                    </label>
                    <ActivityTypeSelect
                      id="edit-type"
                      types={types}
                      value={activityTypeId}
                      onChange={setActivityTypeId}
                      disabled={submitting}
                      loading={loadingTypes}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-desc" className={labelClass}>
                      Description
                    </label>
                    <textarea
                      id="edit-desc"
                      rows={4}
                      maxLength={MAX_DESCRIPTION}
                      className={`${inputClass} resize-none`}
                      placeholder="Décrivez votre activité, le niveau requis, ce qu'il faut apporter…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </section>

                {/* Date et horaires */}
                <section className="space-y-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 sm:p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" aria-hidden />
                    <h3 className="font-bold text-gray-900">Date et horaires</h3>
                  </div>

                  <div>
                    <label htmlFor="edit-date" className={labelClass}>Date *</label>
                    <ActivityDatePicker id="edit-date" value={date} onChange={setDate} disabled={submitting} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="edit-start-h" className={labelClass}>Heure de début *</label>
                      <ActivityTimeSelect idPrefix="edit-start" value={startTime} onChange={setStartTime} disabled={submitting} variant="start" />
                    </div>
                    <div>
                      <label htmlFor="edit-end-h" className={labelClass}>Heure de fin *</label>
                      <ActivityTimeSelect idPrefix="edit-end" value={endTime} onChange={setEndTime} disabled={submitting} variant="end" />
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

                  {activity.participantCount > 0 && (
                    <p className="text-xs text-orange-700 bg-orange-100 rounded-lg px-3 py-2">
                      ℹ️ {activity.participantCount} participant
                      {activity.participantCount > 1 ? "s" : ""} déjà inscrits — la capacité ne peut pas descendre en dessous.
                    </p>
                  )}

                  <div>
                    <label htmlFor="edit-cap" className={labelClass}>Nombre de places *</label>
                    <div className="relative">
                      <Users
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400"
                        aria-hidden
                      />
                      <input
                        id="edit-cap"
                        type="number"
                        required
                        min={activity.participantCount || 1}
                        inputMode="numeric"
                        className={`${inputClass} pl-9`}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </section>

                {/* Lieu */}
                <section className="space-y-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100/40 p-4 sm:p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600" aria-hidden />
                    <h3 className="font-bold text-gray-900">Lieu</h3>
                  </div>

                  {/* Toggle Sur site / Hors site */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationType("OFF_SITE")}
                      disabled={submitting}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-semibold transition ${
                        locationType === "OFF_SITE"
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Hors site
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType("ON_SITE")}
                      disabled={submitting}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-semibold transition ${
                        locationType === "ON_SITE"
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Sur site
                    </button>
                  </div>

                  {/* Avertissement annulation covoiturages */}
                  {willCancelCarpools && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800" role="alert">
                      ⚠️ En passant l&apos;activité en &laquo;&nbsp;Sur site&nbsp;&raquo;, tous les covoiturages actifs seront
                      automatiquement annulés et leurs passagers libérés.
                    </div>
                  )}

                  {/* Champ Salle (sur site) */}
                  {locationType === "ON_SITE" && (
                    <div>
                      <label htmlFor="edit-room" className={labelClass}>Salle *</label>
                      <input
                        id="edit-room"
                        type="text"
                        required
                        maxLength={MAX_ROOM}
                        autoComplete="off"
                        className={inputClass}
                        placeholder="Ex : Salle A12, Gymnase Nord…"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  )}

                  {/* Champs Adresse (hors site) */}
                  {locationType === "OFF_SITE" && (
                    <>
                      <div>
                        <label htmlFor="edit-street" className={labelClass}>Adresse (rue, n°) *</label>
                        <input
                          id="edit-street"
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
                        <label htmlFor="edit-complement" className={labelClass}>
                          Complément (bâtiment, étage…)
                        </label>
                        <input
                          id="edit-complement"
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
                          <label htmlFor="edit-postal" className={labelClass}>Code postal *</label>
                          <input
                            id="edit-postal"
                            type="text"
                            required
                            inputMode="numeric"
                            maxLength={5}
                            autoComplete="postal-code"
                            className={inputClass}
                            value={postalCode}
                            onChange={(e) =>
                              setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                            }
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-city" className={labelClass}>Ville *</label>
                          <input
                            id="edit-city"
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
                    </>
                  )}
                </section>

                {/* ── Covoiturage (hors site uniquement) ── */}
                {locationType === "OFF_SITE" && !updateSuccess && (
                  <section className="space-y-4 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 sm:p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                        <Car className="h-4 w-4 text-white" aria-hidden />
                      </div>
                      <h3 className="font-bold text-gray-900">Covoiturage</h3>
                    </div>

                    {carpoolLoading && (
                      <div className="flex items-center gap-2 text-xs text-violet-600">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                        Chargement…
                      </div>
                    )}

                    {readOnlyCarpool ? (
                      <>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Vue administrateur : les covoiturages sont gérés par les collaborateurs inscrits.
                        </p>
                        {carpoolReadOnlyError && (
                          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{carpoolReadOnlyError}</p>
                        )}
                        {!carpoolLoading && !carpoolReadOnlyError && (!carpoolData || carpoolData.carpools.length === 0) && (
                          <p className="text-xs text-slate-400 italic">Aucune proposition de covoiturage.</p>
                        )}
                        {!carpoolLoading && !carpoolReadOnlyError && carpoolData && carpoolData.carpools.length > 0 && (
                          <div className="space-y-2">
                            {carpoolData.carpools.map((c: CarpoolDetail) => (
                              <div key={c.id} className="rounded-xl bg-white/70 p-3 ring-1 ring-violet-100 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{c.driverName}</p>
                                    <p className="text-xs text-slate-500">
                                      Départ {c.departureTime.slice(0, 5)} · {c.passengerCount}/{c.maxPassengers} passagers
                                    </p>
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    c.availableSeats === 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    {c.availableSeats === 0 ? "Complet" : `${c.availableSeats} dispo`}
                                  </span>
                                </div>
                                {c.passengers.length > 0 && (
                                  <p className="text-[11px] text-slate-500">
                                    Passagers : {c.passengers.map((p) => p.fullName).join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {willCancelCarpools && (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Passer l&apos;activité en « Sur site » annulera les covoiturages existants.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                    {/* ── Conducteur : afficher + modifier / annuler ── */}
                    {!carpoolLoading && carpoolData?.userRole === "DRIVER" && (() => {
                      const myCarpool = carpoolData.carpools.find(
                        (c: CarpoolDetail) => c.id === carpoolData.userCarpoolId
                      );
                      if (!myCarpool) return null;
                      return (
                        <div className="space-y-3">
                          {/* Résumé actuel */}
                          <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/70 p-3 ring-1 ring-violet-100">
                            <div className="text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">Départ</p>
                              <p className="mt-0.5 text-sm font-bold text-slate-800">
                                {myCarpool.departureTime.slice(0, 5)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">Places</p>
                              <p className="mt-0.5 text-sm font-bold text-slate-800">{myCarpool.maxPassengers}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">Passagers</p>
                              <p className="mt-0.5 text-sm font-bold text-slate-800">{myCarpool.passengerCount}</p>
                            </div>
                          </div>

                          {/* Boutons Modifier / Annuler */}
                          {!carpoolEditing && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { setCarpoolEditing(true); setCarpoolEditError(null); }}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-violet-300 bg-white py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                disabled={carpoolCancelLoading || submitting}
                                onClick={async () => {
                                  setCarpoolCancelError(null);
                                  setCarpoolCancelLoading(true);
                                  try {
                                    await cancelCarpoolByDriver(activity!.id, myCarpool.id);
                                    const fresh = await getActivityCarpools(activity!.id);
                                    setCarpoolData(fresh);
                                    setCarpoolEditing(false);
                                  } catch (e) {
                                    setCarpoolCancelError(
                                      e instanceof ApiRequestError ? e.message : "Impossible d'annuler le covoiturage."
                                    );
                                  } finally {
                                    setCarpoolCancelLoading(false);
                                  }
                                }}
                                className="flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {carpoolCancelLoading ? (
                                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Annuler
                              </button>
                            </div>
                          )}

                          {/* Erreur annulation */}
                          {carpoolCancelError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{carpoolCancelError}</p>
                          )}

                          {/* Formulaire de modification inline */}
                          {carpoolEditing && (
                            <div className="space-y-3 rounded-xl bg-white/80 p-3 ring-1 ring-violet-200">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className={labelClass}>Heure de départ *</label>
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={carpoolEditDeparture}
                                    onChange={(e) => setCarpoolEditDeparture(e.target.value)}
                                    disabled={carpoolEditLoading}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>Places passagers *</label>
                                  <input
                                    type="number"
                                    min={myCarpool.passengerCount || 1}
                                    className={inputClass}
                                    value={carpoolEditMax}
                                    onChange={(e) => setCarpoolEditMax(e.target.value)}
                                    disabled={carpoolEditLoading}
                                  />
                                </div>
                              </div>

                              {carpoolEditError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{carpoolEditError}</p>
                              )}

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setCarpoolEditing(false); setCarpoolEditError(null); }}
                                  disabled={carpoolEditLoading}
                                  className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  disabled={carpoolEditLoading}
                                  onClick={async () => {
                                    setCarpoolEditError(null);
                                    if (!carpoolEditDeparture) {
                                      setCarpoolEditError("L'heure de départ est obligatoire.");
                                      return;
                                    }
                                    const maxP = Number(carpoolEditMax);
                                    if (!Number.isFinite(maxP) || maxP < 1) {
                                      setCarpoolEditError("Le nombre de places doit être ≥ 1.");
                                      return;
                                    }
                                    const depTime = toBackendTime(carpoolEditDeparture);
                                    const actStart = toBackendTime(startTime);
                                    if (actStart && depTime >= actStart) {
                                      setCarpoolEditError("L'heure de départ doit être avant le début de l'activité.");
                                      return;
                                    }
                                    setCarpoolEditLoading(true);
                                    try {
                                      await updateCarpool(activity!.id, myCarpool.id, {
                                        departureTime: depTime,
                                        maxPassengers: maxP,
                                      });
                                      const fresh = await getActivityCarpools(activity!.id);
                                      setCarpoolData(fresh);
                                      const updated = fresh.carpools.find((c: CarpoolDetail) => c.id === myCarpool.id);
                                      if (updated) {
                                        setCarpoolEditDeparture(updated.departureTime.slice(0, 5));
                                        setCarpoolEditMax(String(updated.maxPassengers));
                                      }
                                      setCarpoolEditing(false);
                                    } catch (e) {
                                      setCarpoolEditError(
                                        e instanceof ApiRequestError ? e.message : "Impossible de modifier le covoiturage."
                                      );
                                    } finally {
                                      setCarpoolEditLoading(false);
                                    }
                                  }}
                                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  {carpoolEditLoading ? (
                                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : (
                                    <Pencil className="h-3 w-3" />
                                  )}
                                  Enregistrer
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── Aucun covoiturage : proposer ── */}
                    {!carpoolLoading && carpoolData?.userRole === "NONE" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Proposer un covoiturage</span>
                          <button
                            type="button"
                            onClick={() => { setCarpoolProposeEnabled((v) => !v); setCarpoolProposeError(null); }}
                            disabled={submitting}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              carpoolProposeEnabled ? "bg-violet-600" : "bg-gray-200"
                            }`}
                            role="switch"
                            aria-checked={carpoolProposeEnabled}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                carpoolProposeEnabled ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {carpoolProposeEnabled && (
                          <div className="space-y-3 rounded-xl bg-white/80 p-3 ring-1 ring-violet-200">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Heure de départ *</label>
                                <input
                                  type="time"
                                  className={inputClass}
                                  value={carpoolNewDeparture}
                                  onChange={(e) => setCarpoolNewDeparture(e.target.value)}
                                  disabled={carpoolProposeLoading}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Places passagers *</label>
                                <input
                                  type="number"
                                  min={1}
                                  className={inputClass}
                                  value={carpoolNewMax}
                                  onChange={(e) => setCarpoolNewMax(e.target.value)}
                                  disabled={carpoolProposeLoading}
                                />
                              </div>
                            </div>

                            {carpoolProposeError && (
                              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{carpoolProposeError}</p>
                            )}

                            <button
                              type="button"
                              disabled={carpoolProposeLoading}
                              onClick={async () => {
                                setCarpoolProposeError(null);
                                if (!carpoolNewDeparture) {
                                  setCarpoolProposeError("L'heure de départ est obligatoire.");
                                  return;
                                }
                                const maxP = Number(carpoolNewMax);
                                if (!Number.isFinite(maxP) || maxP < 1) {
                                  setCarpoolProposeError("Le nombre de places doit être ≥ 1.");
                                  return;
                                }
                                const depTime = toBackendTime(carpoolNewDeparture);
                                const actStart = toBackendTime(startTime);
                                if (actStart && depTime >= actStart) {
                                  setCarpoolProposeError("L'heure de départ doit être avant le début de l'activité.");
                                  return;
                                }
                                setCarpoolProposeLoading(true);
                                try {
                                  await createCarpoolAsSubscriber(activity!.id, {
                                    departureTime: depTime,
                                    maxPassengers: maxP,
                                  });
                                  const fresh = await getActivityCarpools(activity!.id);
                                  setCarpoolData(fresh);
                                  const mine = fresh.carpools.find((c: CarpoolDetail) => c.id === fresh.userCarpoolId);
                                  if (mine) {
                                    setCarpoolEditDeparture(mine.departureTime.slice(0, 5));
                                    setCarpoolEditMax(String(mine.maxPassengers));
                                  }
                                  setCarpoolProposeEnabled(false);
                                  setCarpoolNewDeparture("");
                                  setCarpoolNewMax("1");
                                } catch (e) {
                                  setCarpoolProposeError(
                                    e instanceof ApiRequestError ? e.message : "Impossible de proposer le covoiturage."
                                  );
                                } finally {
                                  setCarpoolProposeLoading(false);
                                }
                              }}
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {carpoolProposeLoading ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Car className="h-4 w-4" />
                              )}
                              Proposer ce covoiturage
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                      </>
                    )}
                  </section>
                )}

                {/* Erreur */}
                {submitError && (
                  <div
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    role="alert"
                  >
                    {submitError}
                  </div>
                )}

                {/* Actions */}
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
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Enregistrement…
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
