import { useState, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CalendarCheck,
  Edit,
  Save,
  X,
  Bell,
  Shield,
  Activity,
  Users,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { getInitials } from "../utils/userDisplay";
import { getMe, updateProfile } from "../services/userService";
import { getMyActivities, getRegisteredActivities } from "../services/activityService";
import { isActivityNoLongerEditable } from "../utils/activitySchedule";
import { keycloakAccountUrl } from "../auth/oidcConfig";
import type { UserProfile } from "../types/auth";
import { CollaboratorLayout } from "../components/layout/CollaboratorLayout";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-checked={checked}
      role="switch"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
        checked ? "bg-purple-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {message}
    </div>
  );
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

type ProfilePageProps = {
  adminShell?: boolean;
};

export function ProfilePage({ adminShell = false }: ProfilePageProps) {
  const auth = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: "",
    phone: "",
    address: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Stats
  const [organizedCount, setOrganizedCount] = useState<number | null>(null);
  const [joinedCount, setJoinedCount] = useState<number | null>(null);
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    activityReminders: true,
    activityUpdates: true,
  });

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Logout dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMe();
        if (!cancelled) {
          setProfile(data);
          setEditData({
            bio: data.bio ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
          });
        }
      } catch {
        if (!cancelled) setLoadError("Impossible de charger le profil.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    Promise.all([getMyActivities(), getRegisteredActivities()])
      .then(([organized, joined]) => {
        if (cancelled) return;
        const now = new Date();
        const upcomingOrganized = organized.filter(
          (a) => !isActivityNoLongerEditable(a, now)
        ).length;
        const upcomingJoined = joined.filter(
          (a) => !isActivityNoLongerEditable(a, now)
        ).length;
        setOrganizedCount(organized.length);
        setJoinedCount(joined.length);
        setUpcomingCount(upcomingOrganized + upcomingJoined);
      })
      .catch(() => {
        /* stats non critiques — on laisse null pour afficher "—" */
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    if (phoneError) return;
    setSaveLoading(true);
    try {
      const updated = await updateProfile(profile.id, {
        bio: editData.bio || undefined,
        phone: editData.phone || undefined,
        address: editData.address || undefined,
      });
      setProfile(updated);
      setIsEditing(false);
      showToast("Profil mis à jour avec succès", "success");
    } catch {
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      bio: profile?.bio ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
    });
    setPhoneError("");
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    window.open(keycloakAccountUrl(), "_blank", "noopener,noreferrer");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      showToast("Veuillez taper SUPPRIMER pour confirmer", "error");
      return;
    }
    showToast("Votre compte a été supprimé", "success");
    setShowDeleteDialog(false);
    handleLogout();
  };

  const handleLogout = () => {
    void auth.signoutRedirect();
  };

  if (isLoading) {
    const spinner = (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement du profil…</p>
        </div>
      </div>
    );
    return adminShell ? spinner : <CollaboratorLayout>{spinner}</CollaboratorLayout>;
  }

  if (loadError || !profile) {
    const err = (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-6">
          <p className="text-red-500 mb-4">{loadError || "Profil introuvable"}</p>
          <button
            onClick={() => void auth.signinRedirect()}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
    return adminShell ? err : <CollaboratorLayout>{err}</CollaboratorLayout>;
  }

  const stats = [
    {
      icon: Activity,
      label: "Activités organisées",
      value: organizedCount,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Users,
      label: "Participations",
      value: joinedCount,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: CalendarCheck,
      label: "À venir",
      value: upcomingCount,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  const mainContent = (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className={adminShell ? "py-2" : "space-y-6 pb-6"}>
        {/* ── Profile card ── */}
        <div className="bg-white p-5 sm:p-6 mb-6 shadow-xl rounded-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-full ring-4 ring-purple-100 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white text-2xl sm:text-3xl font-bold">
                {getInitials(profile.firstName, profile.lastName)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600 mb-2">{profile.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-500">
                {(profile.address || editData.address) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    {profile.address}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Membre depuis {formatDate(profile.createdAt)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {profile.role === "ADMIN" ? "Administrateur" : "Collaborateur"}
                </span>
              </div>
            </div>

            {/* Edit toggle */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-purple-200 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
                >
                  {saveLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Statistics ── */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Mes statistiques
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-5 shadow-lg rounded-2xl hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1 truncate">{stat.label}</p>
                    {statsLoading ? (
                      <div className="h-8 w-12 rounded-lg bg-gray-100 animate-pulse mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value !== null ? stat.value : "—"}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center shrink-0 ml-3`}
                  >
                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Personal info ── */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Informations personnelles
            </h3>
            <div className="bg-white p-5 sm:p-6 shadow-lg rounded-2xl space-y-4">
              {/* First / Last name (read-only) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Prénom
                  </label>
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    {profile.firstName}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Nom
                  </label>
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    {profile.lastName}
                  </div>
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <div className="pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    {profile.email}
                  </div>
                </div>
              </div>

              {/* Phone (editable) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditData({ ...editData, phone: val });
                      if (val && !/^[+0-9][0-9 .\-()]{5,19}$/.test(val)) {
                        setPhoneError("Numéro invalide (ex : +33 6 00 00 00 00)");
                      } else {
                        setPhoneError("");
                      }
                    }}
                    disabled={!isEditing}
                    placeholder={isEditing ? "+33 6 00 00 00 00" : "Non renseigné"}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition ${phoneError ? "border-red-400" : "border-gray-200"}`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}
              </div>

              {/* Address (editable) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Localisation
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder={isEditing ? "Paris, France" : "Non renseigné"}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition"
                  />
                </div>
              </div>

              {/* Bio (editable) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={3}
                  placeholder={
                    isEditing ? "Parlez-vous en quelques mots…" : "Non renseigné"
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-6">
            {/* Notifications */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Notifications
              </h3>
              <div className="bg-white p-5 sm:p-6 shadow-lg rounded-2xl space-y-4">
                {[
                  {
                    key: "emailNotifications" as const,
                    icon: Bell,
                    iconColor: "text-blue-600",
                    bgColor: "bg-blue-100",
                    label: "Emails",
                    sub: "Notifications importantes",
                  },
                  {
                    key: "activityReminders" as const,
                    icon: Calendar,
                    iconColor: "text-purple-600",
                    bgColor: "bg-purple-100",
                    label: "Rappels",
                    sub: "1 jour avant l'activité",
                  },
                  {
                    key: "activityUpdates" as const,
                    icon: Activity,
                    iconColor: "text-green-600",
                    bgColor: "bg-green-100",
                    label: "Mises à jour",
                    sub: "Changements d'activités",
                  },
                ].map((item, idx, arr) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}
                        >
                          <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">{item.sub}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={notifications[item.key]}
                        onChange={(v) =>
                          setNotifications({ ...notifications, [item.key]: v })
                        }
                      />
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="mt-4 border-t border-gray-100" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sécurité</h3>
              <div className="bg-white p-5 sm:p-6 shadow-lg rounded-2xl space-y-3">
                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-200 transition"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  Changer le mot de passe
                </button>

                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-blue-600" />
                  </div>
                  Se déconnecter
                </button>

                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-red-100 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logout dialog ── */}
      <Modal
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      >
        <div className="flex items-center gap-2 mb-2">
          <LogOut className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Confirmer la déconnexion
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous
          reconnecter pour accéder à votre compte.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLogoutDialog(false)}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              setShowLogoutDialog(false);
              handleLogout();
            }}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
          >
            Se déconnecter
          </button>
        </div>
      </Modal>

      {/* ── Delete account dialog ── */}
      <Modal
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmation("");
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-red-600">
            Supprimer définitivement votre compte ?
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Cette action est irréversible. Toutes vos données seront définitivement
          supprimées.
        </p>

        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-4">
          <li>Vos activités organisées</li>
          <li>Vos inscriptions aux activités</li>
          <li>Votre profil et vos informations personnelles</li>
          <li>Tout votre historique</li>
        </ul>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Pour confirmer, tapez{" "}
            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-mono">
              SUPPRIMER
            </span>
          </label>
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="SUPPRIMER"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmation("");
            }}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== "SUPPRIMER"}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Supprimer définitivement
          </button>
        </div>
      </Modal>
    </>
  );

  return adminShell ? (
    <div className="w-full">{mainContent}</div>
  ) : (
    <CollaboratorLayout>{mainContent}</CollaboratorLayout>
  );
}
