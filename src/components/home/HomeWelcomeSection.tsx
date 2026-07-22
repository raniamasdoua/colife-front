import { Sparkles, Star, Flame, TrendingUp } from "lucide-react";

type HomeWelcomeSectionProps = {
  firstName: string;
  organizedCount: number;
  registeredCount: number;
  availableCount: number;
};

export function HomeWelcomeSection({
  firstName,
  organizedCount,
  registeredCount,
  availableCount,
}: HomeWelcomeSectionProps) {
  return (
    <section aria-label="Accueil">
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
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Hey {firstName} ! <span aria-hidden>👋</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Prêt pour de nouvelles aventures ?
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/90 to-white px-2 py-3 sm:px-3 sm:py-4 text-center transition hover:border-blue-200 hover:shadow-sm">
              <Star className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-amber-500" aria-hidden />
              <p className="mt-1.5 text-lg sm:text-2xl font-bold tabular-nums text-slate-900">
                {organizedCount}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-600 leading-snug">
                J&apos;organise
              </p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-gradient-to-b from-purple-50/90 to-white px-2 py-3 sm:px-3 sm:py-4 text-center transition hover:border-purple-200 hover:shadow-sm">
              <Flame className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-orange-500" aria-hidden />
              <p className="mt-1.5 text-lg sm:text-2xl font-bold tabular-nums text-slate-900">
                {registeredCount}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-600 leading-snug">
                Inscrit
              </p>
            </div>
            <div className="rounded-xl border border-pink-100 bg-gradient-to-b from-pink-50/90 to-white px-2 py-3 sm:px-3 sm:py-4 text-center transition hover:border-pink-200 hover:shadow-sm">
              <TrendingUp className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" aria-hidden />
              <p className="mt-1.5 text-lg sm:text-2xl font-bold tabular-nums text-slate-900">
                {availableCount}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-600 leading-snug">
                Disponibles
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

