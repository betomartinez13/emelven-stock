import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPencil, HiTrash, HiPlus, HiEye } from 'react-icons/hi';
import { useMaterials, useDeleteMaterial } from '../../hooks/useMaterials';
import { useCategories } from '../../hooks/useCategories';
import DataTable from '../../components/shared/DataTable';
import StockStatusBadge from '../../components/ui/StockStatusBadge';
import StockProgressBar from '../../components/ui/StockProgressBar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import RoleGate from '../../components/shared/RoleGate';
import MovementHistoryPanel from '../../components/shared/MovementHistoryPanel';
import type { Material } from '../../types/material.types';
import type { Column } from '../../components/ui/Table';

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  const { data, isLoading } = useMaterials({ page, limit: 10, search, categoryId });
  const { data: categories } = useCategories();
  const deleteMaterial = useDeleteMaterial();

  const columns: Column<Material>[] = [
    { accessor: 'nombre', header: 'Nombre', render: (_, m) => <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{m.nombre}</span> },
    { accessor: 'category', header: 'Categoría', render: (_, m) => <span className="text-slate-600 dark:text-slate-300 font-medium">{m.category?.nombre ?? '—'}</span> },
    { accessor: 'supplier', header: 'Proveedor', render: (_, m) => <span className="text-slate-600 dark:text-slate-300 font-medium">{m.supplier?.nombre ?? '—'}</span> },
    { accessor: 'unidad', header: 'Unidad', render: (_, m) => <span className="text-slate-600 dark:text-slate-300 font-medium">{m.unidad}</span> },
    {
      accessor: 'stock',
      header: 'Stock',
      render: (_, m) => (
        <div className="w-36">
          <StockProgressBar stockActual={m.stockActual} stockMin={m.stockMin} stockMax={m.stockMax} />
        </div>
      ),
    },
    {
      accessor: 'estado',
      header: 'Estado',
      render: (_, m) => <StockStatusBadge stockActual={m.stockActual} stockMin={m.stockMin} stockMax={m.stockMax} />,
    },
    {
      accessor: 'actions',
      header: '',
      render: (_, m) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHistoryMaterial(m)}
            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Ver movimientos"
          >
            <HiEye className="w-4 h-4" />
          </button>
          <RoleGate roles={['admin', 'warehouse']}>
            <button
              onClick={() => navigate(`/materials/${m.id}/edit`)}
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title="Editar"
            >
              <HiPencil className="w-4 h-4" />
            </button>
          </RoleGate>
          <RoleGate roles={['admin']}>
            <button
              onClick={() => setDeleteTarget(m)}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          </RoleGate>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMaterial.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Materiales</h1>
        <div className="flex flex-wrap gap-3">
          <RoleGate roles={['admin', 'manager']}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                import('../../utils/pdf-download').then(m =>
                  m.downloadPdf('/reports/export/pdf/inventory', 'inventario-actual.pdf')
                );
              }}
            >
              Exportar PDF
            </Button>
          </RoleGate>
          <RoleGate roles={['admin', 'warehouse']}>
            <Button leftIcon={<HiPlus className="w-4 h-4" />} onClick={() => navigate('/materials/new')}>
              Nuevo Material
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <select
          value={categoryId ?? ''}
          onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="">Todas las categorías</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
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
        emptyMessage="No hay materiales registrados"
      />

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <p className="text-slate-600 dark:text-slate-300 mb-6 font-medium">
          ¿Eliminar el material <strong className="text-slate-800 dark:text-slate-100">{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" loading={deleteMaterial.isPending} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Panel historial */}
      <MovementHistoryPanel
        material={historyMaterial}
        onClose={() => setHistoryMaterial(null)}
      />
    </div>
  );
}
