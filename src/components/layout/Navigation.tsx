import { NavLink } from "react-router-dom";
import { Home, Calendar, User } from "lucide-react";

export function Navigation() {
  const baseStyle =
    "flex flex-col items-center justify-center text-xs transition";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t shadow-sm flex justify-around items-center">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? "text-purple-600 scale-110" : "text-gray-400"}`
        }
      >
        <Home size={20} />
        <span>Accueil</span>
      </NavLink>

      <NavLink
        to="/planning"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? "text-purple-600 scale-110" : "text-gray-400"}`
        }
      >
        <Calendar size={20} />
        <span>Planning</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${baseStyle} ${isActive ? "text-purple-600 scale-110" : "text-gray-400"}`
        }
      >
        <User size={20} />
        <span>Profil</span>
      </NavLink>
    </nav>
  );
}
