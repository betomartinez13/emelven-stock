import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageFormHeader from '../../components/shared/PageFormHeader';
import { z } from 'zod';
import { useCreateSale } from '../../hooks/useSales';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import Button from '../../components/ui/Button';

const schema = z.object({
  workOrderId: z.coerce.number().optional(),
  cliente: z.string().min(1, 'Campo requerido'),
  producto: z.string().min(1, 'Campo requerido').max(500, 'Máximo 500 caracteres'),
  cantidad: z.coerce.number().min(1, 'Mínimo 1'),
  fecha: z.string().min(1, 'Campo requerido'),
  observacion: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

export default function SaleFormPage() {
  const navigate = useNavigate();
  const createSale = useCreateSale();
  const { data: completedWOs } = useWorkOrders({ page: 1, limit: 100, estado: 'completada' });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { cantidad: 1, fecha: new Date().toISOString().split('T')[0] },
  });

  const watchedWOId = watch('workOrderId');

  useEffect(() => {
    if (watchedWOId && completedWOs) {
      const wo = completedWOs.data.find(w => w.id === Number(watchedWOId));
      if (wo) {
        setValue('cliente', wo.cliente);
        setValue('producto', wo.descripcion);
      }
    }
  }, [watchedWOId, completedWOs, setValue]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      workOrderId: data.workOrderId || undefined,
    };
    await createSale.mutateAsync(payload);
    navigate('/sales');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageFormHeader
        title="Nueva Venta"
        subtitle="Registra una nueva venta, con o sin orden de trabajo asociada."
        onBack={() => navigate('/sales')}
      />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orden de Trabajo (opcional)</label>
            <select {...register('workOrderId')} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option value="">Sin orden de trabajo</option>
              {completedWOs?.data.map(wo => (
                <option key={wo.id} value={wo.id}>{wo.codigo} — {wo.cliente}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Al seleccionar una OT se auto-rellenan Cliente y Producto.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
            <input {...register('cliente')} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            {errors.cliente && <p className="mt-1 text-xs text-red-600">{errors.cliente.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción del producto *</label>
            <textarea {...register('producto')} rows={2} maxLength={500} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
            {errors.producto && <p className="mt-1 text-xs text-red-600">{errors.producto.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad *</label>
              <input type="number" {...register('cantidad')} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
              {errors.cantidad && <p className="mt-1 text-xs text-red-600">{errors.cantidad.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha de despacho *</label>
              <input type="date" {...register('fecha')} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
              {errors.fecha && <p className="mt-1 text-xs text-red-600">{errors.fecha.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observaciones</label>
            <textarea {...register('observacion')} rows={2} maxLength={255} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/sales')}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Registrar venta</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
