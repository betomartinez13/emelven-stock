import type { ReactNode } from 'react';
import { useState } from 'react';
import Table, { type Column } from '../ui/Table';
import Pagination from '../ui/Pagination';
import { HiSearch } from 'react-icons/hi';

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: ReactNode;
}

const PAGE_SIZE = 10;

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total,
  page,
  onPageChange,
  isLoading,
  onSearch,
  searchPlaceholder = 'Buscar...',
  emptyMessage,
  actions,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState('');
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch?.(val);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {onSearch && (
          <div className="relative w-full sm:w-72">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {actions && <div className="flex gap-2 ml-auto">{actions}</div>}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
      />

      {/* Footer: count + pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <span>
          {total > 0
            ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total} registros`
            : '0 registros'}
        </span>
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
