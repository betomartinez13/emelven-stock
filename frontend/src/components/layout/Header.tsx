import { HiMenu, HiBell } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase()
    : '??';

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : '';
  const roleColor = user ? (ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800') : '';

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 flex items-center justify-between px-6 py-3.5 flex-shrink-0 relative z-30">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none transition-colors"
        aria-label="Abrir menú"
      >
        <HiMenu className="w-5 h-5" />
      </button>

      {/* Center placeholder — page title if needed */}
      <div className="flex-1 md:flex-none" />

      {/* Right: alerts bell + user info */}
      <div className="flex items-center gap-5">
        {/* Alerts bell */}
        <button
          className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
          aria-label="Alertas"
        >
          <HiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              {user?.nombre} {user?.apellido}
            </span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${roleColor}`}>
              {roleLabel}
            </span>
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20 ring-2 ring-white">
            {initials}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-red-500 transition-colors font-semibold ml-2"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
