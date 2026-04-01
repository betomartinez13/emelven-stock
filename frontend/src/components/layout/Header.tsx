import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMenu, HiBell, HiSun, HiMoon } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCount, useUnreadAlerts, useMarkAllAsRead } from '../../hooks/useAlerts';
import { useTheme } from '../../hooks/useTheme';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

interface HeaderProps {
  onMenuClick: () => void;
}

const TIPO_COLORS: Record<string, string> = {
  stock_critico: 'text-red-600',
  stock_bajo: 'text-yellow-600',
};

function AlertBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: count = 0 } = useUnreadCount();
  const { data: alerts = [] } = useUnreadAlerts();
  const markAll = useMarkAllAsRead();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayCount = count > 99 ? '99+' : count;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 focus:outline-none transition-colors"
        aria-label="Alertas"
      >
        <HiBell className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {count > 0 ? `${count} alerta${count !== 1 ? 's' : ''} sin leer` : 'Sin alertas nuevas'}
            </span>
            {count > 0 && (
              <button
                onClick={() => { markAll.mutate(); }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded transition-colors"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {alerts.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">No hay alertas sin leer</p>
            ) : (
              alerts.slice(0, 5).map(a => (
                <div key={a.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-default">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-tight ${TIPO_COLORS[a.tipo] ?? 'text-slate-800 dark:text-slate-100'}`}>
                      {a.material.nombre}
                    </p>
                    <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      a.tipo === 'stock_critico' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    }`}>
                      {a.tipo === 'stock_critico' ? 'Crítico' : 'Stock bajo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{a.mensaje}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDateTime(a.fechaCreacion)}</p>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { navigate('/alerts'); setOpen(false); }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 w-full text-center transition-colors"
            >
              Ver todas las alertas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const initials = user
    ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase()
    : '??';

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : '';
  const roleColor = user ? (ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-800') : '';

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 py-3 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 focus:outline-none transition-colors"
        aria-label="Abrir menú"
      >
        <HiMenu className="w-6 h-6" />
      </button>

      <div className="flex-1 md:flex-none" />

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 focus:outline-none transition-colors"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
        </button>

        <AlertBell />

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {user?.nombre} {user?.apellido}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        </div>

        <button
          onClick={logout}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
