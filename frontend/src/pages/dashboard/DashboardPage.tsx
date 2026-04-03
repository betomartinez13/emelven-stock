import { useNavigate } from 'react-router-dom';
import { HiArrowDown, HiArrowUp, HiClipboardList, HiExclamation } from 'react-icons/hi';
import { useKpis } from '../../hooks/useReports';
import { useLowStockMaterials } from '../../hooks/useMaterials';
import { useEntries, useExits } from '../../hooks/useInventory';
import { useUnreadAlerts } from '../../hooks/useAlerts';
import { useAuthStore } from '../../stores/auth.store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import StockStatusBadge from '../../components/ui/StockStatusBadge';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const today = new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data: kpis, isLoading: kpisLoading } = useKpis();
  const { data: lowStock } = useLowStockMaterials();
  const { data: recentEntries } = useEntries({ page: 1, limit: 5 });
  const { data: recentExits } = useExits({ page: 1, limit: 5 });
  const { data: unreadAlerts } = useUnreadAlerts();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Bienvenido, {user?.nombre} {user?.apellido}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{today}</p>
      </div>

      {/* KPI Cards */}
      {kpisLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Materiales</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpis?.totalMateriales ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
            <p className="text-xs text-yellow-600 uppercase font-medium">Stock Bajo</p>
            <p className="text-2xl font-bold text-yellow-600">{kpis?.materialesConStockBajo ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">OTs Activas</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpis?.ordenesActivas ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
            <p className="text-xs text-red-500 uppercase font-medium">Alertas sin leer</p>
            <p className="text-2xl font-bold text-red-500">{unreadAlerts?.length ?? 0}</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" leftIcon={<HiArrowDown className="w-4 h-4" />} onClick={() => navigate('/inventory/entries')}>
            Nueva Entrada
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<HiArrowUp className="w-4 h-4" />} onClick={() => navigate('/inventory/exits')}>
            Nueva Salida
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<HiClipboardList className="w-4 h-4" />} onClick={() => navigate('/work-orders/new')}>
            Nueva Orden de Trabajo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            Actividad reciente
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {[
              ...(recentEntries?.data.map(e => ({ type: 'entry' as const, material: e.material.nombre, cantidad: e.cantidad, unidad: e.material.unidad, fecha: e.fechaEntrada })) ?? []),
              ...(recentExits?.data.map(e => ({ type: 'exit' as const, material: e.material.nombre, cantidad: e.cantidad, unidad: e.material.unidad, fecha: e.fechaSalida })) ?? []),
            ]
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .slice(0, 6)
              .map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className={`p-1.5 rounded-full ${item.type === 'entry' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {item.type === 'entry'
                      ? <HiArrowDown className="w-3.5 h-3.5 text-green-600" />
                      : <HiArrowUp className="w-3.5 h-3.5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{item.material}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.type === 'entry' ? '+' : '-'}{item.cantidad} {item.unidad}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{formatDate(item.fecha)}</span>
                </div>
              ))
            }
            {(!recentEntries?.data.length && !recentExits?.data.length) && (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">Sin actividad reciente</p>
            )}
          </div>
        </div>

        {/* Low stock + alerts */}
        <div className="space-y-4">
          {/* Low stock */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              Materiales con stock bajo
            </h2>
            {!lowStock?.length ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-6">Todo en orden</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {lowStock.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-slate-800 dark:text-slate-100 truncate">{m.nombre}</span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{m.stockActual} {m.unidad}</span>
                      <StockStatusBadge stockActual={m.stockActual} stockMin={m.stockMin} stockMax={m.stockMax} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unread alerts */}
          {(unreadAlerts?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <HiExclamation className="w-4 h-4 text-yellow-500" />
                Alertas sin leer
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {unreadAlerts?.slice(0, 3).map(a => (
                  <div key={a.id} className="px-5 py-3">
                    <p className="text-sm text-slate-800 dark:text-slate-100">{a.material.nombre}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{a.mensaje}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
