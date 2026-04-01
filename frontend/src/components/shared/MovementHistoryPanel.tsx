import { HiArrowDown, HiArrowUp, HiX } from 'react-icons/hi';
import { useMovements } from '../../hooks/useInventory';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';
import type { Material } from '../../types/material.types';

interface MovementHistoryPanelProps {
  material: Material | null;
  onClose: () => void;
}

export default function MovementHistoryPanel({ material, onClose }: MovementHistoryPanelProps) {
  const { data: movements, isLoading } = useMovements(material?.id ?? null);

  if (!material) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Historial de Movimientos</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{material.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : !movements?.length ? (
            <p className="text-center text-slate-400 dark:text-slate-500 py-10">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {movements.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    m.type === 'entry'
                      ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                  }`}
                >
                  <div className={`flex-shrink-0 p-1.5 rounded-full ${m.type === 'entry' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                    {m.type === 'entry'
                      ? <HiArrowDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                      : <HiArrowUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${m.type === 'entry' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                        {m.type === 'entry' ? '+' : '-'}{m.cantidad} {material.unidad}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(m.fecha)}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {m.user.nombre} {m.user.apellido}
                    </p>
                    {(m.observacion || m.motivo) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {m.observacion ?? m.motivo}
                      </p>
                    )}
                    {m.workOrder && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">OT: {m.workOrder.codigo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
