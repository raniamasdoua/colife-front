import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Bell,
  Shield,
  Activity,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
  LogOut,
  User,
} from "lucide-react";
import { PasswordStrengthIndicator } from "../components/ui/PasswordStrengthIndicator";
import { validatePassword } from "../utils/passwordValidation";
import { getInitials } from "../utils/userDisplay";
import { getMe, updateProfile } from "../services/userService";
import type { UserProfile } from "../types/auth";
import { PAGE_CONTAINER_CLASS } from "../layout/page";

// ── Inline Toggle (Switch) ────────────────────────────────────────────────────
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

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {message}
    </div>
  );
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

// ── ProfilePage ───────────────────────────────────────────────────────────────
export function ProfilePage() {
  const navigate = useNavigate();

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

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    activityReminders: true,
    activityUpdates: true,
  });

  // Password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
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

  // ── Fetch profile on mount ──────────────────────────────────────────────────
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

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile) return;
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
    setIsEditing(false);
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }
    const validation = validatePassword(passwordData.newPassword);
    if (!validation.isValid) {
      showToast(validation.errors[0], "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }
    showToast("Mot de passe modifié avec succès", "success");
    setShowPasswordDialog(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  // ── Delete account ──────────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      showToast("Veuillez taper SUPPRIMER pour confirmer", "error");
      return;
    }
    showToast("Votre compte a été supprimé", "success");
    setShowDeleteDialog(false);
    handleLogout();
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login", { replace: true });
  };

  // ── Render states ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement du profil…</p>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center p-6">
          <p className="text-red-500 mb-4">{loadError || "Profil introuvable"}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Activity,
      label: "Activités organisées",
      value: "—",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Users,
      label: "Activités rejointes",
      value: "—",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ── En-tête : même patron que la carte d’accueil (barre dégradée + carte blanche) ── */}
      <section className={`${PAGE_CONTAINER_CLASS} pt-4 pb-1`} aria-label="Profil">
        <div className="rounded-2xl bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80 overflow-hidden">
          <div
            className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            aria-hidden
          />
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-md"
                aria-hidden
              >
                <User className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                  Compte
                </p>
                <h1 className="mt-0.5 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Mon profil
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Gérez vos informations personnelles
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`${PAGE_CONTAINER_CLASS} py-6`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-5 shadow-lg rounded-2xl hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}
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
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder={isEditing ? "+33 6 00 00 00 00" : "Non renseigné"}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed transition"
                  />
                </div>
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
                  onClick={() => setShowPasswordDialog(true)}
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

      {/* ── Change password dialog ── */}
      <Modal
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Changer le mot de passe
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Saisissez votre mot de passe actuel et choisissez un nouveau mot de
          passe sécurisé.
        </p>

        <div className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Entrez votre mot de passe actuel"
                className="w-full px-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Créer un mot de passe sécurisé"
                className="w-full px-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordData.newPassword && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <PasswordStrengthIndicator password={passwordData.newPassword} />
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Retapez le nouveau mot de passe"
                className="w-full px-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowPasswordDialog(false);
              setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
            }}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleChangePassword}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
          >
            Modifier
          </button>
        </div>
      </Modal>

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
    </div>
  );
}
