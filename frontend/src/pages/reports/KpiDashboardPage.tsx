import { useState, useEffect, type ReactNode } from 'react';
import { useKpis } from '../../hooks/useReports';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { formatNumber } from '../../utils/formatters';
import {
  HiCube, HiExclamation, HiX, HiClipboardList,
  HiArrowDown, HiArrowUp, HiShoppingBag, HiCheckCircle, HiFire,
} from 'react-icons/hi';
import { useQueryClient } from '@tanstack/react-query';

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

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconBg: string;
  description?: string;
  highlight?: boolean;
  highlightActive?: boolean;
}

function KpiCard({ label, value, icon, iconBg, description, highlight, highlightActive }: KpiCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-5 shadow-sm transition-colors ${
      highlight && highlightActive
        ? 'border-red-200 dark:border-red-800'
        : 'border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-extrabold ${
        highlight && highlightActive
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-800 dark:text-slate-100'
      }`}>
        {value}
      </p>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export default function KpiDashboardPage() {
  const { data, isLoading } = useKpis();
  const qc = useQueryClient();
  useIsDark(); // kept for potential future chart usage

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">KPI Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Indicadores clave del inventario</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['reports', 'kpi'] })}>
          Actualizar
        </Button>
      </div>

      {/* Row 1: Stock KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Materiales"
          value={data?.totalMateriales ?? 0}
          icon={<HiCube className="w-5 h-5 text-white" />}
          iconBg="bg-blue-500"
        />
        <KpiCard
          label="Stock Bajo"
          value={data?.materialesConStockBajo ?? 0}
          icon={<HiExclamation className="w-5 h-5 text-white" />}
          iconBg={(data?.materialesConStockBajo ?? 0) > 0 ? 'bg-yellow-500' : 'bg-slate-400'}
          highlight
          highlightActive={(data?.materialesConStockBajo ?? 0) > 0}
          description="Por debajo del mínimo"
        />
        <KpiCard
          label="Sin Stock"
          value={data?.materialesSinStock ?? 0}
          icon={<HiX className="w-5 h-5 text-white" />}
          iconBg={(data?.materialesSinStock ?? 0) > 0 ? 'bg-red-500' : 'bg-slate-400'}
          highlight
          highlightActive={(data?.materialesSinStock ?? 0) > 0}
          description="Stock en cero"
        />
        <KpiCard
          label="OTs Activas"
          value={data?.ordenesActivas ?? 0}
          icon={<HiClipboardList className="w-5 h-5 text-white" />}
          iconBg="bg-indigo-500"
          description="En progreso"
        />
      </div>

      {/* Row 2: Monthly activity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Entradas este mes"
          value={data?.entradasDelMes ?? 0}
          icon={<HiArrowDown className="w-5 h-5 text-white" />}
          iconBg="bg-emerald-500"
          description="Movimientos de entrada"
        />
        <KpiCard
          label="Salidas este mes"
          value={data?.salidasDelMes ?? 0}
          icon={<HiArrowUp className="w-5 h-5 text-white" />}
          iconBg="bg-rose-500"
          description="Movimientos de salida"
        />
        <KpiCard
          label="Ventas este mes"
          value={data?.ventasMes ?? 0}
          icon={<HiShoppingBag className="w-5 h-5 text-white" />}
          iconBg="bg-blue-500"
          description="Transacciones"
        />
        <KpiCard
          label="OTs completadas"
          value={data?.ordenesCompletadasMes ?? 0}
          icon={<HiCheckCircle className="w-5 h-5 text-white" />}
          iconBg="bg-teal-500"
          description="Finalizadas este mes"
        />
      </div>

      {/* Top material del mes */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <HiFire className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Material más consumido este mes
          </h2>
        </div>
        {data?.materialMasConsumido ? (
          <div className="flex items-end gap-4">
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {data.materialMasConsumido.nombre}
            </p>
            <p className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              {formatNumber(data.materialMasConsumido.cantidad)}{' '}
              <span className="text-sm font-normal">{data.materialMasConsumido.unidad}</span>
            </p>
          </div>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Sin datos de consumo para este mes
          </p>
        )}
      </div>
    </div>
  );
}
