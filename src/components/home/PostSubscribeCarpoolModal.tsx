import { useEffect, useState } from "react";
import {
  Car,
  ChevronDown,
  Clock,
  Loader2,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  getActivityCarpools,
  joinCarpool,
  createCarpoolAsSubscriber,
} from "../../services/activityService";
import { ApiRequestError } from "../../services/api";
import type { ActivityResponse, CarpoolDetail, CarpoolPassengerSummary } from "../../types/activity";
import { ActivityTimeSelect } from "../activity/ActivityTimeSelect";
import { FORM_LABEL_CLASS, toBackendTime } from "../activity/activityFormUtils";

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PassengerList({ passengers }: { passengers: CarpoolPassengerSummary[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
      >
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Passagers inscrits ({passengers.length})
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-1.5">
          {passengers.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-slate-400 italic">Aucun passager pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-violet-50 rounded-lg border border-violet-100 overflow-hidden">
              {passengers.map((p) => (
                <li
                  key={p.userId}
                  className="flex items-center gap-2.5 bg-white px-3 py-2 hover:bg-violet-50/40 transition-colors"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-[10px] font-bold text-white">
                    {getInitials(p.fullName)}
                  </span>
                  <span className="text-sm font-medium text-slate-800 truncate">{p.fullName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CarpoolOption({
  carpool,
  joining,
  joined,
  onJoin,
}: {
  carpool: CarpoolDetail;
  joining: boolean;
  joined: boolean;
  onJoin: () => void;
}) {
  const canJoin = carpool.availableSeats > 0 && !joined;

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-purple-50/50 p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{carpool.driverName}</p>
          <p className="mt-0.5 text-xs text-slate-500">Conducteur</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">Places</p>
          <p className={`text-sm font-bold ${carpool.availableSeats === 0 ? "text-red-600" : "text-emerald-600"}`}>
            {carpool.availableSeats} / {carpool.maxPassengers}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center rounded-lg bg-white/80 ring-1 ring-violet-100 px-2 py-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">Départ</p>
          <p className="mt-0.5 text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
            <Clock className="h-3.5 w-3.5 text-violet-400" />
            {formatTime(carpool.departureTime)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">Passagers</p>
          <p className="mt-0.5 text-sm font-bold text-slate-800">
            {carpool.passengerCount} inscrit{carpool.passengerCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <PassengerList passengers={carpool.passengers} />

      <button
        type="button"
        disabled={!canJoin || joining}
        onClick={onJoin}
        className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
          joined
            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
            : !canJoin
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
        } disabled:opacity-60`}
      >
        {joining ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Inscription…
          </>
        ) : joined ? (
          "Covoiturage rejoint"
        ) : canJoin ? (
          <>
            <Car className="h-3.5 w-3.5" />
            Rejoindre ce covoiturage
          </>
        ) : (
          "Complet"
        )}
      </button>
    </div>
  );
}

export type PostSubscribeCarpoolModalProps = {
  open: boolean;
  activity: ActivityResponse | null;
  onComplete: () => void;
};

export function PostSubscribeCarpoolModal({
  open,
  activity,
  onComplete,
}: PostSubscribeCarpoolModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [carpools, setCarpools] = useState<CarpoolDetail[]>([]);
  const [joinedCarpoolId, setJoinedCarpoolId] = useState<number | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<"NONE" | "PASSENGER" | "DRIVER">("NONE");

  const [proposeOpen, setProposeOpen] = useState(false);
  const [departureTime, setDepartureTime] = useState("");
  const [maxPassengers, setMaxPassengers] = useState("1");
  const [proposeLoading, setProposeLoading] = useState(false);
  const [proposeError, setProposeError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !activity) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setActionError(null);
    setCarpools([]);
    setJoinedCarpoolId(null);
    setJoiningId(null);
    setUserRole("NONE");
    setProposeOpen(false);
    setDepartureTime("");
    setMaxPassengers("1");
    setProposeError(null);

    getActivityCarpools(activity.id)
      .then((data) => {
        if (cancelled) return;
        setCarpools(data.carpools);
        setUserRole(data.userRole as "NONE" | "PASSENGER" | "DRIVER");
        if (data.userRole === "PASSENGER" && data.userCarpoolId) {
          setJoinedCarpoolId(data.userCarpoolId);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof ApiRequestError ? e.message : "Impossible de charger les covoiturages."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, activity]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !activity) return null;

  const handleJoin = async (carpoolId: number) => {
    setActionError(null);
    setJoiningId(carpoolId);
    try {
      await joinCarpool(activity.id, carpoolId);
      const fresh = await getActivityCarpools(activity.id);
      setCarpools(fresh.carpools);
      setJoinedCarpoolId(carpoolId);
      setUserRole("PASSENGER");
    } catch (e) {
      setActionError(
        e instanceof ApiRequestError ? e.message : "Impossible de rejoindre ce covoiturage."
      );
    } finally {
      setJoiningId(null);
    }
  };

  const handlePropose = async () => {
    setProposeError(null);
    if (!departureTime) {
      setProposeError("L'heure de départ est obligatoire.");
      return;
    }
    const maxP = Number(maxPassengers);
    if (!Number.isFinite(maxP) || maxP < 1) {
      setProposeError("Le nombre de places doit être ≥ 1.");
      return;
    }
    const depTime = toBackendTime(departureTime);
    const actStart = activity.startTime ? toBackendTime(activity.startTime.slice(0, 5)) : null;
    if (actStart && depTime >= actStart) {
      setProposeError("L'heure de départ doit être avant le début de l'activité.");
      return;
    }
    setProposeLoading(true);
    try {
      await createCarpoolAsSubscriber(activity.id, { departureTime: depTime, maxPassengers: maxP });
      const fresh = await getActivityCarpools(activity.id);
      setCarpools(fresh.carpools);
      setUserRole("DRIVER");
      setProposeOpen(false);
    } catch (e) {
      setProposeError(
        e instanceof ApiRequestError ? e.message : "Impossible de proposer le covoiturage."
      );
    } finally {
      setProposeLoading(false);
    }
  };

  const joinableCarpools = carpools.filter((c) => c.availableSeats > 0);
  const isDone = userRole === "PASSENGER" || userRole === "DRIVER";

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-subscribe-carpool-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onComplete}
      />

      <div className="relative z-10 w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-600 to-pink-500 shrink-0 rounded-t-3xl sm:rounded-t-2xl" />

        <div className="p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                <Car className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="post-subscribe-carpool-title" className="font-bold text-slate-900 text-base leading-snug">
                  Covoiturage
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{activity.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {userRole === "DRIVER"
              ? "Votre covoiturage a été proposé."
              : userRole === "PASSENGER"
                ? "Vous avez rejoint un covoiturage."
                : "Vous êtes inscrit à cette activité hors site. Rejoignez un covoiturage, proposez le vôtre ou continuez sans."}
          </p>
        </div>

        <div className="p-5 space-y-3 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des propositions…
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">{error}</p>
          )}

          {actionError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100" role="alert">
              {actionError}
            </p>
          )}

          {!loading && !error && carpools.length === 0 && userRole === "NONE" && (
            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-6 text-center">
              <Car className="mx-auto h-8 w-8 text-violet-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Aucune proposition pour l&apos;instant</p>
              <p className="mt-1 text-xs text-slate-500">
                Soyez le premier à proposer un covoiturage ci-dessous.
              </p>
            </div>
          )}

          {!loading && !error && carpools.length > 0 && joinableCarpools.length === 0 && userRole === "NONE" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-amber-800">Tous les covoiturages sont complets</p>
              <p className="mt-1 text-xs text-amber-700/90">
                Vous pouvez proposer le vôtre ci-dessous.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            carpools.map((c) => (
              <CarpoolOption
                key={c.id}
                carpool={c}
                joining={joiningId === c.id}
                joined={joinedCarpoolId === c.id}
                onJoin={() => handleJoin(c.id)}
              />
            ))}

          {/* Section Proposer un covoiturage */}
          {!loading && !error && userRole === "NONE" && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-purple-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => { setProposeOpen((v) => !v); setProposeError(null); }}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100/50 transition"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Proposer un covoiturage
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${proposeOpen ? "rotate-180" : ""}`} />
              </button>

              {proposeOpen && (
                <div className="border-t border-violet-100 px-4 pb-4 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={FORM_LABEL_CLASS}>Heure de départ *</p>
                      <ActivityTimeSelect
                        idPrefix="propose-departure"
                        value={departureTime}
                        onChange={setDepartureTime}
                        disabled={proposeLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="propose-seats" className={FORM_LABEL_CLASS}>
                        Places passagers *
                      </label>
                      <input
                        id="propose-seats"
                        type="number"
                        min={1}
                        value={maxPassengers}
                        onChange={(e) => setMaxPassengers(e.target.value)}
                        disabled={proposeLoading}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {proposeError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                      {proposeError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={proposeLoading}
                    onClick={handlePropose}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105 transition disabled:opacity-60"
                  >
                    {proposeLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi…
                      </>
                    ) : (
                      <>
                        <Car className="h-4 w-4" />
                        Proposer ce covoiturage
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onComplete}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
          >
            {isDone ? "Terminer" : "Continuer sans covoiturage"}
          </button>
        </div>
      </div>
    </div>
  );
}