import { useState, useEffect } from 'react';
import { useProjectReport } from '../../hooks/useReports';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { downloadPdf } from '../../utils/pdf-download';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { formatDate, formatNumber } from '../../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function ProjectConsumptionPage() {
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
  const { data: completedWOs } = useWorkOrders({ page: 1, limit: 100, estado: 'completada' });
  const { data, isLoading } = useProjectReport(selectedWOId);
  const isDark = useIsDark();

  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    color: isDark ? '#f1f5f9' : '#1e293b',
    borderRadius: '8px',
    fontSize: '12px',
  };
  const legendStyle = { fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' };

  const pieData = data?.materials.map(m => ({ name: m.nombre, value: m.cantidadUsada })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Consumo por Proyecto</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Materiales usados por orden de trabajo</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWOId ?? ''}
            onChange={e => setSelectedWOId(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Seleccionar orden de trabajo...</option>
            {completedWOs?.data.map(wo => (
              <option key={wo.id} value={wo.id}>{wo.codigo} — {wo.cliente}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            disabled={!selectedWOId}
            onClick={() => {
              if (selectedWOId && data) {
                downloadPdf(
                  `/reports/export/pdf/project/${selectedWOId}`,
                  `consumo-proyecto-${data.workOrder.codigo}.pdf`,
                );
              }
            }}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {!selectedWOId ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Selecciona una orden de trabajo completada para ver su reporte
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OT Info */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Información de la Orden
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Código:</span>{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{data.workOrder.codigo}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Cliente:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-200">{data.workOrder.cliente}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Inicio:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-200">{formatDate(data.workOrder.fechaInicio)}</span>
                </div>
                {data.workOrder.fechaFin && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Fin:</span>{' '}
                    <span className="text-slate-700 dark:text-slate-200">{formatDate(data.workOrder.fechaFin)}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-slate-400 dark:text-slate-500">Descripción:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-200 break-words">{data.workOrder.descripcion}</span>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Distribución de materiales
              </h2>
              {pieData.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm">
                  Sin materiales consumidos
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent === undefined || percent < 0.04) return null;
                        const angle = midAngle ?? 0;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                        const x = cx + radius * Math.cos(-angle * RADIAN);
                        const y = cy + radius * Math.sin(-angle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#ffffff"
                            fontSize={12}
                            fontWeight="600"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={legendStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Materials table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  {['Material', 'Unidad', 'Cantidad', '%'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.materials.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">{m.nombre}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{m.unidad}</td>
                    <td className="px-6 py-3 text-sm text-slate-800 dark:text-slate-100">{formatNumber(m.cantidadUsada)}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{m.porcentaje.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
