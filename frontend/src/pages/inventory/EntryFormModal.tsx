import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMaterials } from '../../hooks/useMaterials';
import { useCreateEntry } from '../../hooks/useInventory';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const schema = z.object({
  materialId: z.coerce.number().min(1, 'Seleccione un material'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  fechaEntrada: z.string().min(1, 'Campo requerido'),
  observacion: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

const fieldClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
const errorClass = 'mt-1 text-xs text-red-500';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EntryFormModal({ isOpen, onClose }: EntryFormModalProps) {
  const { data: materialsData } = useMaterials({ page: 1, limit: 100 });
  const createEntry = useCreateEntry();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { fechaEntrada: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    await createEntry.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Entrada">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>Material *</label>
          <select {...register('materialId')} className={fieldClass}>
            <option value="">Seleccionar...</option>
            {materialsData?.data.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} (Stock: {m.stockActual} {m.unidad})</option>
            ))}
          </select>
          {errors.materialId && <p className={errorClass}>{errors.materialId.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Cantidad *</label>
          <input type="number" step="any" {...register('cantidad')} className={fieldClass} placeholder="0" />
          {errors.cantidad && <p className={errorClass}>{errors.cantidad.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Fecha de entrada *</label>
          <input type="date" {...register('fechaEntrada')} className={fieldClass} />
          {errors.fechaEntrada && <p className={errorClass}>{errors.fechaEntrada.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Observación</label>
          <textarea {...register('observacion')} maxLength={255} rows={2} className={fieldClass} placeholder="Opcional..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={createEntry.isPending}>Registrar entrada</Button>
        </div>
      </form>
    </Modal>
  );
}
