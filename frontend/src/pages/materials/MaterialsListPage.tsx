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
    { accessor: 'nombre', header: 'Nombre', render: (_, m) => <span className="font-medium text-gray-900">{m.nombre}</span> },
    { accessor: 'category', header: 'Categoría', render: (_, m) => m.category?.nombre ?? '—' },
    { accessor: 'supplier', header: 'Proveedor', render: (_, m) => m.supplier?.nombre ?? '—' },
    { accessor: 'unidad', header: 'Unidad' },
    {
      accessor: 'stock',
      header: 'Stock',
      render: (_, m) => (
        <div className="w-32">
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHistoryMaterial(m)}
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            title="Ver movimientos"
          >
            <HiEye className="w-4 h-4" />
          </button>
          <RoleGate roles={['admin', 'warehouse']}>
            <button
              onClick={() => navigate(`/materials/${m.id}/edit`)}
              className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              title="Editar"
            >
              <HiPencil className="w-4 h-4" />
            </button>
          </RoleGate>
          <RoleGate roles={['admin']}>
            <button
              onClick={() => setDeleteTarget(m)}
              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
        <div className="flex gap-2">
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
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryId ?? ''}
          onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <p className="text-gray-600 mb-6">
          ¿Eliminar el material <strong>{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
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
