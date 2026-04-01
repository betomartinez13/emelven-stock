import { useState } from 'react';
import { HiCheckCircle } from 'react-icons/hi';
import { useAlerts, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '../../hooks/useAlerts';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import { formatDateTime } from '../../utils/formatters';
import type { Alert, AlertType } from '../../types/alert.types';
import type { Column } from '../../components/ui/Table';

const TIPO_CONFIG: Record<AlertType, { label: string; color: string }> = {
  stock_critico: { label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
  stock_bajo:    { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' },
};

const selectClass = 'text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [leidaFilter, setLeidaFilter] = useState<string>('');

  const { data, isLoading } = useAlerts({
    page,
    limit: 10,
    tipo: tipoFilter as AlertType || undefined,
    leida: leidaFilter === '' ? undefined : leidaFilter === 'true',
  });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const { data: unreadCount = 0 } = useUnreadCount();

  const columns: Column<Alert>[] = [
    {
      accessor: 'tipo',
      header: 'Tipo',
      render: (_, a) => {
        const cfg = TIPO_CONFIG[a.tipo];
        return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
      },
    },
    { accessor: 'material', header: 'Material', render: (_, a) => a.material.nombre },
    { accessor: 'mensaje', header: 'Mensaje', render: (_, a) => <span className="text-sm">{a.mensaje}</span> },
    {
      accessor: 'materialId',
      header: 'Stock actual / mínimo',
      render: (_, a) => `${a.material.stockActual} / ${a.material.stockMin} ${a.material.unidad}`,
    },
    { accessor: 'fechaCreacion', header: 'Fecha', render: (_, a) => formatDateTime(a.fechaCreacion) },
    {
      accessor: 'leida',
      header: 'Estado',
      render: (_, a) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
          a.leida
            ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400'
        }`}>
          {a.leida ? 'Leída' : 'Sin leer'}
        </span>
      ),
    },
    {
      accessor: 'id',
      header: '',
      render: (_, a) => !a.leida ? (
        <button
          onClick={() => markAsRead.mutate(a.id)}
          title="Marcar como leída"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
        >
          <HiCheckCircle className="w-3.5 h-3.5" />
          Leída
        </button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Alertas de Stock</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            loading={markAllAsRead.isPending}
            leftIcon={<HiCheckCircle className="w-4 h-4" />}
            onClick={() => markAllAsRead.mutate()}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={tipoFilter}
          onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          <option value="stock_critico">Crítico</option>
          <option value="stock_bajo">Stock Bajo</option>
        </select>

        <select
          value={leidaFilter}
          onChange={e => { setLeidaFilter(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">Todas</option>
          <option value="false">Sin leer</option>
          <option value="true">Leídas</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No hay alertas registradas"
      />
    </div>
  );
}
