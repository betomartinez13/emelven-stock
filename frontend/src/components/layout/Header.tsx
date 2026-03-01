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
    <header className="bg-white shadow-sm flex items-center justify-between px-4 py-3 flex-shrink-0">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
        aria-label="Abrir menú"
      >
        <HiMenu className="w-6 h-6" />
      </button>

      {/* Center placeholder — page title if needed */}
      <div className="flex-1 md:flex-none" />

      {/* Right: alerts bell + user info */}
      <div className="flex items-center gap-4">
        {/* Alerts bell */}
        <button
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
          aria-label="Alertas"
        >
          <HiBell className="w-6 h-6" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-gray-800">
              {user?.nombre} {user?.apellido}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>
              {roleLabel}
            </span>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
