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
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Historial de Movimientos</h2>
            <p className="text-sm text-gray-500">{material.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : !movements?.length ? (
            <p className="text-center text-gray-400 py-10">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {movements.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    m.type === 'entry' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className={`flex-shrink-0 p-1.5 rounded-full ${m.type === 'entry' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {m.type === 'entry'
                      ? <HiArrowDown className="w-4 h-4 text-green-600" />
                      : <HiArrowUp className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${m.type === 'entry' ? 'text-green-800' : 'text-red-800'}`}>
                        {m.type === 'entry' ? '+' : '-'}{m.cantidad} {material.unidad}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(m.fecha)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {m.user.nombre} {m.user.apellido}
                    </p>
                    {(m.observacion || m.motivo) && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {m.observacion ?? m.motivo}
                      </p>
                    )}
                    {m.workOrder && (
                      <p className="text-xs text-blue-600 mt-0.5">OT: {m.workOrder.codigo}</p>
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
