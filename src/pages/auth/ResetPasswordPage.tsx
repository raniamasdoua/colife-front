import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { resetPassword } from "../../services/authService";
import { validatePassword } from "../../utils/passwordValidation";
import { PasswordStrengthIndicator } from "../../components/ui/PasswordStrengthIndicator";

const inputClass =
  "w-full py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 " +
  "focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-transparent " +
  "transition placeholder:text-gray-300 disabled:opacity-50";

const labelClass = "block text-xs font-semibold text-gray-600";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { isValid } = validatePassword(formData.password);
    if (!isValid) {
      setError("Le mot de passe ne respecte pas tous les critères de sécurité.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ token, newPassword: formData.password });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-violet-200/60">

        {/* Gradient header */}
        <div className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 pt-8 pb-10 px-6 text-center">
          <div className="inline-flex items-center justify-center w-13 h-13 bg-white/25 rounded-2xl mb-3 p-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mt-2 leading-tight">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-white/75 mt-1.5">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        <div className="bg-white px-6 pt-6 pb-6">
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                Lien de réinitialisation invalide ou manquant. Veuillez relancer la procédure.
              </p>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 hover:opacity-90 text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition shadow-lg shadow-violet-400/35"
              >
                <KeyRound className="w-4 h-4" />
                Recommencer
              </button>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-sm text-gray-600">
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous
                  connecter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 hover:opacity-90 text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition shadow-lg shadow-violet-400/35"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className={`${labelClass} mb-1`}>
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre nouveau mot de passe"
                    autoComplete="new-password"
                    className={`${inputClass} pl-8 pr-9`}
                    value={formData.password}
                    onChange={handleChange("password")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>
                )}
              </div>

              {/* Confirmation */}
              <div>
                <label htmlFor="confirmPassword" className={`${labelClass} mb-1`}>
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
                    autoComplete="new-password"
                    className={`${inputClass} pl-8 pr-3`}
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 hover:opacity-90 active:opacity-80 text-white py-3 px-4 rounded-xl font-semibold text-sm transition shadow-lg shadow-violet-400/35 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Réinitialiser le mot de passe
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 py-1 text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 max-w-xs">
        CoLife est une plateforme dédiée aux activités internes de votre entreprise
      </p>
    </div>
  );
}
