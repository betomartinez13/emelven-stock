import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import type { Category } from '../../types/category.types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RoleGate from '../../components/shared/RoleGate';

const schema = z.object({
  nombre:     z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | undefined>();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditTarget(undefined);
    reset({ nombre: '', descripcion: '' });
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    reset({ nombre: cat.nombre, descripcion: cat.descripcion ?? '' });
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditTarget(undefined);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    if (editTarget) {
      await updateCategory.mutateAsync({ id: editTarget.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    handleClose();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory.mutateAsync(deleteTarget.id);
    setDeleteTarget(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <p className="text-sm text-gray-500 mt-1">Categorías de materiales del inventario</p>
        </div>
        <RoleGate roles={['admin']}>
          <Button leftIcon={<HiPlus className="w-4 h-4" />} onClick={openCreate}>
            Nueva Categoría
          </Button>
        </RoleGate>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <RoleGate roles={['admin']}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    No hay categorías registradas
                  </td>
                </tr>
              ) : (
                categories?.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{cat.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.descripcion ?? '—'}</td>
                    <RoleGate roles={['admin']}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </RoleGate>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={formOpen}
        onClose={handleClose}
        title={editTarget ? 'Editar Categoría' : 'Nueva Categoría'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            {...register('nombre')}
            error={errors.nombre?.message}
            placeholder="Ej: Ferretería"
          />
          <Input
            label="Descripción (opcional)"
            {...register('descripcion')}
            placeholder="Descripción breve..."
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editTarget ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Eliminar Categoría"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que deseas eliminar la categoría{' '}
          <span className="font-semibold text-gray-800">"{deleteTarget?.nombre}"</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setDeleteTarget(undefined)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deleteCategory.isPending}
            onClick={confirmDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
