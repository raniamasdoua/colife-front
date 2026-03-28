import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, UserPlus, LogIn } from "lucide-react";
import { register } from "../../services/authService";
import { validatePassword } from "../../utils/passwordValidation";
import { PasswordStrengthIndicator } from "../../components/ui/PasswordStrengthIndicator";

const inputClass =
  "w-full py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 " +
  "focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-transparent " +
  "transition placeholder:text-gray-300 disabled:opacity-50";

const labelClass = "block text-xs font-semibold text-gray-600 mb-1";

export function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    try {
      setLoading(true);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Page background: très léger dégradé rose → bleu (quasi-blanc) */
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 py-8">

      {/* ── Card ───────────────────────────────────────────────────────── */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-violet-200/60">

        {/* ── Gradient header (haut de la carte) ────────────────────── */}
        <div className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 pt-8 pb-10 px-6 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-13 h-13 bg-white/25 rounded-2xl mb-3 p-3">
            <span className="text-white font-bold text-lg leading-none">CL</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-2 leading-tight">
            Rejoignez CoLife
          </h1>
          <p className="text-sm text-white/75 mt-1.5">
            Créez votre compte et commencez à organiser des activités
          </p>
        </div>

        {/* ── Formulaire (bas de la carte, fond blanc) ──────────────── */}
        <div className="bg-white px-6 pt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className={labelClass}>Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    autoComplete="given-name"
                    className={`${inputClass} pl-8 pr-2`}
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className={labelClass}>Nom</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  autoComplete="family-name"
                  className={`${inputClass} px-3`}
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="votre.email@entreprise.com"
                  autoComplete="email"
                  className={`${inputClass} pl-8 pr-3`}
                  value={formData.email}
                  onChange={handleChange("email")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className={labelClass}>Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Créer un mot de passe sécurisé"
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
                  <PasswordStrengthIndicator password={formData.password} compact />
                </div>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Retapez votre mot de passe"
                  autoComplete="new-password"
                  className={`${inputClass} pl-8 pr-9`}
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-violet-600 cursor-pointer shrink-0"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="terms" className="text-xs text-gray-500 leading-snug cursor-pointer select-none">
                J'accepte les{" "}
                <span className="text-violet-600 font-semibold hover:underline">
                  conditions d'utilisation
                </span>{" "}
                et la{" "}
                <span className="text-violet-600 font-semibold hover:underline">
                  politique de confidentialité
                </span>
              </label>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500">
                {error}
              </div>
            )}

            {/* Bouton soumettre */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 hover:opacity-90 active:opacity-80 text-white py-3 px-4 rounded-xl font-semibold text-sm transition shadow-lg shadow-violet-400/35 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          {/* Séparateur + Se connecter */}
          <div className="mt-5">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-gray-400 whitespace-nowrap">Vous avez déjà un compte ?</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-6 max-w-xs">
        CoLife est une plateforme dédiée aux activités internes de votre entreprise
      </p>
    </div>
  );
}
