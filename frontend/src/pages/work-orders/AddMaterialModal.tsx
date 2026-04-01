import { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiExclamation } from 'react-icons/hi';
import { useMaterials } from '../../hooks/useMaterials';
import { useAddMaterial } from '../../hooks/useWorkOrders';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import type { Material } from '../../types/material.types';

const schema = z.object({
  materialId: z.coerce.number().min(1, 'Seleccione un material'),
  cantidadUsada: z.coerce.number().positive('Debe ser mayor a 0'),
});

type FormData = z.infer<typeof schema>;

interface AddMaterialModalProps {
  workOrderId: number;
  isOpen: boolean;
  onClose: () => void;
}

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
const inputClass = 'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

export default function AddMaterialModal({ workOrderId, isOpen, onClose }: AddMaterialModalProps) {
  const { data: materialsData } = useMaterials({ page: 1, limit: 100 });
  const addMaterial = useAddMaterial(workOrderId);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  const watchedMaterialId = watch('materialId');
  const watchedCantidad = watch('cantidadUsada');

  useEffect(() => {
    if (watchedMaterialId && materialsData) {
      const mat = materialsData.data.find(m => m.id === Number(watchedMaterialId));
      setSelectedMaterial(mat ?? null);
    }
  }, [watchedMaterialId, materialsData]);

  const stockInsuficiente = selectedMaterial && watchedCantidad > selectedMaterial.stockActual;

  const onSubmit = async (data: FormData) => {
    await addMaterial.mutateAsync(data);
    reset();
    setSelectedMaterial(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Material a la Orden">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>Material *</label>
          <select {...register('materialId')} className={inputClass}>
            <option value="">Seleccionar...</option>
            {materialsData?.data.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} (Stock: {m.stockActual} {m.unidad})</option>
            ))}
          </select>
          {errors.materialId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.materialId.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Cantidad *</label>
          <input type="number" step="any" {...register('cantidadUsada')} className={inputClass} />
          {errors.cantidadUsada && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cantidadUsada.message}</p>}
          {stockInsuficiente && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <HiExclamation className="w-4 h-4" />
              Stock insuficiente. Disponible: {selectedMaterial?.stockActual} {selectedMaterial?.unidad}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={addMaterial.isPending} disabled={!!stockInsuficiente}>
            Agregar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
