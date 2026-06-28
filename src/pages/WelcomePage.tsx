import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import {
  Sparkles,
  CalendarDays,
  Car,
  Users,
  LogIn,
  UserPlus,
} from "lucide-react";
import { registerRedirect } from "../auth/oidcConfig";

/**
 * Page d'accueil publique (non authentifiée).
 * Présente l'appli et propose Se connecter / Créer un compte ; la redirection
 * vers Keycloak ne se fait qu'au clic (évite d'atterrir brutalement sur Keycloak).
 */
export function WelcomePage() {
  const auth = useAuth();

  // Un utilisateur déjà connecté n'a rien à faire ici.
  if (auth.isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const features = [
    {
      icon: CalendarDays,
      title: "Activités",
      desc: "Organisez et rejoignez des activités entre collègues.",
      ring: "border-blue-100 bg-blue-50/70 text-blue-600",
    },
    {
      icon: Car,
      title: "Covoiturage",
      desc: "Coordonnez vos trajets pour les activités hors-site.",
      ring: "border-purple-100 bg-purple-50/70 text-purple-600",
    },
    {
      icon: Users,
      title: "Communauté",
      desc: "Un espace réservé aux collaborateurs de l'entreprise.",
      ring: "border-pink-100 bg-pink-50/70 text-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/80 overflow-hidden">
          {/* Accent dégradé (cohérent avec le header de l'appli) */}
          <div
            className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            aria-hidden
          />

          <div className="p-7 sm:p-8">
            {/* Marque */}
            <div className="flex flex-col items-center text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-md"
                aria-hidden
              >
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                CoLife
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Coliving &amp; covoiturage, entre collègues.
              </p>
            </div>

            {/* Atouts */}
            <div className="mt-7 space-y-3">
              {features.map(({ icon: Icon, title, desc, ring }) => (
                <div key={title} className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${ring}`}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="text-xs text-slate-500 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => void auth.signinRedirect()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <LogIn className="h-4 w-4" />
                Se connecter
              </button>

              <button
                type="button"
                onClick={() => void registerRedirect()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                <UserPlus className="h-4 w-4" />
                Créer un compte
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Réservé aux adresses{" "}
              <span className="font-medium text-slate-500">@entreprise.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
