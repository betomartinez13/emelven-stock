import { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiExclamation } from 'react-icons/hi';
import { useMaterials } from '../../hooks/useMaterials';
import { useCreateExit } from '../../hooks/useInventory';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import type { Material } from '../../types/material.types';

const schema = z.object({
  materialId: z.coerce.number().min(1, 'Seleccione un material'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  fechaSalida: z.string().min(1, 'Campo requerido'),
  motivo: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

const fieldClass = 'w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
const errorClass = 'mt-1 text-xs text-red-500';

interface ExitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExitFormModal({ isOpen, onClose }: ExitFormModalProps) {
  const { data: materialsData } = useMaterials({ page: 1, limit: 100 });
  const createExit = useCreateExit();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { fechaSalida: new Date().toISOString().split('T')[0] },
  });

  const watchedMaterialId = watch('materialId');
  const watchedCantidad = watch('cantidad');

  useEffect(() => {
    if (watchedMaterialId && materialsData) {
      const mat = materialsData.data.find(m => m.id === Number(watchedMaterialId));
      setSelectedMaterial(mat ?? null);
    }
  }, [watchedMaterialId, materialsData]);

  const stockInsuficiente = selectedMaterial && watchedCantidad > selectedMaterial.stockActual;

  const onSubmit = async (data: FormData) => {
    await createExit.mutateAsync(data);
    reset();
    setSelectedMaterial(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Salida">
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
          {stockInsuficiente && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <HiExclamation className="w-4 h-4" />
              Stock insuficiente. Disponible: {selectedMaterial?.stockActual} {selectedMaterial?.unidad}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Fecha de salida *</label>
          <input type="date" {...register('fechaSalida')} className={fieldClass} />
          {errors.fechaSalida && <p className={errorClass}>{errors.fechaSalida.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Motivo</label>
          <textarea {...register('motivo')} maxLength={255} rows={2} className={fieldClass} placeholder="Opcional..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={createExit.isPending} disabled={!!stockInsuficiente}>
            Registrar salida
          </Button>
        </div>
      </form>
    </Modal>
  );
}
