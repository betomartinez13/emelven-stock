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
  nombre: z.string().min(1, 'Campo requerido').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  unidad: z.string().min(1, 'Campo requerido'),
  stockActual: z.coerce.number().min(0).optional(),
  stockMin: z.coerce.number().min(0, 'Debe ser ≥ 0'),
  stockMax: z.coerce.number().min(0, 'Debe ser ≥ 0'),
  categoryId: z.coerce.number().min(1, 'Seleccione una categoría'),
  supplierId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1).optional()
  ),
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
    const payload = { ...data, supplierId: data.supplierId || undefined };
    if (isEdit) {
      const { stockActual, ...rest } = payload;
      await updateMaterial.mutateAsync({ id: Number(id), data: rest });
    } else {
      await createMaterial.mutateAsync(payload);
    }
    navigate('/materials');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/materials')} className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
          &larr; Volver
        </button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isEdit ? 'Editar Material' : 'Nuevo Material'}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre *</label>
            <input {...register('nombre')} maxLength={150} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
            {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
            <textarea {...register('descripcion')} maxLength={500} rows={2} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
          </div>

          {/* Unidad */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unidad *</label>
            <select {...register('unidad')} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white">
              <option value="">Seleccionar...</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unidad && <p className="mt-1 text-xs text-red-600">{errors.unidad.message}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoría *</label>
            <select {...register('categoryId')} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white">
              <option value="">Seleccionar...</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Proveedor (opcional)</label>
            <select {...register('supplierId')} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white">
              <option value="">Sin proveedor</option>
              {suppliersData?.data.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {errors.supplierId?.message && <p className="mt-1 text-xs text-red-600">{errors.supplierId.message as string}</p>}
          </div>

          {/* Stock min/max */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock Mínimo *</label>
              <input type="number" step="any" {...register('stockMin')} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
              {errors.stockMin && <p className="mt-1 text-xs text-red-600">{errors.stockMin.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock Máximo *</label>
              <input type="number" step="any" {...register('stockMax')} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
              {errors.stockMax && <p className="mt-1 text-xs text-red-600">{errors.stockMax.message}</p>}
            </div>
          </div>

          {/* Stock actual — solo al crear */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock Inicial</label>
              <input type="number" step="any" {...register('stockActual')} defaultValue={0} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
              <p className="mt-1.5 text-xs text-slate-500 font-medium">En edición el stock solo se modifica via entradas/salidas.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
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
