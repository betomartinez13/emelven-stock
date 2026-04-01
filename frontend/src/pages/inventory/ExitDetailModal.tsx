import Modal from '../../components/ui/Modal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { InventoryExit } from '../../types/inventory.types';

interface Props {
  exit: InventoryExit | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 break-words">{value}</p>
    </div>
  );
}

export default function ExitDetailModal({ exit, onClose }: Props) {
  return (
    <Modal isOpen={!!exit} onClose={onClose} title="Detalle de Salida" size="md">
      {exit && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Row label="Material" value={exit.material.nombre} />
            <Row label="Unidad" value={exit.material.unidad} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Row label="Cantidad" value={formatNumber(exit.cantidad)} />
            <Row label="Fecha de Salida" value={formatDate(exit.fechaSalida)} />
          </div>

          {exit.motivo && (
            <Row label="Motivo" value={exit.motivo} />
          )}

          {exit.workOrder && (
            <Row label="Orden de Trabajo" value={exit.workOrder.codigo} />
          )}

          <Row
            label="Registrado por"
            value={`${exit.user.nombre} ${exit.user.apellido}`}
          />
        </div>
      )}
    </Modal>
  );
}
