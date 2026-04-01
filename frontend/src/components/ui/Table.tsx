import type { ReactNode } from 'react';
import { HiInbox } from 'react-icons/hi';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function Table<T extends object>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
}: TableProps<T>) {
  const getValue = (row: T, accessor: keyof T | string): unknown => {
    return (row as Record<string, unknown>)[accessor as string];
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
        <thead className="bg-slate-50 dark:bg-slate-700/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor as string}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.accessor as string} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <HiInbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <span className="text-sm text-slate-400 dark:text-slate-500">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                {columns.map((col) => {
                  const rawValue = getValue(row, col.accessor);
                  return (
                    <td key={col.accessor as string} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {col.render
                        ? col.render(rawValue, row)
                        : String(rawValue ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
