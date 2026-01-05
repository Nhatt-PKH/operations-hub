import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DataRow, ColumnDefinition, TARGET_COLUMN_NAMES } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, LabelList
} from 'recharts';
import { CheckCircle, Filter, ChevronDown, XCircle as CloseIcon, Table as TableIcon, Layers, LayoutList, Calculator, Hash, Activity, Package, MinusCircle, Box, ChevronLeft, ChevronRight, CheckSquare, Square, Calendar, DollarSign, ListFilter, Import, BarChart2, PieChart, TrendingUp, AlertCircle, ShoppingCart, FileText, ClipboardList, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  productionData: DataRow[];
  productionColumns: ColumnDefinition[];
  materialData: DataRow[];
  materialColumns: ColumnDefinition[];
  khsxData: DataRow[];
  khsxColumns: ColumnDefinition[];
  inventoryData: DataRow[];
  inventoryColumns: ColumnDefinition[];
  orderData: DataRow[];
  orderColumns: ColumnDefinition[];
  tkbvData: DataRow[];
  tkbvColumns: ColumnDefinition[];
  pthspData: DataRow[];
  pthspColumns: ColumnDefinition[];
}

interface BottleneckItem {
  name: string;
  [key: string]: string | number;
}

interface BottleneckCount {
  name: string;
  count: number;
}

const STATUS_GROUPS = {
  CO_THE_SX: [
    '01. ĐÃ BAO BÌ', '02. BAO BÌ', '03. FITTING', '04. VECNI', '05. MỘC', 
    '06. MÁY', '07. CTS', '08. SOFA', '09. ĐÁ', '10. KIM LOẠI', '11. CHƯA SX'
  ],
  VECNI_FITTING: [
    '01. ĐÃ BAO BÌ', '02. BAO BÌ'
  ],
  CHUYEN_KHAC: [
    '03. FITTING', '04. VECNI', '05. MỘC', '06. MÁY', 
    '07. CTS', '08. SOFA', '09. ĐÁ', '10. KIM LOẠI'
  ],
  CO_PHIEU_CHUA_SX: [
    '11. CHƯA SX'
  ],
  CHUA_THE_SX: [
    '12. CHƯA SX PHẦN CÒN LẠI', '13. CHƯA PHIẾU PHẦN CÒN LẠI', 
    '14. CHƯA PHIẾU', '15. CHƯA TRIỂN KHAI'
  ],
  VUONG_SL: [
    '12. CHƯA SX PHẦN CÒN LẠI', '13. CHƯA PHIẾU PHẦN CÒN LẠI'
  ],
  CHUA_TRIEN_KHAI: [
    '14. CHƯA PHIẾU', '15. CHƯA TRIỂN KHAI'
  ]
};

type MetricType = 'COUNT_HEX' | 'SUM_GT_CON_LAI' | 'SUM_GT_DON_HANG';

// Types for Pivot Data
interface WorkshopPivotData {
  uniqueWorkshops: string[];
  uniqueStatuses: string[];
  matrix: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
}

interface ProjectPivotData {
  uniqueProjects: string[];
  uniqueStatuses: string[];
  matrix: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
}

interface MaterialSummaryPivotData {
  summary: Record<string, { req: number; rec: number }>;
  sortedGroups: string[];
  totalReq: number;
  totalRec: number;
}

interface MaterialStatusPivotData {
  sortedGroups: string[];
  uniqueStatuses: string[];
  matrix: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
}

const MATERIAL_LIST_COLUMNS = [
  TARGET_COLUMN_NAMES.STATUS,
  TARGET_COLUMN_NAMES.CONG_TRINH,
  TARGET_COLUMN_NAMES.SO_PR,
  TARGET_COLUMN_NAMES.TEN_VAT_TU,
  TARGET_COLUMN_NAMES.SL_YEU_CAU,
  TARGET_COLUMN_NAMES.BASE_UNIT,
  TARGET_COLUMN_NAMES.REQUEST_DATE,
  TARGET_COLUMN_NAMES.EST_DELIVERY,
  TARGET_COLUMN_NAMES.SL_DA_NHAN,
  TARGET_COLUMN_NAMES.REMAINING_QTY,
  TARGET_COLUMN_NAMES.TEAM_PR_NOTE,
  TARGET_COLUMN_NAMES.STATUS_PO,
  TARGET_COLUMN_NAMES.NOTE_PO,
  TARGET_COLUMN_NAMES.PR_LINE_COMBINED,
  TARGET_COLUMN_NAMES.ACTUAL_DATE,
  TARGET_COLUMN_NAMES.ACTUAL_QTY,
  TARGET_COLUMN_NAMES.MATERIAL_CODE,
  TARGET_COLUMN_NAMES.REQUISITIONER
];

const DashboardFilter = ({ 
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

  const activeCount = selectedValues.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full min-w-[150px] px-3 py-1.5 text-xs border rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm ${activeCount > 0 ? 'border-wood-500 ring-1 ring-wood-200' : 'border-slate-200'}`}
      >
        <div className="flex flex-col items-start truncate mr-2">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
          <span className="truncate font-medium text-slate-700 w-full text-left">
            {activeCount === 0 ? 'Tất cả' : `${activeCount} đã chọn`}
          </span>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[300px]">
          <div className="p-2 border-b border-slate-100">
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-wood-400 bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
               <div className="p-2 text-xs text-slate-400 text-center">Không tìm thấy</div>
            ) : (
              filteredOptions.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-wood-50 rounded text-xs text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={selectedValues.includes(opt)}
                    onChange={() => toggleValue(opt)}
                    className="rounded border-slate-300 text-wood-600 focus:ring-wood-500 w-3.5 h-3.5"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricSwitcher = ({ current, onChange }: { current: MetricType, onChange: (m: MetricType) => void }) => (
  <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
    <button 
      onClick={() => onChange('COUNT_HEX')}
      className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${current === 'COUNT_HEX' ? 'bg-white text-wood-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      title="Đếm số lượng HEX"
    >
      <Hash size={12}/> Số lượng hạng mục
    </button>
    <div className="w-px h-3 bg-slate-300 mx-1"></div>
    <button 
      onClick={() => onChange('SUM_GT_CON_LAI')}
      className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${current === 'SUM_GT_CON_LAI' ? 'bg-white text-wood-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      title="Tổng Giá Trị Còn Lại"
    >
      <Calculator size={12}/> Tổng GT còn lại (theo PTHSP)
    </button>
    <div className="w-px h-3 bg-slate-300 mx-1"></div>
    <button 
      onClick={() => onChange('SUM_GT_DON_HANG')}
      className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${current === 'SUM_GT_DON_HANG' ? 'bg-white text-wood-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      title="Tổng Giá Trị Đơn Hàng Còn Lại"
    >
      <Calculator size={12}/> Tổng GT Đơn hàng còn lại
    </button>
  </div>
);

const parseVNDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split(/[\/\-\.]/); // Split by /, -, or .
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; 
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return date;
      }
    }
  }
  return null;
};

const diffDays = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1); d1.setHours(0,0,0,0);
  const d2 = new Date(date2); d2.setHours(0,0,0,0);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper for Date Range Display
const getDateRangeDisplay = (filters: string[], options: string[]) => {
    const datesToUse = filters.length > 0 ? filters : options;
    if (datesToUse.length === 0) return '';
    
    const validDates = datesToUse
        .map(d => parseVNDate(d))
        .filter((d): d is Date => d !== null);

    if (validDates.length === 0) return '';

    const minDate = new Date(Math.min(...validDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...validDates.map(d => d.getTime())));

    const fmt = (d: Date) => `0${d.getDate()}`.slice(-2) + '/' + `0${d.getMonth() + 1}`.slice(-2) + '/' + d.getFullYear();

    if (minDate.getTime() === maxDate.getTime()) {
        return `(${fmt(minDate)})`;
    }
    return `(${fmt(minDate)} - ${fmt(maxDate)})`;
};

const Dashboard: React.FC<DashboardProps> = ({ 
  productionData, 
  productionColumns, 
  materialData, 
  materialColumns, 
  khsxData, 
  khsxColumns,
  inventoryData, 
  inventoryColumns,
  orderData, 
  orderColumns,
  tkbvData, 
  tkbvColumns,
  pthspData, 
  pthspColumns
}) => {
  const pivotWorkshopRef = useRef<HTMLDivElement>(null);
  const pivotProjectRef = useRef<HTMLDivElement>(null);
  const pivotMaterialRef = useRef<HTMLDivElement>(null);
  const pivotMaterialStatusRef = useRef<HTMLDivElement>(null);
  const materialListRef = useRef<HTMLDivElement>(null);
  const khsxSectionRef = useRef<HTMLDivElement>(null);
  const inventorySectionRef = useRef<HTMLDivElement>(null);
  const projectSummaryRef = useRef<HTMLDivElement>(null);
  const orderOverviewRef = useRef<HTMLDivElement>(null);
  const bottleneckSectionRef = useRef<HTMLDivElement>(null);
  
  const hasInitializedOverviewDate = useRef(false);

  const findColumnKey = (cols: ColumnDefinition[], target: string) => {
    if (!cols || cols.length === 0) return target;
    const t = target.trim().toLowerCase();
    const match = cols.find(c => c.key.trim().toLowerCase() === t || c.label.trim().toLowerCase() === t);
    return match ? match.key : target;
  };

  // Production Keys
  const hexKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.HEX);
  const tinhTrangKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.TINH_TRANG);
  const tinhTrangIpoKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.TINH_TRANG_IPO); 
  const valueKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.GIA_TRI_CON_LAI); 
  const realValueKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.GIA_TRI_THUC_TE); 
  const congTrinhKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.CONG_TRINH);
  const xuongKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.XUONG);
  const hangMucKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.TEN_HANG_MUC);
  const daysAtCurrentStageKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.SO_NGAY_CD_HIEN_TAI);
  
  // NEW KEYS for Summary
  const triGiaDonHangTongKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.TRI_GIA_DON_HANG_TONG);
  const thanhTienTinhPhieuKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.THANH_TIEN_TINH_PHIEU);
  const thanhTienNhapKhoKey = findColumnKey(productionColumns, TARGET_COLUMN_NAMES.THANH_TIEN_NHAP_KHO);

  // Material Keys
  const matCongTrinhKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.CONG_TRINH);
  const matNhomVtKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.NHOM_VT);
  const matSlYeuCauKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.SL_YEU_CAU);
  const matSlDaNhanKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.SL_DA_NHAN);
  
  const matStatusKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.STATUS);
  const matStatusSapKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.STATUS_SAP);
  
  const matEstDateKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.EST_DELIVERY);
  const matPrLineKey = findColumnKey(materialColumns, TARGET_COLUMN_NAMES.PR_LINE_COMBINED);

  // KHSX Keys
  const khsxXuongKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.XUONG);
  const khsxCongTrinhKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.CONG_TRINH);
  const khsxMaCongTrinhKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.MA_CONG_TRINH);
  const khsxThanhTienKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.THANH_TIEN_KE_HOACH);
  const khsxPhanLoaiKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.PHAN_LOAI_KH);
  const khsxNamKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.NAM);
  const khsxThangKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.THANG);
  const khsxNgayKey = findColumnKey(khsxColumns, TARGET_COLUMN_NAMES.NGAY);

  // Inventory Keys
  const invThanhTienKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.INVENTORY_AMOUNT);
  const invXuongKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.XUONG);
  const invCongTrinhKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.CONG_TRINH);
  const invMaCongTrinhKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.MA_CONG_TRINH);
  const invNamKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.NAM);
  const invThangKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.THANG);
  const invNgayKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.NGAY);
  const invDateKey = findColumnKey(inventoryColumns, TARGET_COLUMN_NAMES.DATE);

  // Order Keys
  const orderHexKey = findColumnKey(orderColumns, TARGET_COLUMN_NAMES.HEX);
  const orderDateKey = findColumnKey(orderColumns, TARGET_COLUMN_NAMES.NGAY_NHAN_TU_PM);
  const orderValueKey = findColumnKey(orderColumns, TARGET_COLUMN_NAMES.TRI_GIA_DON_HANG_TONG);

  // TKBV Keys
  const tkbvDateKey = findColumnKey(tkbvColumns, TARGET_COLUMN_NAMES.NGAY_NHAN);
  const tkbvValueKey = findColumnKey(tkbvColumns, TARGET_COLUMN_NAMES.TRI_GIA_DON_HANG_TONG); 

  // PTHSP Keys
  const pthspDateKey = findColumnKey(pthspColumns, TARGET_COLUMN_NAMES.NGAY_HOAN_THANH);
  const pthspValueKey = findColumnKey(pthspColumns, TARGET_COLUMN_NAMES.TRI_GIA_DON_HANG_TONG);

  // Filters State
  const [filters, setFilters] = useState<{
    congTrinh: string[];
    xuong: string[];
    tinhTrang: string[];
    tinhTrangIpo: string[]; 
  }>({
    congTrinh: [],
    xuong: [],
    tinhTrang: [],
    tinhTrangIpo: ['SẢN XUẤT'] 
  });

  // --- UNIFIED KHSX & INVENTORY FILTERS ---
  const [unifiedTimeFilters, setUnifiedTimeFilters] = useState<{
    nam: string[];
    thang: string[];
    ngay: string[];
  }>({
    nam: [new Date().getFullYear().toString()],
    thang: [(new Date().getMonth() + 1).toString()], // Default to current month
    ngay: []
  });

  // Specific Filter for KHSX
  const [khsxPhanLoaiFilter, setKhsxPhanLoaiFilter] = useState<string[]>(['THÁNG 01/2026']);

  // UNIFIED OVERVIEW DATE FILTER
  const [overviewDateFilters, setOverviewDateFilters] = useState<string[]>([]);
  
  // Single Global Metric for Overview Cards
  const [overviewMetric, setOverviewMetric] = useState<'COUNT' | 'SUM'>('COUNT');

  // Interactive Material Selection
  const [selectedMaterialGroups, setSelectedMaterialGroups] = useState<string[]>([]);

  const [workshopMetric, setWorkshopMetric] = useState<MetricType>('SUM_GT_DON_HANG');
  const [projectMetric, setProjectMetric] = useState<MetricType>('SUM_GT_DON_HANG');
  const [chartMetric, setChartMetric] = useState<MetricType>('SUM_GT_DON_HANG');

  const [matStatusMetric, setMatStatusMetric] = useState<'COUNT_PR' | 'SUM_QTY'>('COUNT_PR');

  const [excludeFabrics, setExcludeFabrics] = useState(false);

  const [materialListPage, setMaterialListPage] = useState(1);
  const MATERIAL_ITEMS_PER_PAGE = 15;

  // Options Helpers
  const getUniqueOptions = (data: DataRow[], key: string | undefined) => {
    if (!key) return [];
    const set = new Set(data.map(d => String(d[key] || '').trim()).filter(Boolean));
    return Array.from(set).sort();
  };

  const congTrinhOptions = useMemo(() => getUniqueOptions(productionData, congTrinhKey), [productionData, congTrinhKey]);
  const xuongOptions = useMemo(() => getUniqueOptions(productionData, xuongKey), [productionData, xuongKey]);
  const tinhTrangOptions = useMemo(() => getUniqueOptions(productionData, tinhTrangKey), [productionData, tinhTrangKey]);
  const tinhTrangIpoOptions = useMemo(() => getUniqueOptions(productionData, tinhTrangIpoKey), [productionData, tinhTrangIpoKey]);

  const khsxPhanLoaiOptions = useMemo(() => getUniqueOptions(khsxData, khsxPhanLoaiKey), [khsxData, khsxPhanLoaiKey]);
  const khsxNamOptions = useMemo(() => getUniqueOptions(khsxData, khsxNamKey), [khsxData, khsxNamKey]);
  const khsxThangOptions = useMemo(() => getUniqueOptions(khsxData, khsxThangKey), [khsxData, khsxThangKey]);
  const khsxNgayOptions = useMemo(() => getUniqueOptions(khsxData, khsxNgayKey), [khsxData, khsxNgayKey]);

  const invNamOptions = useMemo(() => getUniqueOptions(inventoryData, invNamKey), [inventoryData, invNamKey]);
  const invThangOptions = useMemo(() => getUniqueOptions(inventoryData, invThangKey), [inventoryData, invThangKey]);
  const invNgayOptions = useMemo(() => getUniqueOptions(inventoryData, invNgayKey), [inventoryData, invNgayKey]);

  // UNIFIED OPTIONS (KHSX + INVENTORY)
  const unifiedNamOptions = useMemo(() => {
      const s = new Set([...khsxNamOptions, ...invNamOptions]);
      return Array.from(s).sort().reverse(); // Years usually desc
  }, [khsxNamOptions, invNamOptions]);

  const unifiedThangOptions = useMemo(() => {
      const s = new Set([...khsxThangOptions, ...invThangOptions]);
      return Array.from(s).sort((a,b) => parseInt(a) - parseInt(b));
  }, [khsxThangOptions, invThangOptions]);

  const unifiedNgayOptions = useMemo(() => {
      const s = new Set([...khsxNgayOptions, ...invNgayOptions]);
      // Sort numerically instead of alphabetically
      return Array.from(s).sort((a, b) => {
          const valA = parseInt(a);
          const valB = parseInt(b);
          if (!isNaN(valA) && !isNaN(valB)) {
              return valA - valB;
          }
          return a.localeCompare(b);
      });
  }, [khsxNgayOptions, invNgayOptions]);

  // UNIFIED DATE OPTIONS CALCULATION
  const unifiedDateOptions = useMemo(() => {
    const dates = new Set<string>();
    const addDates = (data: DataRow[], key: string | undefined) => {
        if(!key) return;
        data.forEach(row => {
            const val = String(row[key] || '').trim();
            if(val) dates.add(val);
        });
    }
    addDates(orderData, orderDateKey);
    addDates(tkbvData, tkbvDateKey);
    addDates(pthspData, pthspDateKey);
    addDates(inventoryData, invDateKey);

    return Array.from(dates).sort((a, b) => {
        const dateA = parseVNDate(a);
        const dateB = parseVNDate(b);
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        return b.localeCompare(a);
    });
  }, [orderData, tkbvData, pthspData, inventoryData, orderDateKey, tkbvDateKey, pthspDateKey, invDateKey]);

  // Display Strings for Overview Header
  const overviewDateRangeDisplay = useMemo(() => getDateRangeDisplay(overviewDateFilters, unifiedDateOptions), [overviewDateFilters, unifiedDateOptions]);

  // Init Unified Date Filter
  useEffect(() => {
    if (!hasInitializedOverviewDate.current && unifiedDateOptions.length > 0) {
        setOverviewDateFilters([unifiedDateOptions[0]]);
        hasInitializedOverviewDate.current = true;
    }
  }, [unifiedDateOptions]);

  // --- Filter Logic ---

  const filteredProductionData = useMemo(() => {
    return productionData.filter(row => {
      const matchCongTrinh = filters.congTrinh.length === 0 || (congTrinhKey && filters.congTrinh.includes(String(row[congTrinhKey] || '').trim()));
      const matchXuong = filters.xuong.length === 0 || (xuongKey && filters.xuong.includes(String(row[xuongKey] || '').trim()));
      const matchTinhTrang = filters.tinhTrang.length === 0 || (tinhTrangKey && filters.tinhTrang.includes(String(row[tinhTrangKey] || '').trim()));
      const matchTinhTrangIpo = filters.tinhTrangIpo.length === 0 || (tinhTrangIpoKey && filters.tinhTrangIpo.includes(String(row[tinhTrangIpoKey] || '').trim()));
      
      return matchCongTrinh && matchXuong && matchTinhTrang && matchTinhTrangIpo;
    });
  }, [productionData, filters, congTrinhKey, xuongKey, tinhTrangKey, tinhTrangIpoKey]);

  const filteredMaterialData = useMemo(() => {
    return materialData.filter(row => {
        const matchCongTrinh = filters.congTrinh.length === 0 || (matCongTrinhKey && filters.congTrinh.includes(String(row[matCongTrinhKey] || '').trim()));
        return matchCongTrinh;
    });
  }, [materialData, filters.congTrinh, matCongTrinhKey]);

  const displayedMaterialData = useMemo(() => {
    if (selectedMaterialGroups.length === 0) return filteredMaterialData;
    return filteredMaterialData.filter(row => {
        const group = String(row[matNhomVtKey] || 'Chưa phân nhóm').trim();
        return selectedMaterialGroups.includes(group);
    });
  }, [filteredMaterialData, selectedMaterialGroups, matNhomVtKey]);

  // --- OVERVIEW DATA FILTERED BY UNIFIED DATE ---
  
  const filteredOrderData = useMemo(() => {
    if (overviewDateFilters.length === 0) return orderData;
    return orderData.filter(row => {
        return orderDateKey && overviewDateFilters.includes(String(row[orderDateKey] || '').trim());
    });
  }, [orderData, overviewDateFilters, orderDateKey]);

  const filteredTkbvData = useMemo(() => {
    if (overviewDateFilters.length === 0) return tkbvData;
    return tkbvData.filter(row => {
        return tkbvDateKey && overviewDateFilters.includes(String(row[tkbvDateKey] || '').trim());
    });
  }, [tkbvData, overviewDateFilters, tkbvDateKey]);

  const filteredPthspData = useMemo(() => {
    if (overviewDateFilters.length === 0) return pthspData;
    return pthspData.filter(row => {
        return pthspDateKey && overviewDateFilters.includes(String(row[pthspDateKey] || '').trim());
    });
  }, [pthspData, overviewDateFilters, pthspDateKey]);

  const filteredInventoryOverviewData = useMemo(() => {
    if (overviewDateFilters.length === 0) return inventoryData;
    return inventoryData.filter(row => {
        return invDateKey && overviewDateFilters.includes(String(row[invDateKey] || '').trim());
    });
  }, [inventoryData, overviewDateFilters, invDateKey]);

  // --- Bottleneck Data Processing ---
  const bottleneckData = useMemo<BottleneckItem[]>(() => {
    if (!tinhTrangKey || !daysAtCurrentStageKey) return [];
    
    const agg: Record<string, BottleneckItem> = {};
    const durationKeys = ['<3 NGÀY', '4-7 NGÀY', '2 tuần', '3 tuần', 'Từ 4 tuần trở lên'];

    filteredProductionData.forEach(row => {
        const status = String(row[tinhTrangKey] || '').trim();
        const duration = String(row[daysAtCurrentStageKey] || '').trim();
        
        if (status && duration) {
            if (!agg[status]) agg[status] = { name: status };
            durationKeys.forEach(k => { if(agg[status][k] === undefined) agg[status][k] = 0; });
            
            let matchedKey = duration;
            if (duration.toLowerCase().includes('<3 ngày')) matchedKey = '<3 NGÀY';
            else if (duration.toLowerCase().includes('4-7 ngày')) matchedKey = '4-7 NGÀY';
            else if (duration.toLowerCase().includes('2 tuần')) matchedKey = '2 tuần';
            else if (duration.toLowerCase().includes('3 tuần')) matchedKey = '3 tuần';
            else if (duration.toLowerCase().includes('4 tuần')) matchedKey = 'Từ 4 tuần trở lên';

            agg[status][matchedKey] = ((agg[status][matchedKey] as number) || 0) + 1;
        }
    });

    return Object.values(agg).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [filteredProductionData, tinhTrangKey, daysAtCurrentStageKey]);

  const topBottlenecks = useMemo<BottleneckCount[]>(() => {
     if (!tinhTrangKey || !daysAtCurrentStageKey) return [];
     
     const counts: Record<string, number> = {};
     filteredProductionData.forEach(row => {
         const status = String(row[tinhTrangKey] || '').trim();
         const duration = String(row[daysAtCurrentStageKey] || '').trim();
         
         if (status && duration.toLowerCase().includes('4 tuần')) {
             counts[status] = (counts[status] || 0) + 1;
         }
     });

     return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); 
  }, [filteredProductionData, tinhTrangKey, daysAtCurrentStageKey]);


  // --- Helper Functions ---

  const parseNumber = (valStr: string | number | null | undefined): number => {
    try {
        if (valStr === null || valStr === undefined) return 0;
        if (typeof valStr === 'number') return isNaN(valStr) ? 0 : valStr;
        let s = String(valStr).trim().replace(/[^\d.,-]/g, ''); 
        if (!s) return 0;
        if ((s.match(/\./g) || []).length > 1) { s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s) || 0; }
        if ((s.match(/,/g) || []).length > 1) { s = s.replace(/,/g, ''); return parseFloat(s) || 0; }
        if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
            if (s.lastIndexOf('.') < s.lastIndexOf(',')) { s = s.replace(/\./g, '').replace(',', '.'); } else { s = s.replace(/,/g, ''); }
        } else if (s.indexOf('.') !== -1) {
            const parts = s.split('.');
            if (parts.length === 2 && parts[1].length === 3) { s = s.replace('.', ''); } 
        } else if (s.indexOf(',') !== -1) { s = s.replace(',', '.'); }
        const res = parseFloat(s);
        return isNaN(res) ? 0 : res;
    } catch (e) { return 0; }
  };

  const formatNumber = (value: number, metric?: MetricType) => {
    if (metric === 'COUNT_HEX') return value.toLocaleString('en-US');
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' Tỷ';
    if (value >= 1_000_000) return (value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' Triệu';
    return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  };

  const formatDecimal = (value: number) => !isFinite(value) ? '0' : value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if(ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- Calculations ---

  const orderCardValue = useMemo(() => {
      try {
          if (overviewMetric === 'COUNT') return filteredOrderData.length;
          if (!orderValueKey) return 0;
          return filteredOrderData.reduce((sum, row) => sum + (parseNumber(row[orderValueKey])), 0);
      } catch (err) { return 0; }
  }, [filteredOrderData, overviewMetric, orderValueKey]);

  const tkbvCardValue = useMemo(() => {
      try {
          if (overviewMetric === 'COUNT') return filteredTkbvData.length;
          if (!tkbvValueKey) return 0;
          return filteredTkbvData.reduce((sum, row) => sum + (parseNumber(row[tkbvValueKey])), 0);
      } catch (err) { return 0; }
  }, [filteredTkbvData, overviewMetric, tkbvValueKey]);

  const pthspCardValue = useMemo(() => {
      try {
          if (overviewMetric === 'COUNT') return filteredPthspData.length;
          if (!pthspValueKey) return 0;
          return filteredPthspData.reduce((sum, row) => sum + (parseNumber(row[pthspValueKey]) / 1000), 0);
      } catch (err) { return 0; }
  }, [filteredPthspData, overviewMetric, pthspValueKey]);

  const inventoryOverviewCardValue = useMemo(() => {
      try {
          if (overviewMetric === 'COUNT') return filteredInventoryOverviewData.length;
          if (!invThanhTienKey) return 0;
          return filteredInventoryOverviewData.reduce((sum, row) => sum + (parseNumber(row[invThanhTienKey]) / 1000), 0); 
      } catch (err) { return 0; }
  }, [filteredInventoryOverviewData, overviewMetric, invThanhTienKey]);

  const latestUnifiedDate = useMemo(() => {
        const datesToCheck = overviewDateFilters.length > 0 ? overviewDateFilters : unifiedDateOptions;
        if (datesToCheck.length === 0) return null;
        let maxDate: Date | null = null;
        datesToCheck.forEach(dStr => {
             const d = parseVNDate(dStr);
             if (d && (!maxDate || d > maxDate)) maxDate = d;
        });
        return maxDate;
  }, [overviewDateFilters, unifiedDateOptions]);

  const monthlyOrderStats = useMemo(() => {
        if (!latestUnifiedDate || !orderDateKey) return { count: 0, value: 0 };
        const tMonth = latestUnifiedDate.getMonth();
        const tYear = latestUnifiedDate.getFullYear();
        let count = 0, value = 0;
        orderData.forEach(row => {
            const d = parseVNDate(String(row[orderDateKey] || ''));
            if (d && d.getMonth() === tMonth && d.getFullYear() === tYear) {
                count++;
                if (orderValueKey) value += parseNumber(row[orderValueKey]);
            }
        });
        return { count, value };
  }, [orderData, latestUnifiedDate, orderDateKey, orderValueKey]);

  const monthlyTkbvStats = useMemo(() => {
        if (!latestUnifiedDate || !tkbvDateKey) return { count: 0, value: 0 };
        const tMonth = latestUnifiedDate.getMonth();
        const tYear = latestUnifiedDate.getFullYear();
        let count = 0, value = 0;
        tkbvData.forEach(row => {
            const d = parseVNDate(String(row[tkbvDateKey] || ''));
            if (d && d.getMonth() === tMonth && d.getFullYear() === tYear) {
                count++;
                if (tkbvValueKey) value += parseNumber(row[tkbvValueKey]);
            }
        });
        return { count, value };
  }, [tkbvData, latestUnifiedDate, tkbvDateKey, tkbvValueKey]);

  const monthlyPthspStats = useMemo(() => {
        if (!latestUnifiedDate || !pthspDateKey) return { count: 0, value: 0 };
        const tMonth = latestUnifiedDate.getMonth();
        const tYear = latestUnifiedDate.getFullYear();
        let count = 0, value = 0;
        pthspData.forEach(row => {
            const d = parseVNDate(String(row[pthspDateKey] || ''));
            if (d && d.getMonth() === tMonth && d.getFullYear() === tYear) {
                count++;
                if (pthspValueKey) value += (parseNumber(row[pthspValueKey]) / 1000);
            }
        });
        return { count, value };
  }, [pthspData, latestUnifiedDate, pthspDateKey, pthspValueKey]);

  const monthlyInventoryOverviewStats = useMemo(() => {
        if (!latestUnifiedDate || !invDateKey) return { count: 0, value: 0 };
        const tMonth = latestUnifiedDate.getMonth();
        const tYear = latestUnifiedDate.getFullYear();
        let count = 0, value = 0;
        inventoryData.forEach(row => {
            const d = parseVNDate(String(row[invDateKey] || ''));
            if (d && d.getMonth() === tMonth && d.getFullYear() === tYear) {
                count++;
                if (invThanhTienKey) value += (parseNumber(row[invThanhTienKey]) / 1000);
            }
        });
        return { count, value };
  }, [inventoryData, latestUnifiedDate, invDateKey, invThanhTienKey]);

  const filteredKhsxData = useMemo(() => {
    return khsxData.filter(row => {
        const matchPhanLoai = khsxPhanLoaiFilter.length === 0 || (khsxPhanLoaiKey && khsxPhanLoaiFilter.includes(String(row[khsxPhanLoaiKey] || '').trim()));
        const matchNam = unifiedTimeFilters.nam.length === 0 || (khsxNamKey && unifiedTimeFilters.nam.includes(String(row[khsxNamKey] || '').trim()));
        const matchThang = unifiedTimeFilters.thang.length === 0 || (khsxThangKey && unifiedTimeFilters.thang.includes(String(row[khsxThangKey] || '').trim()));
        const matchNgay = unifiedTimeFilters.ngay.length === 0 || (khsxNgayKey && unifiedTimeFilters.ngay.includes(String(row[khsxNgayKey] || '').trim()));
        
        const matchGeneralCongTrinh = filters.congTrinh.length === 0 || (khsxCongTrinhKey && filters.congTrinh.includes(String(row[khsxCongTrinhKey] || '').trim()));
        const matchGeneralXuong = filters.xuong.length === 0 || (khsxXuongKey && filters.xuong.includes(String(row[khsxXuongKey] || '').trim()));
        
        return matchPhanLoai && matchNam && matchThang && matchNgay && matchGeneralCongTrinh && matchGeneralXuong;
    });
  }, [khsxData, khsxPhanLoaiFilter, unifiedTimeFilters, filters.congTrinh, filters.xuong, khsxPhanLoaiKey, khsxNamKey, khsxThangKey, khsxNgayKey, khsxCongTrinhKey, khsxXuongKey]);

  const totalKhsxAmount = useMemo(() => !khsxThanhTienKey ? 0 : filteredKhsxData.reduce((sum, row) => sum + (parseNumber(row[khsxThanhTienKey]) / 1000), 0), [filteredKhsxData, khsxThanhTienKey]);

  const khsxWorkshopChartData = useMemo(() => {
    if (!khsxXuongKey || !khsxThanhTienKey) return [];
    const agg: Record<string, number> = {};
    filteredKhsxData.forEach(row => {
        const xuong = String(row[khsxXuongKey] || '').trim();
        if (xuong) agg[xuong] = (agg[xuong] || 0) + (parseNumber(row[khsxThanhTienKey]) / 1000);
    });
    return Object.entries(agg).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredKhsxData, khsxXuongKey, khsxThanhTienKey]);

  const khsxProjectChartData = useMemo(() => {
    if (!khsxCongTrinhKey || !khsxThanhTienKey) return [];
    const agg: Record<string, { value: number, code: string }> = {};
    filteredKhsxData.forEach(row => {
        const ctName = String(row[khsxCongTrinhKey] || '').trim();
        const ctCode = khsxMaCongTrinhKey ? String(row[khsxMaCongTrinhKey] || '').trim() : '';
        if (ctName) {
            const val = parseNumber(row[khsxThanhTienKey]) / 1000;
            if (!agg[ctName]) agg[ctName] = { value: 0, code: ctCode || ctName };
            agg[ctName].value += val;
            if (ctCode && agg[ctName].code === ctName) agg[ctName].code = ctCode;
        }
    });
    return Object.entries(agg).map(([name, obj]) => ({ name, code: obj.code, value: obj.value })).sort((a, b) => b.value - a.value);
  }, [filteredKhsxData, khsxCongTrinhKey, khsxThanhTienKey, khsxMaCongTrinhKey]);

  const filteredInventoryData = useMemo(() => {
    return inventoryData.filter(row => {
        const matchGeneralCongTrinh = filters.congTrinh.length === 0 || (invCongTrinhKey && filters.congTrinh.includes(String(row[invCongTrinhKey] || '').trim()));
        const matchGeneralXuong = filters.xuong.length === 0 || (invXuongKey && filters.xuong.includes(String(row[invXuongKey] || '').trim()));
        const matchNam = unifiedTimeFilters.nam.length === 0 || (invNamKey && unifiedTimeFilters.nam.includes(String(row[invNamKey] || '').trim()));
        const matchThang = unifiedTimeFilters.thang.length === 0 || (invThangKey && unifiedTimeFilters.thang.includes(String(row[invThangKey] || '').trim()));
        const matchNgay = unifiedTimeFilters.ngay.length === 0 || (invNgayKey && unifiedTimeFilters.ngay.includes(String(row[invNgayKey] || '').trim()));
        return matchGeneralCongTrinh && matchGeneralXuong && matchNam && matchThang && matchNgay;
    });
  }, [inventoryData, filters.congTrinh, filters.xuong, unifiedTimeFilters, invCongTrinhKey, invXuongKey, invNamKey, invThangKey, invNgayKey]);

  const totalInventoryAmount = useMemo(() => !invThanhTienKey ? 0 : filteredInventoryData.reduce((sum, row) => sum + (parseNumber(row[invThanhTienKey]) / 1000), 0), [filteredInventoryData, invThanhTienKey]);

  const inventoryWorkshopChartData = useMemo(() => {
    if (!invXuongKey || !invThanhTienKey) return [];
    const agg: Record<string, number> = {};
    filteredInventoryData.forEach(row => {
        const xuong = String(row[invXuongKey] || '').trim();
        if (xuong) agg[xuong] = (agg[xuong] || 0) + (parseNumber(row[invThanhTienKey]) / 1000);
    });
    return Object.entries(agg).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredInventoryData, invXuongKey, invThanhTienKey]);

  const inventoryProjectChartData = useMemo(() => {
    if (!invCongTrinhKey || !invThanhTienKey) return [];
    const agg: Record<string, { value: number, code: string }> = {};
    filteredInventoryData.forEach(row => {
        const ctName = String(row[invCongTrinhKey] || '').trim();
        const ctCode = invMaCongTrinhKey ? String(row[invMaCongTrinhKey] || '').trim() : '';
        if (ctName) {
            const val = parseNumber(row[invThanhTienKey]) / 1000;
            if (!agg[ctName]) agg[ctName] = { value: 0, code: ctCode || ctName };
            agg[ctName].value += val;
            if (ctCode && agg[ctName].code === ctName) agg[ctName].code = ctCode;
        }
    });
    return Object.entries(agg).map(([name, obj]) => ({ name, code: obj.code, value: obj.value })).sort((a, b) => b.value - a.value);
  }, [filteredInventoryData, invCongTrinhKey, invThanhTienKey, invMaCongTrinhKey]);

  const combinedWorkshopData = useMemo(() => {
      const map = new Map<string, { name: string, khValue: number, thValue: number }>();
      khsxWorkshopChartData.forEach(item => map.set(item.name, { name: item.name, khValue: item.value, thValue: 0 }));
      inventoryWorkshopChartData.forEach(item => {
          if (map.has(item.name)) map.get(item.name)!.thValue = item.value;
          else map.set(item.name, { name: item.name, khValue: 0, thValue: item.value });
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [khsxWorkshopChartData, inventoryWorkshopChartData]);

  const combinedProjectData = useMemo(() => {
      const map = new Map<string, { name: string, code: string, khValue: number, thValue: number }>();
      khsxProjectChartData.forEach(item => map.set(item.name, { name: item.name, code: item.code, khValue: item.value, thValue: 0 }));
      inventoryProjectChartData.forEach(item => {
          if (map.has(item.name)) {
              const obj = map.get(item.name)!;
              obj.thValue = item.value;
              if (!obj.code || obj.code === item.name) obj.code = item.code;
          } else {
              map.set(item.name, { name: item.name, code: item.code, khValue: 0, thValue: item.value });
          }
      });
      return Array.from(map.values()).sort((a, b) => Math.max(b.khValue, b.thValue) - Math.max(a.khValue, a.thValue)).slice(0, 15);
  }, [khsxProjectChartData, inventoryProjectChartData]);

  const completionRate = useMemo(() => totalKhsxAmount > 0 ? (totalInventoryAmount / totalKhsxAmount) * 100 : 0, [totalInventoryAmount, totalKhsxAmount]);

  const calculateMetricValue = (row: DataRow, metric: MetricType): number => {
    if (metric === 'COUNT_HEX') return 1;
    if (metric === 'SUM_GT_CON_LAI') return parseNumber(row[realValueKey]);
    if (metric === 'SUM_GT_DON_HANG') return parseNumber(row[valueKey]);
    return 0;
  };

  const cardMetrics = useMemo(() => {
    const metrics = { coTheSX: 0, vecniFitting: 0, chuyenKhac: 0, coPhieuChuaSX: 0, chuaTheSX: 0, vuongSL: 0, chuaTrienKhai: 0 };
    if (!tinhTrangKey) return metrics;
    filteredProductionData.forEach(row => {
        const status = String(row[tinhTrangKey] || '').trim().toUpperCase();
        const val = parseNumber(row[valueKey]); 
        const isIn = (group: string[]) => group.some(s => status.includes(s));
        if (isIn(STATUS_GROUPS.CO_THE_SX)) metrics.coTheSX += val;
        if (isIn(STATUS_GROUPS.VECNI_FITTING)) metrics.vecniFitting += val;
        else if (isIn(STATUS_GROUPS.CHUYEN_KHAC)) metrics.chuyenKhac += val;
        else if (isIn(STATUS_GROUPS.CO_PHIEU_CHUA_SX)) metrics.coPhieuChuaSX += val;
        if (isIn(STATUS_GROUPS.CHUA_THE_SX)) metrics.chuaTheSX += val;
        if (isIn(STATUS_GROUPS.VUONG_SL)) metrics.vuongSL += val;
        else if (isIn(STATUS_GROUPS.CHUA_TRIEN_KHAI)) metrics.chuaTrienKhai += val;
    });
    return metrics;
  }, [filteredProductionData, tinhTrangKey, valueKey]);

  const projectStatusSummary = useMemo(() => {
      if (!congTrinhKey || !triGiaDonHangTongKey) return [];
      const agg: Record<string, { totalOrder: number; deployed: number; ticketed: number; inProduction: number; inventory: number; }> = {};
      filteredProductionData.forEach(row => {
          const ctName = String(row[congTrinhKey] || '').trim();
          if (!ctName) return;
          if (!agg[ctName]) agg[ctName] = { totalOrder: 0, deployed: 0, ticketed: 0, inProduction: 0, inventory: 0 };
          const status = String(row[tinhTrangKey] || '').toUpperCase();
          const totalOrderVal = parseNumber(row[triGiaDonHangTongKey]) / 1000;
          const ticketVal = parseNumber(row[thanhTienTinhPhieuKey]) / 1000;
          const inventoryVal = parseNumber(row[thanhTienNhapKhoKey]) / 1000;
          agg[ctName].totalOrder += totalOrderVal;
          if (!status.includes('15. CHƯA TRIỂN KHAI')) agg[ctName].deployed += totalOrderVal;
          if (!status.includes('15. CHƯA TRIỂN KHAI') && !status.includes('14. CHƯA PHIẾU')) agg[ctName].ticketed += ticketVal;
          if (!status.includes('15. CHƯA TRIỂN KHAI') && !status.includes('14. CHƯA PHIẾU') && !status.includes('11. CHƯA SX')) agg[ctName].inProduction += ticketVal;
          agg[ctName].inventory += inventoryVal;
      });
      return Object.entries(agg).map(([name, data]) => ({ name, ...data, remaining: data.totalOrder - data.inventory, notDeployed: data.totalOrder - data.deployed, percentComplete: data.totalOrder > 0 ? (data.inventory / data.totalOrder) * 100 : 0 })).sort((a, b) => b.totalOrder - a.totalOrder);
  }, [filteredProductionData, congTrinhKey, tinhTrangKey, triGiaDonHangTongKey, thanhTienTinhPhieuKey, thanhTienNhapKhoKey]);

  const pivotWorkshopData = useMemo<WorkshopPivotData | null>(() => {
    if (!tinhTrangKey || !xuongKey) return null;
    const uniqueWorkshops = Array.from(new Set(filteredProductionData.map(r => String(r[xuongKey] || '').trim()).filter(Boolean))).sort();
    const uniqueStatuses = Array.from(new Set(filteredProductionData.map(r => String(r[tinhTrangKey] || '').trim()).filter(Boolean))).sort();
    const matrix: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;
    uniqueStatuses.forEach(s => { matrix[s] = {}; rowTotals[s] = 0; uniqueWorkshops.forEach(w => { matrix[s][w] = 0; colTotals[w] = (colTotals[w] || 0); }); });
    filteredProductionData.forEach(row => {
        const s = String(row[tinhTrangKey] || '').trim();
        const w = String(row[xuongKey] || '').trim();
        if (s && w) {
            const val = calculateMetricValue(row, workshopMetric);
            if (matrix[s] && matrix[s][w] !== undefined) { matrix[s][w] += val; rowTotals[s] += val; colTotals[w] += val; grandTotal += val; }
        }
    });
    return { uniqueWorkshops, uniqueStatuses, matrix, rowTotals, colTotals, grandTotal };
  }, [filteredProductionData, tinhTrangKey, xuongKey, workshopMetric, valueKey, realValueKey]);

  const pivotProjectData = useMemo<ProjectPivotData | null>(() => {
    if (!congTrinhKey || !tinhTrangKey) return null;
    const dataToUse = excludeFabrics ? filteredProductionData.filter(r => { const hm = String(r[hangMucKey] || '').toLowerCase(); return !hm.includes('vải') && !hm.includes('gối'); }) : filteredProductionData;
    const uniqueStatuses = Array.from(new Set(dataToUse.map(r => String(r[tinhTrangKey] || '').trim()).filter(Boolean))).sort();
    const uniqueProjects = Array.from(new Set(dataToUse.map(r => String(r[congTrinhKey] || '').trim()).filter(Boolean))).sort();
    const matrix: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;
    uniqueProjects.forEach(p => { matrix[p] = {}; rowTotals[p] = 0; uniqueStatuses.forEach(s => { matrix[p][s] = 0; colTotals[s] = (colTotals[s] || 0); }); });
    dataToUse.forEach(row => {
        const p = String(row[congTrinhKey] || '').trim();
        const s = String(row[tinhTrangKey] || '').trim();
        if (p && s) {
            const val = calculateMetricValue(row, projectMetric);
             if (matrix[p] && matrix[p][s] !== undefined) { matrix[p][s] += val; rowTotals[p] += val; colTotals[s] += val; grandTotal += val; }
        }
    });
    return { uniqueProjects, uniqueStatuses, matrix, rowTotals, colTotals, grandTotal };
  }, [filteredProductionData, excludeFabrics, congTrinhKey, tinhTrangKey, hangMucKey, projectMetric, valueKey, realValueKey]);

  // Section A: Summary Pivot - Uses filteredMaterialData (All groups in project)
  const pivotMaterialSummary = useMemo<MaterialSummaryPivotData | null>(() => {
    if (!matNhomVtKey) return null;
    const summary: Record<string, { req: number, rec: number }> = {};
    filteredMaterialData.forEach(row => {
        const group = String(row[matNhomVtKey] || 'Chưa phân nhóm').trim();
        if (!summary[group]) summary[group] = { req: 0, rec: 0 };
        summary[group].req += parseNumber(row[matSlYeuCauKey]);
        summary[group].rec += parseNumber(row[matSlDaNhanKey]);
    });
    const sortedGroups = Object.keys(summary).sort();
    const totalReq = Object.values(summary).reduce((a, b) => a + b.req, 0);
    const totalRec = Object.values(summary).reduce((a, b) => a + b.rec, 0);
    return { summary, sortedGroups, totalReq, totalRec };
  }, [filteredMaterialData, matNhomVtKey, matSlYeuCauKey, matSlDaNhanKey]);

  // Section B: Status Pivot - Uses displayedMaterialData (Interactive Selection)
  const pivotMaterialStatusData = useMemo<MaterialStatusPivotData | null>(() => {
     if (!matNhomVtKey || !matStatusKey) return null;
     // Use displayedMaterialData to respond to selection
     const uniqueStatuses = Array.from(new Set(displayedMaterialData.map(r => String(r[matStatusKey] || '').trim()).filter(Boolean))).sort();
     const uniqueGroups = Array.from(new Set(displayedMaterialData.map(r => String(r[matNhomVtKey] || 'Chưa phân nhóm').trim()))).sort();
     const matrix: Record<string, Record<string, number>> = {};
     const rowTotals: Record<string, number> = {};
     const colTotals: Record<string, number> = {};
     let grandTotal = 0;
     uniqueGroups.forEach(g => { matrix[g] = {}; rowTotals[g] = 0; uniqueStatuses.forEach(s => { matrix[g][s] = 0; colTotals[s] = (colTotals[s] || 0); }); });
     displayedMaterialData.forEach(row => {
         const g = String(row[matNhomVtKey] || 'Chưa phân nhóm').trim();
         const s = String(row[matStatusKey] || '').trim();
         if (s) {
             const val = matStatusMetric === 'COUNT_PR' ? 1 : parseNumber(row[matSlYeuCauKey]);
             if (matrix[g] && matrix[g][s] !== undefined) { matrix[g][s] += val; rowTotals[g] += val; colTotals[s] += val; grandTotal += val; }
         }
     });
     return { sortedGroups: uniqueGroups, uniqueStatuses, matrix, rowTotals, colTotals, grandTotal };
  }, [displayedMaterialData, matNhomVtKey, matStatusKey, matStatusMetric, matSlYeuCauKey]);

  // Section C: Conditional Row Styling Logic
  const getMaterialRowClassName = (row: DataRow): string => {
     const status = String(row[matStatusSapKey] || '').toLowerCase();
     
     // Case 1: Cancel
     if (status.includes('hủy')) return 'bg-gray-100 text-gray-500 italic';
     
     // Case 2: Complete
     if (status.includes('hoàn thành') || status.includes('đóng') || status.includes('xong')) return 'bg-green-100 text-green-800';
     
     // Case 3: Open/Waiting
     if (status.includes('mở') || status.includes('open') || !status) {
         if (matEstDateKey) {
             const dateStr = String(row[matEstDateKey] || '');
             const date = parseVNDate(dateStr);
             if (date) {
                 const diff = diffDays(date, new Date());
                 // Overdue
                 if (diff < 0) return 'bg-red-100 text-yellow-700 font-bold'; 
                 // Today
                 if (diff === 0) return 'bg-orange-200 text-orange-800 animate-pulse font-bold';
                 // Near (1-5 days)
                 if (diff >= 1 && diff <= 5) return 'bg-yellow-50 text-slate-700';
                 // Far (> 5 days)
                 if (diff > 5) return 'bg-yellow-200 text-slate-700';
             }
         }
     }
     
     // Default
     return 'bg-white hover:bg-slate-50';
  };

  const lineChartData = useMemo(() => {
    if (!tinhTrangKey) return [];
    const aggregated: Record<string, number> = {};
    filteredProductionData.forEach(row => {
        const status = String(row[tinhTrangKey] || '').trim();
        if(!status) return;
        const calculateVal = calculateMetricValue(row, chartMetric);
        aggregated[status] = (aggregated[status] || 0) + calculateVal;
    });
    return Object.entries(aggregated).map(([name, value]) => ({ name, value })).sort((a, b) => b.name.localeCompare(a.name));
  }, [filteredProductionData, tinhTrangKey, chartMetric, valueKey, realValueKey, hexKey]);

  const clearFilters = () => {
    setFilters({ congTrinh: [], xuong: [], tinhTrang: [], tinhTrangIpo: [] });
  };

  const toggleMaterialGroup = (group: string) => {
      setSelectedMaterialGroups(prev => {
          if (prev.includes(group)) return prev.filter(g => g !== group);
          return [...prev, group];
      });
  };

  const hasActiveFilters = filters.congTrinh.length > 0 || filters.xuong.length > 0 || filters.tinhTrang.length > 0 || filters.tinhTrangIpo.length > 0;

  const totalMaterialPages = Math.ceil(displayedMaterialData.length / MATERIAL_ITEMS_PER_PAGE);
  const paginatedMaterialList = displayedMaterialData.slice(
      (materialListPage - 1) * MATERIAL_ITEMS_PER_PAGE,
      materialListPage * MATERIAL_ITEMS_PER_PAGE
  );

  // ... ProjectChartTooltip (keep existing) ...
  const ProjectChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-700 mb-2">{payload[0].payload.name}</p>
          <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-orange-600 font-medium">Kế hoạch:</span>
                  <span className="text-sm font-bold text-orange-700">{formatDecimal(payload[0].payload.khValue)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-indigo-600 font-medium">Thực hiện:</span>
                  <span className="text-sm font-bold text-indigo-700">{formatDecimal(payload[0].payload.thValue)}</span>
              </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (productionData.length === 0 && materialData.length === 0 && khsxData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Không có dữ liệu để hiển thị.
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto h-full custom-scrollbar pb-24 bg-wood-50">
      
      {/* Sticky Header & Filters */}
      <div className="sticky top-0 z-40 bg-wood-50/95 backdrop-blur-sm border-b border-wood-200 px-4 py-3 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div>
               <h2 className="text-xl font-bold text-slate-800">Tổng quan</h2>
             </div>
             {/* Anchor Buttons */}
             <div className="flex gap-2">
                <button onClick={() => scrollToRef(orderOverviewRef)} className="p-1.5 text-xs bg-white border border-slate-200 rounded hover:bg-wood-50 text-slate-600 flex items-center gap-1 shadow-sm" title="Đến Tổng quan Đơn hàng">
                   <ShoppingCart size={14} className="text-pink-600"/> Đơn hàng
                </button>
                <button onClick={() => scrollToRef(bottleneckSectionRef)} className="p-1.5 text-xs bg-white border border-slate-200 rounded hover:bg-wood-50 text-slate-600 flex items-center gap-1 shadow-sm" title="Đến Báo cáo Điểm nghẽn">
                   <AlertTriangle size={14} className="text-red-600"/> Điểm nghẽn
                </button>
                <button onClick={() => scrollToRef(khsxSectionRef)} className="p-1.5 text-xs bg-white border border-slate-200 rounded hover:bg-wood-50 text-slate-600 flex items-center gap-1 shadow-sm" title="Đến Kế hoạch & Nhập kho">
                   <BarChart2 size={14} className="text-indigo-600"/> Kế hoạch
                </button>
                <button onClick={() => scrollToRef(projectSummaryRef)} className="p-1.5 text-xs bg-white border border-slate-200 rounded hover:bg-wood-50 text-slate-600 flex items-center gap-1 shadow-sm" title="Đến Tình trạng đơn hàng">
                   <PieChart size={14} className="text-emerald-600"/> Tình trạng
                </button>
             </div>
          </div>
          
          {/* Dashboard Filters */}
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 mr-1 text-slate-500">
               <Filter size={14} /> <span className="text-[10px] uppercase font-bold">Bộ lọc tổng:</span>
            </div>
            {congTrinhKey && (
              <DashboardFilter 
                label="Tên Công Trình"
                options={congTrinhOptions}
                selectedValues={filters.congTrinh}
                onChange={(vals) => setFilters(prev => ({ ...prev, congTrinh: vals }))}
              />
            )}
            {xuongKey && (
              <DashboardFilter 
                label="Xưởng Chính"
                options={xuongOptions}
                selectedValues={filters.xuong}
                onChange={(vals) => setFilters(prev => ({ ...prev, xuong: vals }))}
              />
            )}
            {tinhTrangIpoKey && (
              <DashboardFilter 
                label="Tình Trạng IPO"
                options={tinhTrangIpoOptions}
                selectedValues={filters.tinhTrangIpo}
                onChange={(vals) => setFilters(prev => ({ ...prev, tinhTrangIpo: vals }))}
              />
            )}
            {tinhTrangKey && (
              <DashboardFilter 
                label="Tình Trạng"
                options={tinhTrangOptions}
                selectedValues={filters.tinhTrang}
                onChange={(vals) => setFilters(prev => ({ ...prev, tinhTrang: vals }))}
              />
            )}
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa bộ lọc"
              >
                <CloseIcon size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 md:px-8 space-y-6">

        {/* --- MOVED SECTION: ORDER OVERVIEW (RENAMED TO BÁO CÁO TỔNG QUAN) --- */}
        {(orderData.length > 0 || tkbvData.length > 0 || pthspData.length > 0) && (
            <div ref={orderOverviewRef} className="scroll-mt-24 w-full bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                       <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-pink-600"/>BÁO CÁO TỔNG QUAN</h3>
                       <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-slate-500">Dữ liệu từ nguồn Đơn hàng tổng & TKBV & PTHSP & Nhập Kho</span>
                       </div>
                    </div>
                    {/* Unified Date Filter Header with Global Metric Toggle */}
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">CHẾ ĐỘ HIỂN THỊ:</span>
                            <div className="flex items-center bg-white p-0.5 rounded border border-slate-200 shadow-sm mt-0.5">
                                <button onClick={() => setOverviewMetric('COUNT')} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all ${overviewMetric === 'COUNT' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Số lượng</button>
                                <div className="w-px h-2.5 bg-slate-200 mx-0.5"></div>
                                <button onClick={() => setOverviewMetric('SUM')} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all ${overviewMetric === 'SUM' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Giá trị</button>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">BỘ LỌC NGÀY CHUNG (ALL):</span>
                            {overviewDateRangeDisplay && <span className="text-[10px] text-indigo-600 font-semibold">{overviewDateRangeDisplay}</span>}
                        </div>
                        <DashboardFilter 
                            label="NGÀY BÁO CÁO" 
                            options={unifiedDateOptions} 
                            selectedValues={overviewDateFilters} 
                            onChange={setOverviewDateFilters}
                        />
                         {overviewDateFilters.length > 0 && (<button onClick={() => setOverviewDateFilters([])} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 bg-white" title="Xóa lọc ngày"><CloseIcon size={16} /></button>)}
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* CARD 1: ORDER DATA */}
                    <div className="flex flex-col gap-4">
                         <div className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow h-full min-h-[160px]">
                             <div className="flex items-center gap-2 mb-3 z-10">
                                  <div className="p-2 bg-pink-100 rounded-lg text-pink-600 shadow-sm group-hover:scale-110 transition-transform"><ShoppingCart size={20}/></div>
                                  <p className="text-sm font-bold text-pink-800 opacity-80 uppercase tracking-wide">1. Đơn hàng mới (IPO)</p>
                             </div>
                             <div className="z-10 flex items-baseline gap-2">
                                  <h4 className="text-4xl font-extrabold text-pink-600 tracking-tight">{overviewMetric === 'COUNT' ? orderCardValue.toLocaleString('en-US') : formatDecimal(orderCardValue)}</h4>
                                  <span className="text-sm font-medium text-pink-400">{overviewMetric === 'COUNT' ? 'đơn hàng (HEX)' : 'đơn vị (1,000đ)'}</span>
                             </div>
                             {monthlyOrderStats.count > 0 && (
                                 <div className="z-10 mt-3 pt-3 border-t border-pink-200/60 w-full">
                                     <div className="flex justify-between items-center">
                                         <span className="text-xs font-bold text-pink-800/70 uppercase">Lũy kế T{latestUnifiedDate?.getMonth()! + 1}:</span>
                                         <span className="text-sm font-extrabold text-pink-700">{overviewMetric === 'COUNT' ? `${monthlyOrderStats.count.toLocaleString('en-US')} đơn` : formatDecimal(monthlyOrderStats.value)}</span>
                                     </div>
                                 </div>
                             )}
                             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4"><ShoppingCart size={100} className="text-pink-600"/></div>
                         </div>
                    </div>

                    {/* CARD 2: TKBV DATA */}
                    <div className="flex flex-col gap-4">
                         <div className="p-5 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow h-full min-h-[160px]">
                             <div className="flex items-center gap-2 mb-3 z-10">
                                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                                  <p className="text-sm font-bold text-blue-800 opacity-80 uppercase tracking-wide">2. Đã Triển khai BV</p>
                             </div>
                             <div className="z-10 flex items-baseline gap-2">
                                  <h4 className="text-4xl font-extrabold text-blue-600 tracking-tight">{overviewMetric === 'COUNT' ? tkbvCardValue.toLocaleString('en-US') : formatDecimal(tkbvCardValue)}</h4>
                                  <span className="text-sm font-medium text-blue-400">{overviewMetric === 'COUNT' ? 'bản vẽ (Items)' : 'đơn vị (1,000đ)'}</span>
                             </div>
                             {monthlyTkbvStats.count > 0 && (
                                 <div className="z-10 mt-3 pt-3 border-t border-blue-200/60 w-full">
                                     <div className="flex justify-between items-center">
                                         <span className="text-xs font-bold text-blue-800/70 uppercase">Lũy kế T{latestUnifiedDate?.getMonth()! + 1}:</span>
                                         <span className="text-sm font-extrabold text-blue-700">{overviewMetric === 'COUNT' ? `${monthlyTkbvStats.count.toLocaleString('en-US')} bản vẽ` : formatDecimal(monthlyTkbvStats.value)}</span>
                                     </div>
                                 </div>
                             )}
                             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4"><FileText size={100} className="text-blue-600"/></div>
                         </div>
                    </div>

                    {/* CARD 3: PTHSP DATA */}
                    <div className="flex flex-col gap-4">
                         <div className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow h-full min-h-[160px]">
                             <div className="flex items-center gap-2 mb-3 z-10">
                                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600 shadow-sm group-hover:scale-110 transition-transform"><ClipboardList size={20}/></div>
                                  <p className="text-sm font-bold text-purple-800 opacity-80 uppercase tracking-wide">3. Đã Tính phiếu</p>
                             </div>
                             <div className="z-10 flex items-baseline gap-2">
                                  <h4 className="text-4xl font-extrabold text-purple-600 tracking-tight">{overviewMetric === 'COUNT' ? pthspCardValue.toLocaleString('en-US') : formatDecimal(pthspCardValue)}</h4>
                                  <span className="text-sm font-medium text-purple-400">{overviewMetric === 'COUNT' ? 'phiếu (Items)' : 'đơn vị (1,000đ)'}</span>
                             </div>
                             {monthlyPthspStats.count > 0 && (
                                 <div className="z-10 mt-3 pt-3 border-t border-purple-200/60 w-full">
                                     <div className="flex justify-between items-center">
                                         <span className="text-xs font-bold text-purple-800/70 uppercase">Lũy kế T{latestUnifiedDate?.getMonth()! + 1}:</span>
                                         <span className="text-sm font-extrabold text-purple-700">{overviewMetric === 'COUNT' ? `${monthlyPthspStats.count.toLocaleString('en-US')} phiếu` : formatDecimal(monthlyPthspStats.value)}</span>
                                     </div>
                                 </div>
                             )}
                             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4"><ClipboardList size={100} className="text-purple-600"/></div>
                         </div>
                    </div>

                    {/* CARD 4: INVENTORY DATA (NEW) */}
                    <div className="flex flex-col gap-4">
                         <div className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow h-full min-h-[160px]">
                             <div className="flex items-center gap-2 mb-3 z-10">
                                  <div className="p-2 bg-teal-100 rounded-lg text-teal-600 shadow-sm group-hover:scale-110 transition-transform"><Package size={20}/></div>
                                  <p className="text-sm font-bold text-teal-800 opacity-80 uppercase tracking-wide">4. Nhập kho</p>
                             </div>
                             <div className="z-10 flex items-baseline gap-2">
                                  <h4 className="text-4xl font-extrabold text-teal-600 tracking-tight">{overviewMetric === 'COUNT' ? inventoryOverviewCardValue.toLocaleString('en-US') : formatDecimal(inventoryOverviewCardValue)}</h4>
                                  <span className="text-sm font-medium text-teal-400">{overviewMetric === 'COUNT' ? 'items' : 'đơn vị (1,000đ)'}</span>
                             </div>
                             {monthlyInventoryOverviewStats.count > 0 && (
                                 <div className="z-10 mt-3 pt-3 border-t border-teal-200/60 w-full">
                                     <div className="flex justify-between items-center">
                                         <span className="text-xs font-bold text-teal-800/70 uppercase">Lũy kế T{latestUnifiedDate?.getMonth()! + 1}:</span>
                                         <span className="text-sm font-extrabold text-teal-700">{overviewMetric === 'COUNT' ? `${monthlyInventoryOverviewStats.count.toLocaleString('en-US')} items` : formatDecimal(monthlyInventoryOverviewStats.value)}</span>
                                     </div>
                                 </div>
                             )}
                             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4"><Package size={100} className="text-teal-600"/></div>
                         </div>
                    </div>

                 </div>
            </div>
        )}

        {/* --- NEW SECTION: BÁO CÁO TỶ TRỌNG ĐIỂM NGHẼN --- */}
        {bottleneckData.length > 0 && (
          <div ref={bottleneckSectionRef} className="scroll-mt-24 w-full bg-white p-6 rounded-xl shadow-sm border border-red-100 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-red-50 pb-4">
              <div className="bg-red-50 p-2 rounded-lg text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">BÁO CÁO TỶ TRỌNG ĐIỂM NGHẼN</h3>
                <p className="text-xs text-slate-500">Phân tích thời gian tồn tại của các hạng mục (HEX) tại từng công đoạn</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bottleneckData as any[]}
                    stackOffset="expand"
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      interval={0} 
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [value, name]}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                    />
                    
                    {/* Define Bars with Specific Colors for Stack Order */}
                    <Bar dataKey="Từ 4 tuần trở lên" stackId="a" fill="#ef4444" barSize={30}>
                        <LabelList dataKey="Từ 4 tuần trở lên" position="center" fill="#ffffff" fontSize={10} fontWeight="bold" formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="3 tuần" stackId="a" fill="#f97316" barSize={30}>
                        <LabelList dataKey="3 tuần" position="center" fill="#ffffff" fontSize={10} fontWeight="bold" formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="2 tuần" stackId="a" fill="#eab308" barSize={30}>
                        <LabelList dataKey="2 tuần" position="center" fill="#ffffff" fontSize={10} fontWeight="bold" formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="4-7 NGÀY" stackId="a" fill="#3b82f6" barSize={30}>
                        <LabelList dataKey="4-7 NGÀY" position="center" fill="#ffffff" fontSize={10} fontWeight="bold" formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="<3 NGÀY" stackId="a" fill="#22c55e" barSize={30}>
                        <LabelList dataKey="<3 NGÀY" position="center" fill="#ffffff" fontSize={10} fontWeight="bold" formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* KPI List Section */}
              <div className="bg-red-50/50 rounded-xl p-5 border border-red-100 flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-red-700">
                  <Clock className="w-5 h-5" />
                  <h4 className="font-bold uppercase text-sm">Top Điểm Nghẽn (Trên 4 Tuần)</h4>
                </div>
                
                {topBottlenecks.length > 0 ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {topBottlenecks.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-red-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                           <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs">{index + 1}</span>
                           <div>
                             <p className="text-xs font-bold text-slate-700">{item.name}</p>
                             <p className="text-[10px] text-red-500 font-medium">Tồn đọng lâu</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-lg font-bold text-red-600 block leading-none">{item.count}</span>
                           <span className="text-[9px] text-slate-400 uppercase">items</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                    <CheckCircle className="w-10 h-10 text-green-400 mb-2 opacity-50" />
                    <p className="text-xs">Không có công đoạn nào tồn đọng trên 4 tuần.</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-red-200">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Tổng cảnh báo:</span>
                        <span className="font-bold text-red-700">{(topBottlenecks as BottleneckCount[]).reduce((a,b) => a + b.count, 0)} items</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Unified Section: Plan & Inventory --- */}
        {(khsxData.length > 0 || inventoryData.length > 0) && (
            <div ref={khsxSectionRef} className="scroll-mt-24 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                   <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-500 to-indigo-600 p-2 rounded-lg text-white">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Thống kê Tổng hợp: Kế hoạch & Nhập kho</h3>
                            <p className="text-xs text-slate-500">So sánh trực quan giữa Kế hoạch (KH) và Thực tế (TH) với bộ lọc thời gian thống nhất</p>
                        </div>
                   </div>
                   
                   {/* UNIFIED FILTER BAR */}
                   <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mr-2">
                            <Filter size={14} className="text-slate-500"/>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">BỘ LỌC THỜI GIAN CHUNG:</span>
                        </div>
                        
                        <DashboardFilter 
                            label="LỌC NĂM" 
                            options={unifiedNamOptions} 
                            selectedValues={unifiedTimeFilters.nam} 
                            onChange={(vals) => setUnifiedTimeFilters(prev => ({ ...prev, nam: vals }))} 
                        />
                        <DashboardFilter 
                            label="LỌC THÁNG" 
                            options={unifiedThangOptions} 
                            selectedValues={unifiedTimeFilters.thang} 
                            onChange={(vals) => setUnifiedTimeFilters(prev => ({ ...prev, thang: vals }))} 
                        />
                        <DashboardFilter 
                            label="LỌC NGÀY" 
                            options={unifiedNgayOptions} 
                            selectedValues={unifiedTimeFilters.ngay} 
                            onChange={(vals) => setUnifiedTimeFilters(prev => ({ ...prev, ngay: vals }))} 
                        />

                        {(unifiedTimeFilters.nam.length > 0 || unifiedTimeFilters.thang.length > 0 || unifiedTimeFilters.ngay.length > 0) && (
                            <button onClick={() => setUnifiedTimeFilters({ nam: [], thang: [], ngay: [] })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 bg-white" title="Xóa lọc thời gian">
                                <CloseIcon size={16} />
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-300 mx-1"></div>

                        {khsxPhanLoaiKey && (
                            <DashboardFilter 
                                label="PHÂN LOẠI (CHỈ KH)" 
                                options={khsxPhanLoaiOptions} 
                                selectedValues={khsxPhanLoaiFilter} 
                                onChange={setKhsxPhanLoaiFilter} 
                            />
                        )}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-orange-100 rounded text-orange-600"><Calendar size={18}/></div>
                             <p className="text-xs font-bold text-orange-800 opacity-70 uppercase">Tổng KH Sản Xuất</p>
                        </div>
                        <h4 className="text-2xl lg:text-3xl font-bold text-orange-600 tracking-tight">{formatDecimal(totalKhsxAmount)}</h4>
                        <div className="mt-1 text-[10px] text-orange-800/60 italic">
                             {khsxPhanLoaiFilter.length > 0 ? `Lọc: ${khsxPhanLoaiFilter.join(', ')}` : 'Toàn bộ'}
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 z-10">
                             <div className="p-1.5 bg-teal-100 rounded text-teal-600"><TrendingUp size={18}/></div>
                             <p className="text-xs font-bold text-teal-800 opacity-70 uppercase">Tỷ lệ Thực hiện / KH</p>
                        </div>
                        <div className="flex items-baseline gap-2 z-10">
                            <h4 className={`text-3xl font-bold tracking-tight ${completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {formatDecimal(completionRate)}%
                            </h4>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 z-10">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${completionRate >= 100 ? 'bg-emerald-500' : completionRate >= 80 ? 'bg-teal-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(completionRate, 100)}%` }}></div>
                        </div>
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                             <TrendingUp size={80} className="text-teal-600"/>
                        </div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-indigo-100 rounded text-indigo-600"><Import size={18}/></div>
                             <p className="text-xs font-bold text-indigo-800 opacity-70 uppercase">Tổng Thực Hiện (NK)</p>
                        </div>
                        <h4 className="text-2xl lg:text-3xl font-bold text-indigo-600 tracking-tight">{formatDecimal(totalInventoryAmount)}</h4>
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-2"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={inventorySectionRef}>
                    <div className="h-[350px] w-full bg-slate-50 rounded-lg border border-slate-100 p-3 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-3 left-4 text-xs font-bold text-slate-600 uppercase z-10 bg-white/80 px-2 py-1 rounded backdrop-blur-sm shadow-sm">SO SÁNH: KH vs TH (Theo Xưởng)</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={combinedWorkshopData as Record<string, any>[]} margin={{ top: 35, right: 30, left: 10, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{fontSize: 10}} interval={0}/>
                            <YAxis tickFormatter={formatDecimal} tick={{fontSize: 10}} width={45} domain={['auto', 'auto']} />
                            <RechartsTooltip cursor={{fill: '#f8fafc'}}/>
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar dataKey="khValue" name="Kế hoạch (KH)" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20}><LabelList dataKey="khValue" position="top" formatter={formatDecimal} fontSize={10} fill="#c2410c" /></Bar>
                            <Bar dataKey="thValue" name="Thực hiện (TH)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20}><LabelList dataKey="thValue" position="top" formatter={formatDecimal} fontSize={10} fill="#4338ca" /></Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="h-[350px] w-full bg-slate-50 rounded-lg border border-slate-100 p-3 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-3 left-4 text-xs font-bold text-slate-600 uppercase z-10 bg-white/80 px-2 py-1 rounded backdrop-blur-sm shadow-sm">SO SÁNH: KH vs TH (Theo Công Trình - Top 15)</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={combinedProjectData as Record<string, any>[]} margin={{ top: 35, right: 30, left: 10, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="code" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} interval={0}/>
                            <YAxis tickFormatter={formatDecimal} tick={{fontSize: 10}} width={45} domain={['auto', 'auto']} />
                            <RechartsTooltip content={<ProjectChartTooltip />} cursor={{fill: '#f8fafc'}}/>
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar dataKey="khValue" name="Kế hoạch (KH)" fill="#f97316" radius={[4, 4, 0, 0]} barSize={15}><LabelList dataKey="khValue" position="top" formatter={formatDecimal} fontSize={9} fill="#c2410c" /></Bar>
                            <Bar dataKey="thValue" name="Thực hiện (TH)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={15}><LabelList dataKey="thValue" position="top" formatter={formatDecimal} fontSize={9} fill="#4338ca" /></Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        <div>
           <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-wood-500"/>Phân tích Khả năng Sản xuất - Thành tiền Đơn hàng còn lại</h3>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-green-50/50 rounded-xl p-2 border border-green-100 flex flex-col gap-2">
                 <CompactStatCard title="CÓ THỂ SẢN XUẤT" value={formatNumber(cardMetrics.coTheSX)} icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-50" borderColor="border-green-400" textColor="text-green-800" isParent={true} />
                 <div className="grid grid-cols-3 gap-2">
                    <CompactStatCard title="VECNI + FITTING" value={formatNumber(cardMetrics.vecniFitting)} icon={<div className="w-2 h-2 rounded-full bg-blue-500"></div>} bg="bg-white" borderColor="border-blue-200" textColor="text-slate-700" />
                    <CompactStatCard title="ĐANG TRÊN CHUYỀN" value={formatNumber(cardMetrics.chuyenKhac)} icon={<div className="w-2 h-2 rounded-full bg-indigo-500"></div>} bg="bg-white" borderColor="border-indigo-200" textColor="text-slate-700" />
                    <CompactStatCard title="CÓ PHIẾU CHƯA SX" value={formatNumber(cardMetrics.coPhieuChuaSX)} icon={<div className="w-2 h-2 rounded-full bg-amber-500"></div>} bg="bg-white" borderColor="border-amber-200" textColor="text-slate-700" />
                 </div>
              </div>
              <div className="bg-red-50/50 rounded-xl p-2 border border-red-100 flex flex-col gap-2">
                 <CompactStatCard title="CHƯA THỂ SẢN XUẤT" value={formatNumber(cardMetrics.chuaTheSX)} icon={<CloseIcon className="w-5 h-5 text-red-600" />} bg="bg-red-50" borderColor="border-red-400" textColor="text-red-800" isParent={true} />
                 <div className="grid grid-cols-2 gap-2">
                    <CompactStatCard title="VƯỚNG SL CHƯA REV" value={formatNumber(cardMetrics.vuongSL)} icon={<div className="w-2 h-2 rounded-full bg-orange-500"></div>} bg="bg-white" borderColor="border-orange-200" textColor="text-slate-700" />
                    <CompactStatCard title="CHƯA TRIỂN KHAI SX" value={formatNumber(cardMetrics.chuaTrienKhai)} icon={<div className="w-2 h-2 rounded-full bg-slate-400"></div>} bg="bg-white" borderColor="border-slate-300" textColor="text-slate-700" />
                 </div>
              </div>
           </div>
        </div>

        <div ref={pivotWorkshopRef} className="scroll-mt-24 w-full bg-white p-5 rounded-xl shadow-sm border border-wood-100 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
               <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><TableIcon className="w-4 h-4 text-wood-500"/>Chi tiết Giá trị (Tình Trạng x Xưởng)</h3>
               <MetricSwitcher current={workshopMetric} onChange={setWorkshopMetric} />
            </div>
            {pivotWorkshopData ? (
              <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-right min-w-[800px]">
                  <thead className="bg-wood-50 text-slate-700 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left sticky left-0 bg-wood-50 border-b border-wood-200 z-10 min-w-[180px]">Tình Trạng / Xưởng</th>
                      {pivotWorkshopData.uniqueWorkshops.map(w => (<th key={w} className="px-3 py-2 border-b border-wood-200 whitespace-nowrap text-wood-800">{w}</th>))}
                      <th className="px-3 py-2 bg-wood-100 border-b border-wood-200 font-bold text-slate-800">Tổng Cộng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pivotWorkshopData.uniqueStatuses.map(s => (
                      <tr key={s} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-left font-medium text-slate-700 sticky left-0 bg-white hover:bg-slate-50 z-10 whitespace-nowrap border-r border-slate-100">{s}</td>
                        {pivotWorkshopData.uniqueWorkshops.map(w => { const val = pivotWorkshopData.matrix[s]?.[w] || 0; return (<td key={w} className={`px-3 py-2 whitespace-nowrap ${val === 0 ? 'text-slate-300' : 'text-slate-600'}`}>{val === 0 ? '-' : formatNumber(val, workshopMetric)}</td>); })}
                        <td className="px-3 py-2 font-bold text-slate-800 bg-wood-50/50">{formatNumber(pivotWorkshopData.rowTotals[s], workshopMetric)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-wood-100 font-bold text-slate-800 border-t border-wood-300">
                    <tr>
                      <td className="px-3 py-2 text-left sticky left-0 bg-wood-100 z-10">Tổng Cộng</td>
                      {pivotWorkshopData.uniqueWorkshops.map(w => (<td key={w} className="px-3 py-2 whitespace-nowrap">{formatNumber(pivotWorkshopData.colTotals[w], workshopMetric)}</td>))}
                      <td className="px-3 py-2 text-wood-800 text-sm">{formatNumber(pivotWorkshopData.grandTotal, workshopMetric)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">Không đủ dữ liệu hoặc thiếu cấu hình cột để tạo bảng Pivot.</div>}
        </div>

        <div ref={projectSummaryRef} className="scroll-mt-24 w-full bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
               <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600"/>Tình trạng đơn hàng theo Công trình</h3>
               <span className="text-xs text-slate-500 italic">Đơn vị: 1,000 VNĐ</span>
            </div>
            {projectStatusSummary.length > 0 ? (
                <div className="overflow-auto custom-scrollbar border border-slate-200 rounded-lg max-h-[600px]">
                    <table className="w-full text-xs text-right min-w-[1200px] border-separate border-spacing-0">
                        <thead className="bg-emerald-100/50 text-slate-800 font-bold uppercase tracking-tight">
                            <tr>
                                <th className="px-3 py-3 text-left sticky left-0 top-0 bg-emerald-100 border-b border-emerald-200 z-30 min-w-[220px] shadow-sm">Tên Công Trình</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20">Tổng Giá Trị <br/>Đơn Hàng</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20">Đã Triển Khai <br/>Sản Xuất</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20">Đã Tính Phiếu</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20">Đang Sản Xuất</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20">Giá Trị <br/>Đã Nhập Kho</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20 font-extrabold text-slate-900">Giá Trị Còn Lại</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20 text-slate-500">Chưa Triển Khai <br/>Sản Xuất</th>
                                <th className="px-3 py-3 border-b border-emerald-200 sticky top-0 bg-emerald-50 z-20 text-center min-w-[100px]">% Hoàn Thành</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                            {projectStatusSummary.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-3 py-2.5 text-left font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{row.name}</td>
                                    <td className="px-3 py-2.5 text-slate-800">{formatDecimal(row.totalOrder)}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{formatDecimal(row.deployed)}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{formatDecimal(row.ticketed)}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{formatDecimal(row.inProduction)}</td>
                                    <td className="px-3 py-2.5 text-indigo-700 font-medium">{formatDecimal(row.inventory)}</td>
                                    <td className="px-3 py-2.5 font-bold text-slate-900 bg-slate-50/50">{formatDecimal(row.remaining)}</td>
                                    <td className="px-3 py-2.5 text-slate-400 italic">{formatDecimal(row.notDeployed)}</td>
                                    <td className="px-2 py-2.5 text-center">
                                        <div className={`px-2 py-1 rounded font-bold text-[10px] inline-block w-full text-center ${row.percentComplete >= 95 ? 'bg-green-50 text-white' : row.percentComplete >= 70 ? 'bg-green-100 text-green-700' : row.percentComplete >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{formatDecimal(row.percentComplete)}%</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-emerald-50 font-bold text-slate-800 border-t border-emerald-300 sticky bottom-0 z-20">
                            <tr>
                                <td className="px-3 py-3 text-left sticky left-0 bg-emerald-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">TỔNG CỘNG</td>
                                <td className="px-3 py-3">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.totalOrder, 0))}</td>
                                <td className="px-3 py-3">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.deployed, 0))}</td>
                                <td className="px-3 py-3">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.ticketed, 0))}</td>
                                <td className="px-3 py-3">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.inProduction, 0))}</td>
                                <td className="px-3 py-3 text-indigo-800">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.inventory, 0))}</td>
                                <td className="px-3 py-3 text-slate-900">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.remaining, 0))}</td>
                                <td className="px-3 py-3 text-slate-500">{formatDecimal(projectStatusSummary.reduce((a,b) => a + b.notDeployed, 0))}</td>
                                <td className="px-3 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">Không có dữ liệu phù hợp để tính toán tổng quan đơn hàng.</div>}
        </div>

        <div ref={pivotProjectRef} className="scroll-mt-24 w-full bg-white p-5 rounded-xl shadow-sm border border-wood-100 flex flex-col">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3">
               <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><LayoutList className="w-4 h-4 text-blue-500"/>Chi tiết Giá trị (Công trình x Tình trạng)</h3>
               <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                   <MetricSwitcher current={projectMetric} onChange={setProjectMetric} />
                   <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <button onClick={() => setExcludeFabrics(false)} className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${!excludeFabrics ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Hiển thị tất cả hạng mục"><CheckCircle size={12}/> Đủ hạng mục</button>
                      <button onClick={() => setExcludeFabrics(true)} className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${excludeFabrics ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`} title="Loại bỏ Vải, Gối khỏi thống kê"><MinusCircle size={12}/> Trừ Vải/Gối</button>
                   </div>
               </div>
            </div>
            {pivotProjectData ? (
              <div className="overflow-auto custom-scrollbar border border-slate-200 rounded-lg max-h-[550px]">
                <table className="w-full text-xs text-right min-w-[800px] border-separate border-spacing-0">
                  <thead className="bg-blue-50/50 text-slate-700 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left sticky left-0 top-0 bg-blue-100 border-b border-blue-200 z-30 min-w-[200px] shadow-[1px_1px_2px_rgba(0,0,0,0.05)]">Tên Công Trình</th>
                      {pivotProjectData.uniqueStatuses.map(s => (<th key={s} className="px-3 py-2 border-b border-blue-200 whitespace-nowrap text-blue-900 sticky top-0 bg-blue-50 z-20">{s}</th>))}
                      <th className="px-3 py-2 bg-blue-100 border-b border-blue-200 font-bold text-slate-800 sticky top-0 right-0 z-20">Tổng Cộng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pivotProjectData.uniqueProjects.map(p => (
                      <tr key={p} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-3 py-2 text-left font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{p}</td>
                        {pivotProjectData.uniqueStatuses.map(s => { const val = pivotProjectData.matrix[p]?.[s] || 0; return (<td key={s} className={`px-3 py-2 whitespace-nowrap ${val === 0 ? 'text-slate-300' : 'text-slate-600'}`}>{val === 0 ? '-' : formatNumber(val, projectMetric)}</td>); })}
                        <td className="px-3 py-2 font-bold text-slate-800 bg-blue-50/30">{formatNumber(pivotProjectData.rowTotals[p], projectMetric)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-100 font-bold text-slate-800 border-t border-blue-300">
                    <tr>
                      <td className="px-3 py-2 text-left sticky left-0 bottom-0 z-20 bg-blue-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Tổng Cộng</td>
                      {pivotProjectData.uniqueStatuses.map(s => (<td key={s} className="px-3 py-2 whitespace-nowrap">{formatNumber(pivotProjectData.colTotals[s], projectMetric)}</td>))}
                      <td className="px-3 py-2 text-blue-900 text-sm">{formatNumber(pivotProjectData.grandTotal, projectMetric)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">Không đủ dữ liệu để tạo bảng Pivot Công trình.</div>}
        </div>

        {/* --- Section 3.5: Pivot Table Material (Material Group Summary) --- */}
        <div ref={pivotMaterialRef} className="scroll-mt-24 w-full bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-600"/>Tổng hợp Vật tư theo Nhóm (Dữ liệu Vật tư)</h3>
               <div className="flex items-center gap-2">
                   {selectedMaterialGroups.length > 0 && (
                        <button onClick={() => setSelectedMaterialGroups([])} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center gap-1"><CloseIcon size={12}/> Bỏ chọn ({selectedMaterialGroups.length})</button>
                   )}
                   {filters.congTrinh.length > 0 && (<span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Đang lọc theo: {filters.congTrinh.join(', ')}</span>)}
               </div>
            </div>
            {pivotMaterialSummary ? (
                <div className="overflow-auto custom-scrollbar border border-slate-200 rounded-lg max-h-[500px]">
                    <table className="w-full text-xs text-right min-w-[500px] border-separate border-spacing-0">
                        <thead className="bg-emerald-50 text-slate-700 font-semibold uppercase">
                            <tr>
                                <th className="px-3 py-2 border-b border-emerald-200 w-8 sticky top-0 bg-emerald-50 z-10"></th>
                                <th className="px-3 py-2 text-left border-b border-emerald-200 text-emerald-900 sticky top-0 bg-emerald-50 z-10">Nhóm Vật Tư</th>
                                <th className="px-3 py-2 border-b border-emerald-200 text-emerald-900 sticky top-0 bg-emerald-50 z-10">SL Yêu Cầu</th>
                                <th className="px-3 py-2 border-b border-emerald-200 text-emerald-900 sticky top-0 bg-emerald-50 z-10">SL Đã Nhận (SAP)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                            {pivotMaterialSummary.sortedGroups.map(group => {
                                const isSelected = selectedMaterialGroups.includes(group);
                                return (
                                    <tr key={group} className={`transition-colors cursor-pointer group ${isSelected ? 'bg-emerald-100/70 hover:bg-emerald-100' : 'hover:bg-slate-50'}`} onClick={() => toggleMaterialGroup(group)}>
                                        <td className="px-3 py-2 text-center">{isSelected ? <CheckSquare size={14} className="text-emerald-600 inline" /> : <Square size={14} className="text-slate-300 inline group-hover:text-emerald-400" />}</td>
                                        <td className={`px-3 py-2 text-left font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{group}</td>
                                        <td className="px-3 py-2 text-slate-600">{formatNumber(pivotMaterialSummary.summary[group].req)}</td>
                                        <td className="px-3 py-2 text-slate-600">{formatNumber(pivotMaterialSummary.summary[group].rec)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-emerald-100 font-bold text-slate-800 border-t border-emerald-300 sticky bottom-0 z-10">
                            <tr><td className="px-3 py-2"></td><td className="px-3 py-2 text-left">Tổng Cộng</td><td className="px-3 py-2">{formatNumber(pivotMaterialSummary.totalReq)}</td><td className="px-3 py-2">{formatNumber(pivotMaterialSummary.totalRec)}</td></tr>
                        </tfoot>
                    </table>
                </div>
            ) : <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">Không có dữ liệu vật tư phù hợp.</div>}
        </div>

        {/* --- Section 3.6: Pivot Table Material Status (Group x Status) --- */}
        <div ref={pivotMaterialStatusRef} className="scroll-mt-24 w-full bg-white p-5 rounded-xl shadow-sm border border-emerald-100 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
               <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><ListFilter className="w-4 h-4 text-emerald-600"/>Tình trạng Vật tư (Nhóm x Trạng thái)</h3>
               <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                   <button onClick={() => setMatStatusMetric('COUNT_PR')} className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${matStatusMetric === 'COUNT_PR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Hash size={12}/> Số hạng mục PR</button>
                   <div className="w-px h-3 bg-slate-300 mx-1"></div>
                   <button onClick={() => setMatStatusMetric('SUM_QTY')} className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${matStatusMetric === 'SUM_QTY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Calculator size={12}/> Khối lượng Yêu cầu</button>
               </div>
            </div>
            {pivotMaterialStatusData ? (
                <div className="overflow-auto custom-scrollbar border border-slate-200 rounded-lg max-h-[500px]">
                    <table className="w-full text-xs text-right min-w-[800px] border-separate border-spacing-0">
                        <thead className="bg-emerald-50 text-slate-700 font-semibold uppercase">
                            <tr>
                                <th className="px-3 py-2 text-left sticky left-0 top-0 bg-emerald-100 border-b border-emerald-200 z-30 min-w-[200px] shadow-[1px_1px_2px_rgba(0,0,0,0.05)]">Nhóm Vật Tư</th>
                                {pivotMaterialStatusData.uniqueStatuses.map(s => (<th key={s} className="px-3 py-2 border-b border-emerald-200 whitespace-nowrap text-emerald-900 sticky top-0 bg-emerald-50 z-20">{s}</th>))}
                                <th className="px-3 py-2 bg-emerald-100 border-b border-emerald-200 font-bold text-slate-800 sticky top-0 right-0 z-20">Tổng Cộng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pivotMaterialStatusData.sortedGroups.map(group => (
                                <tr key={group} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-3 py-2 text-left font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{group}</td>
                                    {pivotMaterialStatusData.uniqueStatuses.map(s => { const val = pivotMaterialStatusData.matrix[group]?.[s] || 0; return (<td key={s} className={`px-3 py-2 whitespace-nowrap ${val === 0 ? 'text-slate-300' : 'text-slate-600'}`}>{val === 0 ? '-' : (matStatusMetric === 'SUM_QTY' ? formatDecimal(val) : formatNumber(val))}</td>); })}
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-emerald-50/30">{matStatusMetric === 'SUM_QTY' ? formatDecimal(pivotMaterialStatusData.rowTotals[group]) : formatNumber(pivotMaterialStatusData.rowTotals[group])}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-emerald-100 font-bold text-slate-800 border-t border-emerald-300">
                            <tr>
                                <td className="px-3 py-2 text-left sticky left-0 bottom-0 z-20 bg-emerald-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Tổng Cộng (Toàn bộ)</td>
                                {pivotMaterialStatusData.uniqueStatuses.map(s => (<td key={s} className="px-3 py-2 whitespace-nowrap">{matStatusMetric === 'SUM_QTY' ? formatDecimal(pivotMaterialStatusData.colTotals[s]) : formatNumber(pivotMaterialStatusData.colTotals[s])}</td>))}
                                <td className="px-3 py-2 text-emerald-900 text-sm">{matStatusMetric === 'SUM_QTY' ? formatDecimal(pivotMaterialStatusData.grandTotal) : formatNumber(pivotMaterialStatusData.grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">Không có dữ liệu để tạo bảng trạng thái vật tư.</div>}
        </div>

        {/* --- Section 5: Filtered Material List --- */}
        <div ref={materialListRef} className="w-full bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><Box className="w-4 h-4 text-slate-600"/>Chi tiết Dữ liệu Vật tư (Lọc theo Công trình)</h3>
                 <span className="text-xs text-slate-500">Hiển thị {displayedMaterialData.length} dòng</span>
             </div>
             <div className="overflow-auto custom-scrollbar border border-slate-200 rounded-lg">
                 <table className="w-full text-xs text-left whitespace-nowrap">
                     <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10">
                         <tr>
                             <th className="px-3 py-2 border-b border-slate-200 text-center w-10">#</th>
                             {MATERIAL_LIST_COLUMNS.map((col, idx) => (<th key={idx} className="px-3 py-2 border-b border-slate-200">{col}</th>))}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {paginatedMaterialList.length > 0 ? (
                             paginatedMaterialList.map((row, index) => (
                                 <tr key={index} className={`transition-colors border-b border-slate-100 ${getMaterialRowClassName(row)}`}>
                                     <td className="px-3 py-2 text-center opacity-70 font-mono text-xs">{(materialListPage - 1) * MATERIAL_ITEMS_PER_PAGE + index + 1}</td>
                                     {MATERIAL_LIST_COLUMNS.map((col, colIdx) => (<td key={colIdx} className="px-3 py-2">{row[col] || ''}</td>))}
                                 </tr>
                             ))
                         ) : <tr><td colSpan={MATERIAL_LIST_COLUMNS.length + 1} className="p-8 text-center text-slate-500">Không có dữ liệu hiển thị.</td></tr>}
                     </tbody>
                 </table>
             </div>
             {totalMaterialPages > 1 && (
                 <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
                     <div>Trang {materialListPage} / {totalMaterialPages}</div>
                     <div className="flex items-center gap-2">
                         <button onClick={() => setMaterialListPage(prev => Math.max(prev - 1, 1))} disabled={materialListPage === 1} className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                         <button onClick={() => setMaterialListPage(prev => Math.min(prev + 1, totalMaterialPages))} disabled={materialListPage === totalMaterialPages} className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
                     </div>
                 </div>
             )}
        </div>

        <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-wood-100 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
             <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-600"/>Biểu đồ Phân tích Tình trạng (Sản xuất)</h3>
             <MetricSwitcher current={chartMetric} onChange={setChartMetric} />
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{fontSize: 10, fill: '#64748b'}} interval={0}/>
                <YAxis tickFormatter={(val) => { if (val >= 1000000000) return (val/1000000000).toFixed(1) + 'B'; if (val >= 1000000) return (val/1000000).toFixed(1) + 'M'; if (val >= 1000) return (val/1000).toFixed(0) + 'K'; return val; }} tick={{fontSize: 10, fill: '#64748b'}} width={60}/>
                <RechartsTooltip formatter={(value: number) => [formatNumber(value, chartMetric), 'Giá trị']} labelStyle={{color: '#334155', fontWeight: 600}} contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}/>
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="value" name="Giá trị theo Tình trạng" stroke="#ba6a42" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} dot={{ r: 3, fill: '#ba6a42', strokeWidth: 0 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

const CompactStatCard = ({ title, value, icon, bg, borderColor, textColor, isParent = false }: { title: string, value: string | number, icon: React.ReactNode, bg: string, borderColor: string, textColor: string, isParent?: boolean }) => (
  <div className={`${isParent ? 'p-2 border-l-4 min-h-[60px]' : 'p-1.5 border-l-2 min-h-[45px]'} ${bg} ${borderColor} rounded-lg shadow-sm flex items-start justify-between hover:shadow-md transition-all`}>
    <div className="flex-1 mr-2 overflow-hidden">
      <p className={`${isParent ? 'text-xs' : 'text-[10px]'} font-bold uppercase tracking-wide text-slate-500 mb-0.5 truncate`}>{title}</p>
      <h4 className={`${isParent ? 'text-3xl' : 'text-2xl'} font-bold ${textColor} break-all`}>{value}</h4>
    </div>
    <div className={`${isParent ? 'p-1.5' : 'p-1'} bg-white/60 rounded-lg shadow-sm shrink-0`}>{icon}</div>
  </div>
);

export default Dashboard;