import Modal from '../../components/ui/Modal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { InventoryEntry } from '../../types/inventory.types';

interface Props {
  entry: InventoryEntry | null;
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

export default function EntryDetailModal({ entry, onClose }: Props) {
  return (
    <Modal isOpen={!!entry} onClose={onClose} title="Detalle de Entrada" size="md">
      {entry && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Row label="Material" value={entry.material.nombre} />
            <Row label="Unidad" value={entry.material.unidad} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Row label="Cantidad" value={formatNumber(entry.cantidad)} />
            <Row label="Fecha de Entrada" value={formatDate(entry.fechaEntrada)} />
          </div>

          {entry.observacion && (
            <Row label="Observación" value={entry.observacion} />
          )}

          <Row
            label="Registrado por"
            value={`${entry.user.nombre} ${entry.user.apellido}`}
          />
        </div>
      )}
    </Modal>
  );
}
