import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { login } from "../../services/authService";

const inputClass =
  "w-full py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 " +
  "focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-transparent " +
  "transition placeholder:text-gray-300 disabled:opacity-50";

const labelClass = "block text-xs font-semibold text-gray-600";

export function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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

    if (!formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setLoading(true);
      await login({ email: formData.email, password: formData.password });
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 py-8">

      {/* ── Card ───────────────────────────────────────────────────────── */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-violet-200/60">

        {/* ── Gradient header ────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 pt-8 pb-10 px-6 text-center">
          <div className="inline-flex items-center justify-center w-13 h-13 bg-white/25 rounded-2xl mb-3 p-3">
            <span className="text-white font-bold text-lg leading-none">CL</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-2 leading-tight">
            Bienvenue sur CoLife
          </h1>
          <p className="text-sm text-white/75 mt-1.5">
            Connectez-vous pour accéder à vos activités
          </p>
        </div>

        {/* ── Formulaire ─────────────────────────────────────────────── */}
        <div className="bg-white px-6 pt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label htmlFor="email" className={`${labelClass} mb-1`}>
                Email professionnel
              </label>
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className={labelClass}>
                  Mot de passe
                </label>
                <button
                  type="button"
                  className="text-xs text-violet-600 font-semibold hover:underline"
                  tabIndex={-1}
                  onClick={() => navigate("/forgot-password")}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
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
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500">
                {error}
              </div>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 hover:opacity-90 active:opacity-80 text-white py-3 px-4 rounded-xl font-semibold text-sm transition shadow-lg shadow-violet-400/35 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Séparateur + Créer un compte */}
          <div className="mt-5">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-gray-400 whitespace-nowrap">Nouveau sur CoLife ?</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => navigate("/register")}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Créer un compte
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
