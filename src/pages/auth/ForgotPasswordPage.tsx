import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle2, KeyRound } from "lucide-react";
import { forgotPassword } from "../../services/authService";

const inputClass =
  "w-full py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 " +
  "focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-transparent " +
  "transition placeholder:text-gray-300 disabled:opacity-50";

const labelClass = "block text-xs font-semibold text-gray-600";

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Token renvoyé par le backend tant que l'envoi d'emails n'est pas implémenté (dev only).
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword({ email });
      setDevToken(res.resetToken);
      setSubmitted(true);
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
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mt-2 leading-tight">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-white/75 mt-1.5">
            {submitted
              ? "Vérifiez vos instructions de réinitialisation"
              : "Saisissez votre email pour réinitialiser votre mot de passe"}
          </p>
        </div>

        <div className="bg-white px-6 pt-6 pb-6">
          {submitted ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-sm text-gray-600">
                  Si un compte existe pour{" "}
                  <span className="font-semibold text-gray-800">{email}</span>, un lien de
                  réinitialisation a été généré.
                </p>
              </div>

              {/* Bloc dev : tant que l'envoi d'emails n'est pas en place, on permet de continuer directement. */}
              {devToken && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                  <p className="text-xs text-amber-700">
                    Mode démo (sans email) : utilisez le lien ci-dessous pour définir un nouveau
                    mot de passe.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${encodeURIComponent(devToken)}`)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-600 hover:opacity-90 text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition shadow-lg shadow-violet-400/35"
                  >
                    <KeyRound className="w-4 h-4" />
                    Réinitialiser mon mot de passe
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
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
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le lien
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
