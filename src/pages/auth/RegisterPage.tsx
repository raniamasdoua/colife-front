import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, UserPlus, LogIn } from "lucide-react";
import { register } from "../../services/authService";
import { validatePassword } from "../../utils/passwordValidation";
import { PasswordStrengthIndicator } from "../../components/ui/PasswordStrengthIndicator";

const inputBase =
  "w-full py-2.5 border border-gray-200 rounded-lg text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent " +
  "transition placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50";

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

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-xl font-bold tracking-wide">CL</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Rejoignez CoLife</h1>
          <p className="text-sm text-gray-500">
            Créez votre compte et commencez à organiser des activités
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    autoComplete="given-name"
                    className={`${inputBase} pl-9 pr-3`}
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  autoComplete="family-name"
                  className={`${inputBase} px-3`}
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email professionnel <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="votre.email@entreprise.com"
                  autoComplete="email"
                  className={`${inputBase} pl-9 pr-3`}
                  value={formData.email}
                  onChange={handleChange("email")}
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Format requis : @entreprise.com</p>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Créer un mot de passe sécurisé"
                  autoComplete="new-password"
                  className={`${inputBase} pl-9 pr-10`}
                  value={formData.password}
                  onChange={handleChange("password")}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Retapez votre mot de passe"
                  autoComplete="new-password"
                  className={`${inputBase} pl-9 pr-10`}
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer shrink-0"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm text-gray-500 leading-snug cursor-pointer select-none">
                J'accepte les{" "}
                <span className="text-purple-600 hover:underline cursor-pointer font-medium">
                  conditions d'utilisation
                </span>{" "}
                et la{" "}
                <span className="text-purple-600 hover:underline cursor-pointer font-medium">
                  politique de confidentialité
                </span>
              </label>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Bouton soumettre */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
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

          {/* Séparateur + lien connexion */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-gray-400 whitespace-nowrap">Vous avez déjà un compte ?</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => navigate("/login")}
              className="w-full mt-4 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          CoLife est une plateforme dédiée aux activités internes de votre entreprise
        </p>
      </div>
    </div>
  );
}
