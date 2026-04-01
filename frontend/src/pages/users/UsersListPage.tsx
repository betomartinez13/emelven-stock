import { useState } from 'react';
import { HiPencil, HiTrash, HiUserAdd } from 'react-icons/hi';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import UserFormModal from './UserFormModal';
import { useUsers, useDeactivateUser } from '../../hooks/useUsers';
import type { User } from '../../types/user.types';
import type { Column } from '../../components/ui/Table';
import { formatDate } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/constants';

export default function UsersListPage() {
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState<User | undefined>(undefined);
  const [deactivateTarget, setDeactivateTarget] = useState<User | undefined>(undefined);

  const { data, isLoading } = useUsers({ page, limit: 10, search });
  const deactivate = useDeactivateUser();

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const openCreate = () => {
    setEditUser(undefined);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setModalOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    await deactivate.mutateAsync(deactivateTarget.id);
    setDeactivateTarget(undefined);
  };

  const columns: Column<User>[] = [
    {
      header: 'Nombre',
      accessor: 'nombre',
      render: (_, row) => (
        <span className="font-medium text-slate-800 dark:text-slate-100">
          {row.nombre} {row.apellido}
        </span>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Rol',
      accessor: 'role',
      render: (_, row) => {
        const colorMap: Record<User['role'], 'purple' | 'blue' | 'green'> = {
          admin:     'purple',
          warehouse: 'blue',
          manager:   'green',
        };
        return <Badge color={colorMap[row.role]}>{ROLE_LABELS[row.role]}</Badge>;
      },
    },
    {
      header: 'Estado',
      accessor: 'isActive',
      render: (_, row) => (
        <Badge color={row.isActive ? 'green' : 'red'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Creado',
      accessor: 'createdAt',
      render: (_, row) => formatDate(row.createdAt),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title="Editar"
          >
            <HiPencil className="w-4 h-4" />
          </button>
          {row.isActive && (
            <button
              onClick={() => setDeactivateTarget(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              title="Desactivar"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Usuarios</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión de usuarios del sistema</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onSearch={handleSearch}
        searchPlaceholder="Buscar por nombre, apellido o email..."
        emptyMessage="No hay usuarios registrados"
        actions={
          <Button leftIcon={<HiUserAdd className="w-4 h-4" />} onClick={openCreate}>
            Nuevo Usuario
          </Button>
        }
      />

      {/* Create / Edit modal */}
      <UserFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editUser}
      />

      {/* Deactivate confirmation modal */}
      <Modal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(undefined)}
        title="Desactivar Usuario"
        size="sm"
      >
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          ¿Estás seguro de que deseas desactivar a{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {deactivateTarget?.nombre} {deactivateTarget?.apellido}
          </span>
          ? El usuario no podrá iniciar sesión.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setDeactivateTarget(undefined)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deactivate.isPending}
            onClick={confirmDeactivate}
          >
            Desactivar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
