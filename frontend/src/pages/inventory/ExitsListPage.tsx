import { useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { useExits } from '../../hooks/useInventory';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import RoleGate from '../../components/shared/RoleGate';
import ExitFormModal from './ExitFormModal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { InventoryExit } from '../../types/inventory.types';
import type { Column } from '../../components/ui/Table';

export default function ExitsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useExits({ page, limit: 10, search });

  const columns: Column<InventoryExit>[] = [
    {
      key: 'material',
      header: 'Material',
      render: e => <span className="font-medium text-gray-900">{e.material.nombre}</span>,
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      render: e => `${formatNumber(e.cantidad)} ${e.material.unidad}`,
    },
    { key: 'fechaSalida', header: 'Fecha', render: e => formatDate(e.fechaSalida) },
    { key: 'motivo', header: 'Motivo', render: e => e.motivo ?? '—' },
    { key: 'workOrder', header: 'Orden de Trabajo', render: e => e.workOrder?.codigo ?? '—' },
    {
      key: 'user',
      header: 'Registrado por',
      render: e => `${e.user.nombre} ${e.user.apellido}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Salidas de Inventario</h1>
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
    </div>
  );
}
