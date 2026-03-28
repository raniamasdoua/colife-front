import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, CalendarDays, User, Bell, PlusCircle } from "lucide-react";
import { getMe } from "../../services/userService";
import { getInitials } from "../../utils/userDisplay";
import { useCreateActivityModal } from "../../context/CreateActivityModalContext";

const tabs = [
  { to: "/home", icon: Home, label: "Accueil" },
  { to: "/planning", icon: CalendarDays, label: "Planning" },
  { to: "/profile", icon: User, label: "Profil" },
];

export function Navigation() {
  const navigate = useNavigate();
  const { openCreate, isCreateModalOpen } = useCreateActivityModal();
  const [avatarLabel, setAvatarLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          setAvatarLabel(getInitials(me.firstName, me.lastName));
        }
      } catch {
        if (!cancelled) setAvatarLabel("?");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => navigate("/home")}
            className="text-white text-xl font-bold tracking-tight hover:opacity-90 transition"
          >
            CoLife
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Créer une activité"
              onClick={openCreate}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                isCreateModalOpen
                  ? "bg-white text-purple-700 ring-white shadow-md"
                  : "bg-white/20 ring-white/40 hover:bg-white/30"
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Créer</span>
            </button>
            {/* Notifications (placeholder) */}
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Initiales : style fixe sur toutes les pages (la page active est dans la barre du bas) */}
            <NavLink
              to="/profile"
              title="Mon profil"
              className="min-w-9 h-9 px-1 rounded-full flex items-center justify-center font-bold text-xs tabular-nums border-2 border-white/50 bg-white/20 text-white hover:bg-white/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {avatarLabel === null ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="leading-none">{avatarLabel}</span>
              )}
            </NavLink>
          </div>
        </div>
      </header>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl safe-area-inset-bottom">
        <div className="grid grid-cols-3 h-16 max-w-7xl mx-auto">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 relative transition-all duration-200 ${
                  isActive ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar at top */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-b-full" />
                  )}
                  <div
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-purple-50 scale-110"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-semibold transition-all ${
                      isActive ? "scale-105" : ""
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
