import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiArrowLeft } from 'react-icons/hi';
import { useCreateWorkOrder } from '../../hooks/useWorkOrders';
import Button from '../../components/ui/Button';

const schema = z.object({
  descripcion: z.string().min(1, 'Campo requerido').max(500),
  cliente: z.string().min(1, 'Campo requerido').max(150),
  fechaInicio: z.string().min(1, 'Campo requerido'),
});

type FormData = z.infer<typeof schema>;

const INPUT_CLASS = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

export default function WorkOrderFormPage() {
  const navigate = useNavigate();
  const createWorkOrder = useCreateWorkOrder();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fechaInicio: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    const wo = await createWorkOrder.mutateAsync(data);
    navigate(`/work-orders/${wo.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/work-orders')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Nueva Orden de Trabajo</h1>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
        <p className="text-sm text-slate-400 mb-6">El código de la orden se genera automáticamente.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del trabajo *</label>
            <textarea
              {...register('descripcion')}
              rows={3}
              maxLength={500}
              placeholder="Ej: Reparación de transformador de 50kVA..."
              className={INPUT_CLASS}
            />
            {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <input
              {...register('cliente')}
              maxLength={150}
              className={INPUT_CLASS}
            />
            {errors.cliente && <p className="mt-1 text-xs text-red-600">{errors.cliente.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio *</label>
            <input
              type="date"
              {...register('fechaInicio')}
              className={INPUT_CLASS}
            />
            {errors.fechaInicio && <p className="mt-1 text-xs text-red-600">{errors.fechaInicio.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/work-orders')}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Crear orden</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
