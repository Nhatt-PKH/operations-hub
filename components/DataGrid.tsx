
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DataRow, ColumnDefinition, TARGET_COLUMN_NAMES } from '../types';
import { Search, Download, ArrowUpDown, ChevronLeft, ChevronRight, Settings, Check, X, Filter, ChevronDown, XCircle, LayoutTemplate } from 'lucide-react';
import { exportToCSV } from '../services/dataService';

interface DataGridProps {
  data: DataRow[];
  columns: ColumnDefinition[];
  defaultVisibleColumns?: string[];
  filterHeaders?: string[];
  primarySearchColumn?: { header: string; label: string };
  additionalSearchColumns?: { header: string; label: string }[];
  exportFileNamePrefix?: string;
}

const ROWS_PER_PAGE = 200;

// --- Helper Components ---

// 1. Excel-like Filter Dropdown
const ExcelColumnFilter = ({ 
  label, 
  options, 
  selectedValues, 
  onChange 
}: { 
  label: string; 
  options: string[]; 
  selectedValues: string[]; 
  onChange: (values: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleValue = (val: string) => {
    const newSelected = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === filteredOptions.length && filteredOptions.length > 0) {
      // Deselect all visible
      const visibleSet = new Set(filteredOptions);
      onChange(selectedValues.filter(v => !visibleSet.has(v)));
    } else {
      // Select all visible
      const currentSet = new Set(selectedValues);
      filteredOptions.forEach(opt => currentSet.add(opt));
      onChange(Array.from(currentSet));
    }
  };

  const isAllSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedValues.includes(opt));
  const activeCount = selectedValues.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full min-w-[160px] max-w-[200px] px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 transition-colors ${activeCount > 0 ? 'border-wood-500 ring-1 ring-wood-200' : 'border-slate-200'}`}
      >
        <div className="flex flex-col items-start truncate mr-2">
          <span className="text-[9px] text-black font-bold uppercase tracking-wider">{label}</span>
          <span className="truncate font-medium text-slate-700 w-full text-left">
            {activeCount === 0 ? 'Tất cả' : `${activeCount} đã chọn`}
          </span>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[400px]">
          <div className="p-2 border-b border-slate-100">
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-wood-400 bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 hover:text-wood-600">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-wood-600 focus:ring-wood-500"
              />
              (Chọn tất cả)
            </label>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
               <div className="p-2 text-xs text-slate-400 text-center">Không tìm thấy dữ liệu</div>
            ) : (
              filteredOptions.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-wood-50 rounded text-sm text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={selectedValues.includes(opt)}
                    onChange={() => toggleValue(opt)}
                    className="rounded border-slate-300 text-wood-600 focus:ring-wood-500"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-100 flex justify-end">
             <button 
               onClick={() => setIsOpen(false)}
               className="px-3 py-1 bg-wood-600 text-white text-xs rounded hover:bg-wood-700 transition-colors"
             >
               Đóng
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

const DataGrid: React.FC<DataGridProps> = ({ 
  data, 
  columns, 
  defaultVisibleColumns = [], 
  filterHeaders = [],
  primarySearchColumn = { header: TARGET_COLUMN_NAMES.HEX, label: 'Mã HEX (Tìm nhiều)' },
  additionalSearchColumns = [],
  exportFileNamePrefix = 'data'
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // View Mode State
  const [isDefaultView, setIsDefaultView] = useState(true);

  // Show/Hide Columns State
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  // Advanced Filters State
  const [primaryFilterValue, setPrimaryFilterValue] = useState('');
  // State for additional search columns (e.g. SỐ PO)
  const [additionalSearchValues, setAdditionalSearchValues] = useState<Record<string, string>>({});
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string[]>>({});

  // Generate a stable hash/string for defaultVisibleColumns to avoid infinite loop
  const defaultColsHash = defaultVisibleColumns ? defaultVisibleColumns.join(',') : '';

  // Apply default columns on initial load if columns exist
  useEffect(() => {
    if (columns.length > 0 && isDefaultView) {
      applyDefaultView();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, defaultColsHash, isDefaultView]); 

  const applyDefaultView = () => {
    setIsDefaultView(true);
    
    // If no default columns provided, show all
    if (!defaultVisibleColumns || defaultVisibleColumns.length === 0) {
        setHiddenColumns([]);
        return;
    }

    // Find all columns that are NOT in the default list
    const allColumnKeys = columns.map(c => c.key);
    
    const columnsToHide = allColumnKeys.filter(key => {
        const normalizedKey = key.replace(/\n/g, ' ').trim();
        // Check loosely against the default list
        return !defaultVisibleColumns.some(def => def === key || def.replace(/\n/g, ' ').trim() === normalizedKey);
    });
    setHiddenColumns(columnsToHide);
  };

  // Manual toggle switches off default view mode
  const toggleColumnVisibility = (key: string) => {
    if (isDefaultView) {
        setIsDefaultView(false);
    }
    const newHidden = hiddenColumns.includes(key)
      ? hiddenColumns.filter(k => k !== key)
      : [...hiddenColumns, key];
    setHiddenColumns(newHidden);
  };

  // Close Column Menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Identify Key Columns ---
  const getColumnKey = (exactName: string) => {
    return columns.find(c => c.key === exactName)?.key || '';
  };

  const primaryKey = useMemo(() => getColumnKey(primarySearchColumn.header), [columns, primarySearchColumn.header]);

  // --- Extract Unique Options for Excel Filters ---
  const getUniqueOptions = (key: string) => {
    if (!key) return [];
    const set = new Set(data.map(d => String(d[key] || '').trim()).filter(Boolean));
    return Array.from(set).sort();
  };

  // --- Data Processing ---
  const visibleColumns = useMemo(() => {
    if (isDefaultView && defaultVisibleColumns.length > 0) {
        // In default view, we enforce the specific order and visibility
        const orderedCols: ColumnDefinition[] = [];
        defaultVisibleColumns.forEach(defKey => {
            const match = columns.find(c => c.key === defKey || c.key.replace(/\n/g, ' ').trim() === defKey.replace(/\n/g, ' ').trim());
            if (match) orderedCols.push(match);
        });
        return orderedCols;
    }
    // In custom view or empty default, we use CSV order but respect hidden columns
    return columns.filter(c => !hiddenColumns.includes(c.key));
  }, [columns, hiddenColumns, isDefaultView, defaultVisibleColumns]);

  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Global Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(row => 
        visibleColumns.some(col => 
          String(row[col.key] || '').toLowerCase().includes(lowerTerm)
        )
      );
    }

    // 2. Primary Filter (Multi-search)
    if (primaryFilterValue && primaryKey) {
      const tokens = primaryFilterValue.toLowerCase().split(/[\s,]+/).filter(t => t.trim().length > 0);
      if (tokens.length > 0) {
        result = result.filter(row => {
          const val = String(row[primaryKey] || '').toLowerCase();
          return tokens.some(token => val.includes(token));
        });
      }
    }

    // 3. Additional Search Columns (Multi-search)
    additionalSearchColumns.forEach(colConfig => {
        const term = String(additionalSearchValues[colConfig.header] || '');
        const colKey = getColumnKey(colConfig.header);
        if (term && colKey) {
            const tokens = term.toLowerCase().split(/[\s,]+/).filter(t => t.trim().length > 0);
            if (tokens.length > 0) {
                 result = result.filter(row => {
                     const val = String(row[colKey] || '').toLowerCase();
                     return tokens.some(token => val.includes(token));
                 });
            }
        }
    });

    // 4. Dynamic Excel Filters
    Object.entries(advancedFilters).forEach(([header, selectedValues]) => {
        // Safe access to array property - Fix: explicit cast for TS
        const safeSelectedValues = selectedValues as string[];
        if (Array.isArray(safeSelectedValues) && safeSelectedValues.length > 0) {
            const key = getColumnKey(header);
            if (key) {
                result = result.filter(row => safeSelectedValues.includes(String(row[key] || '').trim()));
            }
        }
    });

    // 5. Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const comparison = valA < valB ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, visibleColumns, searchTerm, primaryFilterValue, additionalSearchValues, advancedFilters, sortConfig, primaryKey, additionalSearchColumns]);

  // --- Pagination ---
  const totalPages = Math.ceil(processedData.length / ROWS_PER_PAGE);
  const paginatedData = processedData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    const fileName = `${exportFileNamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
    // Export only visible columns
    const exportData = processedData.map(row => {
      const newRow: Record<string, any> = {};
      visibleColumns.forEach(col => {
        newRow[col.label] = row[col.key];
      });
      return newRow;
    });
    exportToCSV(exportData, fileName);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPrimaryFilterValue('');
    setAdditionalSearchValues({});
    setAdvancedFilters({});
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, primaryFilterValue, advancedFilters, additionalSearchValues]);

  // Check if any filter is active
  const hasAdvancedFilters = Object.values(advancedFilters).some((v) => Array.isArray(v) && v.length > 0);
  const hasAdditionalFilters = Object.values(additionalSearchValues).some((v) => v && v.length > 0);
  const isFilterActive = searchTerm !== '' || primaryFilterValue !== '' || hasAdvancedFilters || hasAdditionalFilters;

  return (
    <div className="flex flex-col h-full bg-white md:rounded-tl-2xl shadow-inner overflow-hidden">
      
      {/* --- Main Toolbar --- */}
      <div className="px-4 py-3 border-b border-wood-100 bg-white z-20 sticky top-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tất cả..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wood-400 w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            
            {/* Default Columns Button */}
            {defaultVisibleColumns.length > 0 && (
                <button 
                onClick={applyDefaultView}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${isDefaultView ? 'bg-wood-100 border-wood-300 text-wood-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="Khôi phục cột mặc định"
                >
                <LayoutTemplate size={16} />
                <span className="hidden sm:inline">Cột mặc định</span>
                </button>
            )}

            {/* Show/Hide Columns Button */}
            <div className="relative" ref={colMenuRef}>
              <button 
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${!isDefaultView && hiddenColumns.length > 0 ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="Tùy chỉnh cột hiển thị"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Cột hiển thị</span>
              </button>

              {isColumnMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[400px] flex flex-col">
                  <div className="p-3 border-b border-slate-100 font-semibold text-slate-700 flex justify-between items-center">
                    <span>Chọn cột hiển thị</span>
                    <button onClick={() => setIsColumnMenuOpen(false)}><X size={16} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                    {columns.map(col => (
                      <label key={col.key} className="flex items-center gap-3 p-2 hover:bg-wood-50 rounded cursor-pointer">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!hiddenColumns.includes(col.key) ? 'bg-wood-600 border-wood-600' : 'border-slate-300 bg-white'}`}>
                          {!hiddenColumns.includes(col.key) && <Check size={14} className="text-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={!hiddenColumns.includes(col.key)}
                          onChange={() => toggleColumnVisibility(col.key)}
                        />
                        <span className="text-sm text-slate-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between">
                     <button onClick={() => setHiddenColumns([])} className="text-xs text-wood-600 hover:underline px-2">Hiện tất cả</button>
                     <button onClick={() => setHiddenColumns(columns.map(c => c.key))} className="text-xs text-slate-500 hover:underline px-2">Ẩn tất cả</button>
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-wood-600 text-white rounded-lg hover:bg-wood-700 transition-colors shadow-sm text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- Advanced Filter Bar --- */}
      <div className="px-4 py-3 bg-slate-50 border-b border-wood-100 z-10 flex flex-wrap gap-3 items-end">
        
        {/* Primary Filter */}
        <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[180px]">
          <label className="text-[10px] text-black font-bold uppercase tracking-wider">{primarySearchColumn.label}</label>
          <div className="relative">
             <input
               type="text"
               placeholder="Nhập giá trị..."
               className="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wood-400 focus:border-wood-400"
               value={primaryFilterValue}
               onChange={(e) => setPrimaryFilterValue(e.target.value)}
             />
          </div>
        </div>

        {/* Additional Search Filters */}
        {additionalSearchColumns.map((colConfig, idx) => (
             <div key={`add-search-${idx}`} className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[180px]">
                <label className="text-[10px] text-black font-bold uppercase tracking-wider">{colConfig.label}</label>
                <div className="relative">
                   <input
                     type="text"
                     placeholder="Nhập giá trị..."
                     className="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wood-400 focus:border-wood-400"
                     value={additionalSearchValues[colConfig.header] || ''}
                     onChange={(e) => setAdditionalSearchValues(prev => ({ ...prev, [colConfig.header]: e.target.value }))}
                   />
                </div>
             </div>
        ))}

        {isFilterActive && (
           <button 
             onClick={clearAllFilters}
             className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium pb-2 ml-auto sm:ml-0"
           >
             <XCircle size={14} /> Xóa bộ lọc
           </button>
        )}
      </div>

      {/* --- Table --- */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-slate-200 w-10 text-center">#</th>
              {visibleColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 border-b border-slate-200 whitespace-nowrap group">
                  <div className="flex flex-col gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <ArrowUpDown size={12} className={`text-slate-400 ${sortConfig?.key === col.key ? 'text-wood-600 opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                    </div>
                    {/* Excel Filter Dropdown */}
                    {filterHeaders?.includes(col.key) && (
                       <ExcelColumnFilter 
                          label="Lọc"
                          options={getUniqueOptions(col.key)}
                          selectedValues={(advancedFilters[col.key] as string[]) ?? []}
                          onChange={(vals) => setAdvancedFilters(prev => ({ ...prev, [col.key]: vals }))}
                       />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-wood-50 transition-colors">
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">{(currentPage - 1) * ROWS_PER_PAGE + rowIndex + 1}</td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {/* Basic rendering, can be enhanced for dates/numbers */}
                        {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-slate-500">
                  Không tìm thấy dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Footer / Pagination --- */}
      <div className="px-4 py-3 border-t border-wood-100 bg-slate-50 flex items-center justify-between text-xs font-medium text-slate-500">
         <div>
            Hiển thị {paginatedData.length} / {processedData.length} dòng
         </div>
         {totalPages > 1 && (
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-slate-200 hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-slate-200 hover:bg-white disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
             </div>
         )}
      </div>
    </div>
  );
};

export default DataGrid;
