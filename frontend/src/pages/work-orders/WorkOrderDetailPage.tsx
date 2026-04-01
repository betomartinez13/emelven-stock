import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import { useWorkOrder, useUpdateWorkOrderStatus } from '../../hooks/useWorkOrders';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import RoleGate from '../../components/shared/RoleGate';
import AddMaterialModal from './AddMaterialModal';
import { WO_STATUS_CONFIG } from '../../types/work-order.types';
import { formatDateShort, formatNumber } from '../../utils/formatters';

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const { data: wo, isLoading } = useWorkOrder(id ? Number(id) : null);
  const updateStatus = useUpdateWorkOrderStatus();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (!wo) return <p className="text-center text-slate-500 dark:text-slate-400 py-10">Orden no encontrada</p>;

  const statusCfg = WO_STATUS_CONFIG[wo.estado];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/work-orders')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">{wo.codigo}</h1>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Status actions */}
        <RoleGate roles={['admin', 'warehouse']}>
          <div className="flex gap-2">
            {wo.estado === 'pendiente' && (
              <Button
                loading={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: wo.id, estado: 'en_progreso' })}
              >
                Iniciar
              </Button>
            )}
            {wo.estado === 'en_progreso' && (
              <>
                <Button
                  variant="secondary"
                  loading={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: wo.id, estado: 'cancelada' })}
                >
                  Cancelar
                </Button>
                <Button
                  loading={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: wo.id, estado: 'completada' })}
                >
                  Completar
                </Button>
              </>
            )}
          </div>
        </RoleGate>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium tracking-wide">Cliente</p>
          <p className="text-sm text-slate-800 dark:text-slate-100 font-medium mt-0.5">{wo.cliente}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium tracking-wide">Fecha de inicio</p>
          <p className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{formatDateShort(wo.fechaInicio)}</p>
        </div>
        {wo.fechaFin && (
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium tracking-wide">Fecha de fin</p>
            <p className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{formatDateShort(wo.fechaFin)}</p>
          </div>
        )}
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-medium tracking-wide">Descripción</p>
          <p className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{wo.descripcion}</p>
        </div>
      </div>

      {/* Materials */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Materiales consumidos</h2>
          {wo.estado === 'en_progreso' && (
            <RoleGate roles={['admin', 'warehouse']}>
              <Button size="sm" onClick={() => setShowAddMaterial(true)}>
                Agregar material
              </Button>
            </RoleGate>
          )}
        </div>
        <div className="overflow-x-auto">
          {wo.materials.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm">Sin materiales consumidos</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  {['Material', 'Unidad', 'Cantidad', 'Fecha'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {wo.materials.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-800 dark:text-slate-100">{m.material.nombre}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{m.material.unidad}</td>
                    <td className="px-6 py-3 text-sm text-slate-800 dark:text-slate-100 tabular-nums">{formatNumber(m.cantidadUsada)}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDateShort(m.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddMaterialModal
        workOrderId={wo.id}
        isOpen={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
      />
    </div>
  );
}
