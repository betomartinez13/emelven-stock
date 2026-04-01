import { useNavigate } from 'react-router-dom';
import { HiCube, HiExclamation, HiBell, HiClipboardList } from 'react-icons/hi';
import { useAuthStore } from '../../stores/auth.store';
import { useMaterials, useLowStockMaterials } from '../../hooks/useMaterials';
import { useUnreadCount, useUnreadAlerts } from '../../hooks/useAlerts';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { formatDateTime } from '../../utils/formatters';

interface KpiCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  iconBg: string;
  highlight?: boolean;
}

function KpiCard({ label, value, icon: Icon, iconBg, highlight }: KpiCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-5 shadow-sm transition-colors ${
      highlight && value && value > 0
        ? 'border-red-200 dark:border-red-800'
        : 'border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-extrabold ${
        highlight && value && value > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-800 dark:text-slate-100'
      }`}>
        {value ?? <span className="text-slate-300 dark:text-slate-600 text-2xl">—</span>}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const { data: materialsData } = useMaterials({ page: 1, limit: 1 });
  const { data: lowStockData } = useLowStockMaterials();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: recentAlerts = [] } = useUnreadAlerts();
  const { data: pendingWoData } = useWorkOrders({ page: 1, limit: 1, estado: 'pendiente' });

  const TIPO_COLORS: Record<string, string> = {
    stock_critico: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    stock_bajo:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  };
  const TIPO_LABELS: Record<string, string> = {
    stock_critico: 'Crítico',
    stock_bajo: 'Stock Bajo',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sistema de Control de Inventario — EMELVEN C.A.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Materiales"
          value={materialsData?.total}
          icon={HiCube}
          iconBg="bg-blue-500"
        />
        <KpiCard
          label="Stock Bajo / Crítico"
          value={lowStockData?.length}
          icon={HiExclamation}
          iconBg={lowStockData && lowStockData.length > 0 ? 'bg-red-500' : 'bg-yellow-500'}
          highlight
        />
        <KpiCard
          label="Alertas Sin Leer"
          value={unreadCount}
          icon={HiBell}
          iconBg="bg-red-500"
          highlight
        />
        <KpiCard
          label="OT Pendientes"
          value={pendingWoData?.total}
          icon={HiClipboardList}
          iconBg="bg-indigo-500"
        />
      </div>

      {/* Recent Alerts */}
      {unreadCount > 0 && recentAlerts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Alertas recientes
            </h2>
            <button
              onClick={() => navigate('/alerts')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Ver todas →
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentAlerts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-3 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <span className={`mt-0.5 flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLORS[a.tipo]}`}>
                  {TIPO_LABELS[a.tipo]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {a.material.nombre}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{a.mensaje}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {formatDateTime(a.fechaCreacion)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
