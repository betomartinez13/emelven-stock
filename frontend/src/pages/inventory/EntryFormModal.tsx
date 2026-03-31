import { useForm } from 'react-hook-form';
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
  observacion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EntryFormModal({ isOpen, onClose }: EntryFormModalProps) {
  const { data: materialsData } = useMaterials({ page: 1, limit: 100 });
  const createEntry = useCreateEntry();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
          <select {...register('materialId')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccionar...</option>
            {materialsData?.data.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} (Stock: {m.stockActual} {m.unidad})</option>
            ))}
          </select>
          {errors.materialId && <p className="mt-1 text-xs text-red-600">{errors.materialId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
          <input type="number" step="any" {...register('cantidad')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.cantidad && <p className="mt-1 text-xs text-red-600">{errors.cantidad.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrada *</label>
          <input type="date" {...register('fechaEntrada')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.fechaEntrada && <p className="mt-1 text-xs text-red-600">{errors.fechaEntrada.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
          <textarea {...register('observacion')} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={createEntry.isPending}>Registrar entrada</Button>
        </div>
      </form>
    </Modal>
  );
}
