import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { LogOut, User as UserIcon } from "lucide-react";
import type { UserProfile } from "../../types/auth";

interface UserMenuProps {
  user: UserProfile | null;
  profileTo: string;
  triggerClassName: string;
  triggerAriaLabel: string;
  children: ReactNode;
}

/**
 * Menu déroulant du compte (avatar dans la topbar) : accès rapide au profil
 * et à la déconnexion, sans devoir passer par la page profil.
 */
export function UserMenu({ user, profileTo, triggerClassName, triggerAriaLabel, children }: UserMenuProps) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    void auth.signoutRedirect();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={triggerAriaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClassName}
      >
        {children}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          {user && (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          )}

          <NavLink
            to={profileTo}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <UserIcon className="h-4 w-4 text-slate-400" aria-hidden />
            Mon profil
          </NavLink>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
