import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus } from 'react-icons/hi';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import RoleGate from '../../components/shared/RoleGate';
import { WO_STATUS_CONFIG } from '../../types/work-order.types';
import { formatDateShort } from '../../utils/formatters';
import type { WorkOrder, WorkOrderStatus } from '../../types/work-order.types';
import type { Column } from '../../components/ui/Table';

const STATUS_TABS: { label: string; value: WorkOrderStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'En Progreso', value: 'en_progreso' },
  { label: 'Completadas', value: 'completada' },
  { label: 'Canceladas', value: 'cancelada' },
];

export default function WorkOrdersListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');

  const { data, isLoading } = useWorkOrders({
    page,
    limit: 10,
    search,
    estado: statusFilter || undefined,
  });

  const columns: Column<WorkOrder>[] = [
    {
      accessor: 'codigo',
      header: 'Código',
      render: (_, wo) => <span className="font-mono font-semibold text-blue-600">{wo.codigo}</span>,
    },
    {
      accessor: 'descripcion',
      header: 'Descripción',
      render: (_, wo) => <span className="block max-w-[200px] truncate" title={wo.descripcion}>{wo.descripcion}</span>,
    },
    { accessor: 'cliente', header: 'Cliente' },
    {
      accessor: 'estado',
      header: 'Estado',
      render: (_, wo) => {
        const cfg = WO_STATUS_CONFIG[wo.estado];
        return (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    },
    { accessor: 'fechaInicio', header: 'Inicio', render: (_, wo) => formatDateShort(wo.fechaInicio) },
    { accessor: 'fechaFin', header: 'Fin', render: (_, wo) => wo.fechaFin ? formatDateShort(wo.fechaFin) : '—' },
    {
      accessor: 'id',
      header: '',
      render: (_, wo) => (
        <button
          onClick={() => navigate(`/work-orders/${wo.id}`)}
          className="text-sm text-blue-600 hover:underline"
        >
          Ver
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Órdenes de Trabajo</h1>
        <RoleGate roles={['admin', 'warehouse']}>
          <Button leftIcon={<HiPlus className="w-4 h-4" />} onClick={() => navigate('/work-orders/new')}>
            Nueva Orden
          </Button>
        </RoleGate>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onSearch={q => { setSearch(q); setPage(1); }}
        searchPlaceholder="Buscar por cliente o descripción..."
        emptyMessage="No hay órdenes de trabajo"
      />
    </div>
  );
}
