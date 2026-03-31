import { useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { useEntries } from '../../hooks/useInventory';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import RoleGate from '../../components/shared/RoleGate';
import EntryFormModal from './EntryFormModal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { InventoryEntry } from '../../types/inventory.types';
import type { Column } from '../../components/ui/Table';

export default function EntriesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useEntries({ page, limit: 10, search });

  const columns: Column<InventoryEntry>[] = [
    {
      accessor: 'material',
      header: 'Material',
      render: (_, e) => <span className="font-medium text-slate-800">{e.material.nombre}</span>,
    },
    {
      accessor: 'cantidad',
      header: 'Cantidad',
      render: (_, e) => `${formatNumber(e.cantidad)} ${e.material.unidad}`,
    },
    { accessor: 'fechaEntrada', header: 'Fecha', render: (_, e) => formatDate(e.fechaEntrada) },
    { accessor: 'observacion', header: 'Observación', render: (_, e) => <span className="block max-w-[200px] truncate" title={e.observacion ?? ''}>{e.observacion ?? '—'}</span> },
    {
      accessor: 'user',
      header: 'Registrado por',
      render: (_, e) => `${e.user.nombre} ${e.user.apellido}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Entradas de Inventario</h1>
        <RoleGate roles={['admin', 'warehouse']}>
          <Button leftIcon={<HiPlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Nueva Entrada
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
        emptyMessage="No hay entradas registradas"
      />

      <EntryFormModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
