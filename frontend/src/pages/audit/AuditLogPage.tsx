import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HiEye } from 'react-icons/hi';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useAuthStore } from '../../stores/auth.store';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/ui/Modal';
import { formatDateTime } from '../../utils/formatters';
import type { AuditLog, AuditAction } from '../../types/audit.types';
import type { Column } from '../../components/ui/Table';

const ACTION_CONFIG: Record<AuditAction, { label: string; color: string }> = {
  CREATE: { label: 'Creación',      color: 'bg-emerald-100 text-emerald-800' },
  UPDATE: { label: 'Actualización', color: 'bg-yellow-100 text-yellow-800' },
  DELETE: { label: 'Eliminación',   color: 'bg-red-100 text-red-800' },
};

const ENTITY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Material',        value: 'Material' },
  { label: 'Proveedor',       value: 'Supplier' },
  { label: 'Categoría',       value: 'Category' },
  { label: 'Usuario',         value: 'User' },
  { label: 'Inventario',      value: 'Inventory' },
  { label: 'Orden de Trabajo', value: 'WorkOrder' },
  { label: 'Venta',           value: 'Sale' },
];

const SELECT_CLASS =
  'text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-medium text-slate-700 dark:text-slate-200 ' +
  'bg-white dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';

interface JsonBlockProps {
  label: string;
  data: Record<string, unknown> | null;
  emptyText: string;
}

function JsonBlock({ label, data, emptyText }: JsonBlockProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {data ? (
        <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm font-mono text-slate-700 dark:text-slate-300 shadow-inner overflow-auto max-h-64 whitespace-pre-wrap break-all leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm text-slate-400 dark:text-slate-500 italic">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const user = useAuthStore(s => s.user);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entidad, setEntidad] = useState('');
  const [accion, setAccion] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading } = useAuditLog({
    page,
    limit: 10,
    search,
    entidad: entidad || undefined,
    accion: (accion as AuditAction) || undefined,
  });

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const columns: Column<AuditLog>[] = [
    {
      accessor: 'fecha',
      header: 'Fecha',
      render: (_, a) => (
        <span className="text-slate-600 dark:text-slate-300 font-medium tabular-nums">{formatDateTime(a.fecha)}</span>
      ),
    },
    {
      accessor: 'user',
      header: 'Usuario',
      render: (_, a) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100">{a.user.nombre} {a.user.apellido}</span>
      ),
    },
    {
      accessor: 'entidad',
      header: 'Entidad',
      render: (_, a) => <span className="text-slate-600 dark:text-slate-300 font-medium">{a.entidad}</span>,
    },
    {
      accessor: 'accion',
      header: 'Acción',
      render: (_, a) => {
        const cfg = ACTION_CONFIG[a.accion];
        return (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      accessor: 'detalle',
      header: '',
      render: (_, a) => (
        <button
          onClick={() => setSelected(a)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Ver cambios"
        >
          <HiEye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Registro de Auditoría</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <select
          value={entidad}
          onChange={e => { setEntidad(e.target.value); setPage(1); }}
          className={SELECT_CLASS}
        >
          <option value="">Todas las entidades</option>
          {ENTITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={accion}
          onChange={e => { setAccion(e.target.value); setPage(1); }}
          className={SELECT_CLASS}
        >
          <option value="">Todas las acciones</option>
          <option value="CREATE">Creación</option>
          <option value="UPDATE">Actualización</option>
          <option value="DELETE">Eliminación</option>
        </select>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onSearch={q => { setSearch(q); setPage(1); }}
        searchPlaceholder="Buscar por usuario o entidad..."
        emptyMessage="No hay registros de auditoría"
      />

      {/* Modal de detalle */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Detalle del cambio"
        size="xl"
      >
        {selected && (
          <div className="space-y-5">
            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Entidad',  value: selected.entidad },
                { label: 'Acción',   value: ACTION_CONFIG[selected.accion].label },
                { label: 'Usuario',  value: `${selected.user.nombre} ${selected.user.apellido}` },
                { label: 'Fecha',    value: formatDateTime(selected.fecha) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">{value}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700" />

            {/* JSON antes / después */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <JsonBlock
                label="Antes"
                data={selected.datosAntes}
                emptyText={selected.accion === 'CREATE' ? 'Sin datos anteriores — registro nuevo' : 'Sin datos'}
              />
              <JsonBlock
                label="Después"
                data={selected.datosDespues}
                emptyText={selected.accion === 'DELETE' ? 'Sin datos posteriores — registro eliminado' : 'Sin datos'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
