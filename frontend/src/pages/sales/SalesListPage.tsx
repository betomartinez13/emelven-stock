import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiEye } from 'react-icons/hi';
import { useSales } from '../../hooks/useSales';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import RoleGate from '../../components/shared/RoleGate';
import SaleDetailModal from './SaleDetailModal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { Sale } from '../../types/sale.types';
import type { Column } from '../../components/ui/Table';

export default function SalesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { data, isLoading } = useSales({ page, limit: 10, cliente: search });

  const columns: Column<Sale>[] = [
    { accessor: 'fecha', header: 'Fecha', render: (_, s) => formatDate(s.fecha) },
    { accessor: 'cliente', header: 'Cliente', render: (_, s) => <span className="font-medium">{s.cliente}</span> },
    { accessor: 'producto', header: 'Producto', render: (_, s) => <span className="truncate max-w-xs block">{s.producto}</span> },
    { accessor: 'cantidad', header: 'Cantidad', render: (_, s) => formatNumber(s.cantidad) },
    { accessor: 'workOrder', header: 'Orden de Trabajo', render: (_, s) => s.workOrder?.codigo ?? '—' },
    { accessor: 'user', header: 'Registrado por', render: (_, s) => `${s.user.nombre} ${s.user.apellido}` },
    {
      accessor: 'acciones',
      header: '',
      render: (_, s) => (
        <button
          onClick={() => setSelectedSale(s)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
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
        <h1 className="text-2xl font-bold text-slate-800">Ventas</h1>
        <RoleGate roles={['admin', 'warehouse']}>
          <Button leftIcon={<HiPlus className="w-4 h-4" />} onClick={() => navigate('/sales/new')}>
            Nueva Venta
          </Button>
        </RoleGate>
      </div>

      <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onSearch={q => { setSearch(q); setPage(1); }}
        searchPlaceholder="Buscar por cliente..."
        emptyMessage="No hay ventas registradas"
      />
    </div>
  );
}
