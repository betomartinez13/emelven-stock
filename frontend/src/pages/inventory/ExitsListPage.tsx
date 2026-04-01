import { useState } from 'react';
import { HiPlus, HiEye } from 'react-icons/hi';
import { useExits } from '../../hooks/useInventory';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import RoleGate from '../../components/shared/RoleGate';
import ExitFormModal from './ExitFormModal';
import ExitDetailModal from './ExitDetailModal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { InventoryExit } from '../../types/inventory.types';
import type { Column } from '../../components/ui/Table';

export default function ExitsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedExit, setSelectedExit] = useState<InventoryExit | null>(null);

  const { data, isLoading } = useExits({ page, limit: 10, search });

  const columns: Column<InventoryExit>[] = [
    {
      accessor: 'material',
      header: 'Material',
      render: (_, e) => <span className="font-medium text-slate-800 dark:text-slate-100">{e.material.nombre}</span>,
    },
    {
      accessor: 'cantidad',
      header: 'Cantidad',
      render: (_, e) => `${formatNumber(e.cantidad)} ${e.material.unidad}`,
    },
    { accessor: 'fechaSalida', header: 'Fecha', render: (_, e) => formatDate(e.fechaSalida) },
    { accessor: 'motivo', header: 'Motivo', render: (_, e) => <span className="block max-w-[200px] truncate" title={e.motivo ?? ''}>{e.motivo ?? '—'}</span> },
    { accessor: 'workOrder', header: 'Orden de Trabajo', render: (_, e) => e.workOrder?.codigo ?? '—' },
    {
      accessor: 'user',
      header: 'Registrado por',
      render: (_, e) => `${e.user.nombre} ${e.user.apellido}`,
    },
    {
      accessor: 'acciones',
      header: '',
      render: (_, e) => (
        <button
          onClick={() => setSelectedExit(e)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Ver detalles"
        >
          <HiEye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Salidas de Inventario</h1>
        <RoleGate roles={['admin', 'warehouse']}>
          <Button leftIcon={<HiPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Nueva Salida
          </Button>
        </RoleGate>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onSearch={q => { setSearch(q); setPage(1); }}
        searchPlaceholder="Buscar material..."
        emptyMessage="No hay salidas registradas"
      />

      <ExitFormModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <ExitDetailModal exit={selectedExit} onClose={() => setSelectedExit(null)} />
    </div>
  );
}
