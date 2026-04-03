import { useState, useEffect } from 'react';
import { useMonthlyReport } from '../../hooks/useReports';
import { downloadPdf } from '../../utils/pdf-download';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { formatNumber } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

export default function MonthlyConsumptionPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useMonthlyReport(year);
  const isDark = useIsDark();

  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    color: isDark ? '#f1f5f9' : '#1e293b',
    borderRadius: '8px',
    fontSize: '12px',
  };
  const legendStyle = { fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' };

  const chartData = MONTH_LABELS.map((label, i) => {
    const entry: Record<string, number | string> = { mes: label };
    data?.items.slice(0, 8).forEach(item => {
      entry[item.nombre] = item.consumoPorMes[i]?.cantidad ?? 0;
    });
    return entry;
  });

  const topItems = data?.items.slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Consumo Mensual</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Materiales consumidos por mes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadPdf(`/reports/export/pdf/monthly?year=${year}`, `consumo-mensual-${year}.pdf`)}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
            {topItems.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 py-12 text-sm">
                Sin datos de consumo para {year}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: tickFill }} />
                  <YAxis tick={{ fontSize: 12, fill: tickFill }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                  {topItems.map((item, i) => (
                    <Bar key={item.nombre} dataKey={item.nombre} fill={COLORS[i % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          {data && data.items.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Material
                    </th>
                    {MONTH_LABELS.map(m => (
                      <th key={m} className="px-2 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {m}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {data.items.map(item => {
                    const total = item.consumoPorMes.reduce((acc, m) => acc + m.cantidad, 0);
                    return (
                      <tr key={item.nombre} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100">{item.nombre}</td>
                        {item.consumoPorMes.map((m, i) => (
                          <td key={i} className="px-2 py-2 text-center text-sm text-slate-600 dark:text-slate-300">
                            {m.cantidad > 0 ? formatNumber(m.cantidad) : '—'}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {formatNumber(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
