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
    <div className="flex flex-col h-full w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-blue-600">EMELVEN</h1>
          <p className="text-xs text-gray-400">Control de Inventario</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-gray-400 hover:text-gray-600"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => {
              // Close sidebar on mobile after clicking a link
              if (window.innerWidth < 768) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
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
