import Modal from '../../components/ui/Modal';
import { formatDate, formatNumber } from '../../utils/formatters';
import type { Sale } from '../../types/sale.types';

interface Props {
  sale: Sale | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase font-medium tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 break-words">{value}</p>
    </div>
  );
}

export default function SaleDetailModal({ sale, onClose }: Props) {
  return (
    <Modal isOpen={!!sale} onClose={onClose} title="Detalle de Venta" size="lg">
      {sale && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Row label="Fecha" value={formatDate(sale.fecha)} />
            <Row label="Cantidad" value={formatNumber(sale.cantidad)} />
          </div>

          <Row label="Cliente" value={sale.cliente} />

          <Row label="Producto / Descripción" value={sale.producto} />

          {sale.workOrder && (
            <Row label="Orden de Trabajo" value={`${sale.workOrder.codigo}${sale.workOrder.descripcion ? ` — ${sale.workOrder.descripcion}` : ''}`} />
          )}

          {sale.observacion && (
            <Row label="Observaciones" value={sale.observacion} />
          )}

          <Row
            label="Registrado por"
            value={`${sale.user.nombre} ${sale.user.apellido}`}
          />
        </div>
      )}
    </Modal>
  );
}
