import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import RoleGate from '../../components/shared/RoleGate';
import { useSuppliers, useDeleteSupplier } from '../../hooks/useSuppliers';
import type { Supplier } from '../../types/supplier.types';
import type { Column } from '../../components/ui/Table';

export default function SuppliersListPage() {
  const navigate = useNavigate();
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Supplier | undefined>();

  const { data, isLoading } = useSuppliers({ page, limit: 10, search });
  const deleteSupplier = useDeleteSupplier();

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteSupplier.mutateAsync(deleteTarget.id);
    setDeleteTarget(undefined);
  };

  const columns: Column<Supplier>[] = [
    {
      header: 'Nombre',
      accessor: 'nombre',
      render: (_, row) => <span className="font-medium text-gray-800 block max-w-[180px] truncate" title={row.nombre}>{row.nombre}</span>,
    },
    { header: 'Contacto',  accessor: 'contacto',  render: (_, row) => <span className="block max-w-[120px] truncate" title={row.contacto ?? ''}>{row.contacto ?? '—'}</span> },
    { header: 'Teléfono',  accessor: 'telefono',  render: (_, row) => <span className="block max-w-[130px] truncate" title={row.telefono ?? ''}>{row.telefono ?? '—'}</span> },
    { header: 'Email',     accessor: 'email',     render: (_, row) => <span className="block max-w-[180px] truncate" title={row.email ?? ''}>{row.email ?? '—'}</span> },
    { header: 'Dirección', accessor: 'direccion', render: (_, row) => <span className="block max-w-[160px] truncate" title={row.direccion ?? ''}>{row.direccion ?? '—'}</span> },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/suppliers/${row.id}/edit`)}
            className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <HiPencil className="w-4 h-4" />
          </button>
          <RoleGate roles={['admin']}>
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Eliminar"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          </RoleGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Proveedores</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de proveedores del inventario</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onSearch={handleSearch}
        searchPlaceholder="Buscar por nombre..."
        emptyMessage="No hay proveedores registrados"
        actions={
          <Button
            leftIcon={<HiPlus className="w-4 h-4" />}
            onClick={() => navigate('/suppliers/new')}
          >
            Nuevo Proveedor
          </Button>
        }
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Eliminar Proveedor"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que deseas eliminar al proveedor{' '}
          <span className="font-semibold text-gray-800">"{deleteTarget?.nombre}"</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setDeleteTarget(undefined)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deleteSupplier.isPending}
            onClick={confirmDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
