import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiCube,
  HiTag,
  HiTruck,
  HiArrowDown,
  HiArrowUp,
  HiClipboardList,
  HiShoppingBag,
  HiBell,
  HiChartBar,
  HiShieldCheck,
  HiUsers,
  HiX,
} from 'react-icons/hi';
import { useAuthStore, type UserRole } from '../../stores/auth.store';
import { useEffect, useRef } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { path: '/dashboard',          label: 'Dashboard',          icon: HiHome,          roles: ['admin', 'warehouse', 'manager'] },
  { path: '/materials',          label: 'Materiales',         icon: HiCube,          roles: ['admin', 'warehouse', 'manager'] },
  { path: '/categories',         label: 'Categorías',         icon: HiTag,           roles: ['admin', 'warehouse', 'manager'] },
  { path: '/suppliers',          label: 'Proveedores',        icon: HiTruck,         roles: ['admin', 'warehouse', 'manager'] },
  { path: '/inventory/entries',  label: 'Entradas',           icon: HiArrowDown,     roles: ['admin', 'warehouse'] },
  { path: '/inventory/exits',    label: 'Salidas',            icon: HiArrowUp,       roles: ['admin', 'warehouse'] },
  { path: '/work-orders',        label: 'Órdenes de Trabajo', icon: HiClipboardList, roles: ['admin', 'warehouse', 'manager'] },
  { path: '/sales',              label: 'Ventas',             icon: HiShoppingBag,   roles: ['admin', 'warehouse', 'manager'] },
  { path: '/alerts',             label: 'Alertas',            icon: HiBell,          roles: ['admin', 'warehouse', 'manager'] },
  { path: '/reports',            label: 'Reportes',           icon: HiChartBar,      roles: ['admin', 'manager'] },
  { path: '/audit',              label: 'Auditoría',          icon: HiShieldCheck,   roles: ['admin'] },
  { path: '/users',              label: 'Usuarios',           icon: HiUsers,         roles: ['admin'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore(s => s.user);
  const overlayRef = useRef<HTMLDivElement>(null);

  const visibleItems = navItems.filter(
    item => user && item.roles.includes(user.role),
  );

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const sidebarContent = (
    <div className="flex flex-col h-full w-64 bg-slate-950 border-r border-slate-800 shadow-2xl overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">EMELVEN</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Stock & ERP</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
        {visibleItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => {
              // Close sidebar on mobile after clicking a link
              if (window.innerWidth < 768) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
              }`
            }
          >
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
              location.pathname === path ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
            }`} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — overlay drawer */}
      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 flex md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div className="relative z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
