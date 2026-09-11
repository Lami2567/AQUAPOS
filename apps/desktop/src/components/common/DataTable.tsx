import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Building2,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (item: T) => any;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  dateField?: boolean;
  branchField?: boolean;
  statusField?: boolean;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  branchOptions?: { id: string; name: string }[];
  statusOptions?: { code: string; label: string }[];
  exportFileName?: string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  searchPlaceholder = 'Search records...',
  branchOptions = [],
  statusOptions = [],
  exportFileName = 'export-data',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Column Visibility Toggle
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = columns.some((col) => {
          const val = col.accessor(item);
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // 2. Date Range Filter
      if (startDate || endDate) {
        const dateCol = columns.find((c) => c.dateField);
        if (dateCol) {
          const val = dateCol.accessor(item);
          if (val) {
            const itemDate = new Date(val).getTime();
            if (startDate && itemDate < new Date(startDate).getTime()) return false;
            if (endDate && itemDate > new Date(endDate + 'T23:59:59').getTime()) return false;
          }
        }
      }

      // 3. Branch Filter
      if (selectedBranch !== 'ALL') {
        const branchCol = columns.find((c) => c.branchField);
        if (branchCol) {
          const val = String(branchCol.accessor(item));
          if (val !== selectedBranch) return false;
        }
      }

      // 4. Status Filter
      if (selectedStatus !== 'ALL') {
        const statusCol = columns.find((c) => c.statusField);
        if (statusCol) {
          const val = String(statusCol.accessor(item));
          if (val !== selectedStatus) return false;
        }
      }

      return true;
    });
  }, [data, columns, searchQuery, startDate, endDate, selectedBranch, selectedStatus]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = col.accessor(a);
      const valB = col.accessor(b);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleHeaderClick = (colKey: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === colKey) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else setSortKey(null);
    } else {
      setSortKey(colKey);
      setSortOrder('asc');
    }
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    const activeCols = columns.filter((c) => visibleColumns[c.key]);
    const headers = activeCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    
    const rows = sortedData.map((item) =>
      activeCols
        .map((c) => {
          const val = c.accessor(item);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0F1B3E]/80 border border-white/15 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
      {/* Title & Top Bar */}
      {(title || description) && (
        <div className="border-b border-white/15 pb-3">
          {title && <h3 className="text-base font-bold text-white">{title}</h3>}
          {description && <p className="text-xs text-white/80 mt-0.5">{description}</p>}
        </div>
      )}

      {/* Control Toolbar: Search, Filters, Column Toggle & Export */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Left Toolbar: Search & Date Range */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] max-w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-white/80 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#070E24] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Date Range Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            />
            <span className="text-white/70">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            />
          </div>

          {/* Branch Filter */}
          {branchOptions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-white/80 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-medium text-xs"
              >
                <option value="ALL" className="bg-[#0F1B3E]">All Branches</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#0F1B3E]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {statusOptions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-white/80 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-medium text-xs"
              >
                <option value="ALL" className="bg-[#0F1B3E]">All Statuses</option>
                {statusOptions.map((s) => (
                  <option key={s.code} value={s.code} className="bg-[#0F1B3E]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Toolbar: Column Visibility & CSV Export */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className="flex items-center gap-1.5 bg-[#070E24] hover:bg-[#182855] border border-white/15 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>

            {showColumnToggle && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0F1B3E] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in space-y-1">
                <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider px-2 py-1 border-b border-white/15">
                  Toggle Columns
                </div>
                {columns.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-white hover:bg-[#182855] rounded-lg transition-all cursor-pointer"
                  >
                    <span>{col.header}</span>
                    {visibleColumns[col.key] && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto rounded-xl border border-white/15/80">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-[#070E24] text-white/80 uppercase text-[10px] tracking-wider select-none">
            <tr>
              {columns
                .filter((col) => visibleColumns[col.key])
                .map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key, col.sortable !== false)}
                    className={`p-3 font-semibold ${col.sortable !== false ? 'cursor-pointer hover:text-white' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span>
                          {sortKey === col.key ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-white" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-white" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-[#0F1B3E]/40">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#182855]/50 transition-all">
                  {columns
                    .filter((col) => visibleColumns[col.key])
                    .map((col) => (
                      <td key={col.key} className="p-3">
                        {col.render ? col.render(item) : col.accessor(item)}
                      </td>
                    ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.filter((c) => visibleColumns[c.key]).length} className="p-8 text-center text-white/70 italic">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-white/80">
        <div className="text-center sm:text-left">
          Showing <span className="font-semibold text-white">{sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-semibold text-white">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
          <span className="font-semibold text-white">{sortedData.length}</span> entries
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#070E24] border border-white/15 rounded-lg px-2 py-1 text-white font-semibold focus:outline-none text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#070E24] border border-white/15 hover:bg-[#182855] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-white whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#070E24] border border-white/15 hover:bg-[#182855] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
