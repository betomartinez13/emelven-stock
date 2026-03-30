import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMaterial, useCreateMaterial, useUpdateMaterial } from '../../hooks/useMaterials';
import { useCategories } from '../../hooks/useCategories';
import { useSuppliers } from '../../hooks/useSuppliers';
import Button from '../../components/ui/Button';

const schema = z.object({
  nombre: z.string().min(1, 'Campo requerido'),
  descripcion: z.string().optional(),
  unidad: z.string().min(1, 'Campo requerido'),
  stockActual: z.coerce.number().min(0).optional(),
  stockMin: z.coerce.number().min(0, 'Debe ser ≥ 0'),
  stockMax: z.coerce.number().min(0, 'Debe ser ≥ 0'),
  categoryId: z.coerce.number().min(1, 'Seleccione una categoría'),
  supplierId: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

const UNITS = ['kg', 'm', 'unidad', 'litro', 'rollo', 'm2', 'par', 'otro'];

export default function MaterialFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: material } = useMaterial(isEdit ? Number(id) : null);
  const { data: categories } = useCategories();
  const { data: suppliersData } = useSuppliers({ page: 1, limit: 100 });
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { stockMin: 0, stockMax: 0 },
  });

  useEffect(() => {
    if (material) {
      reset({
        nombre: material.nombre,
        descripcion: material.descripcion ?? '',
        unidad: material.unidad,
        stockMin: material.stockMin,
        stockMax: material.stockMax,
        categoryId: material.categoryId,
        supplierId: material.supplierId,
      });
    }
  }, [material, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      const { stockActual, ...rest } = data;
      await updateMaterial.mutateAsync({ id: Number(id), data: rest });
    } else {
      await createMaterial.mutateAsync(data);
    }
    navigate('/materials');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/materials')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Material' : 'Nuevo Material'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input {...register('nombre')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea {...register('descripcion')} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Unidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
            <select {...register('unidad')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar...</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unidad && <p className="mt-1 text-xs text-red-600">{errors.unidad.message}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select {...register('categoryId')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar...</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (opcional)</label>
            <select {...register('supplierId')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin proveedor</option>
              {suppliersData?.data.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          {/* Stock min/max */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
              <input type="number" step="any" {...register('stockMin')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.stockMin && <p className="mt-1 text-xs text-red-600">{errors.stockMin.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Máximo *</label>
              <input type="number" step="any" {...register('stockMax')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.stockMax && <p className="mt-1 text-xs text-red-600">{errors.stockMax.message}</p>}
            </div>
          </div>

          {/* Stock actual — solo al crear */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
              <input type="number" step="any" {...register('stockActual')} defaultValue={0} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-400">En edición el stock solo se modifica via entradas/salidas.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/materials')}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Guardar cambios' : 'Crear material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
