

export const TARGET_COLUMN_NAMES = {

  HEX: 'HEX',

  CONG_TRINH: 'TÊN CÔNG TRÌNH',

  XUONG: 'XƯỞNG CHÍNH',

  TINH_TRANG: 'TÌNH TRẠNG',

  TINH_TRANG_IPO: 'TÌNH TRẠNG IPO', // New Column

  GIA_TRI_CON_LAI: 'GIÁ TRỊ ĐƠN HÀNG CÒN LẠI',

  GIA_TRI_THUC_TE: 'GIÁ TRỊ CÒN LẠI',

  // New columns for Project Summary Section
  TRI_GIA_DON_HANG_TONG: 'TRỊ GIÁ ĐƠN HÀNG TỔNG',
  THANH_TIEN_TINH_PHIEU: 'THÀNH TIỀN TÍNH PHIẾU',

  THANH_TIEN_NHAP_KHO: 'THÀNH TIỀN NHẬP KHO LŨY KẾ', // Cột cũ của Production View
  INVENTORY_AMOUNT: 'THÀNH TIỀN NHẬP KHO', // Cột mới chính xác cho Inventory View
  EXPORT_AMOUNT: 'THÀNH TIỀN XUẤT KHO', // Correct column for Export View
  NHAP_KHO_TUAN: 'NHẬP KHO TUẦN', // Cột mới theo yêu cầu

  // Inventory Specific Date Columns
  NAM: 'NĂM',
  THANG: 'THÁNG',
  NGAY: 'NGÀY',
  DATE: 'DATE', // New Column for Inventory Overview
  TUAN: 'TUẦN', // New Column for Weekly Analysis

  TEN_HANG_MUC: 'TÊN HẠNG MỤC',

  // Production Days Columns
  SO_NGAY_CD_HIEN_TAI: 'SỐ NGÀY CĐ HIỆN TẠI',

  // KHSX Specific Columns
  THANH_TIEN_KE_HOACH: 'THÀNH TIỀN KẾ HOẠCH',
  PHAN_LOAI_KH: 'PHÂN LOẠI KH',
  NGAY_KHNK: 'NGÀY KHNK',
  MA_CONG_TRINH: 'MÃ CÔNG TRÌNH',

  // Order Data Specific Columns
  NGAY_NHAN_TU_PM: 'NGÀY NHẬN TỪ PM',

  // TKBV Specific Columns
  NGAY_NHAN: 'NGÀY NHẬN',

  // PTHSP Specific Columns
  NGAY_HOAN_THANH: 'NGÀY HOÀN THÀNH',
  THANH_TIEN_PTHSP: 'THÀNH TIỀN',

  // Material View Columns
  SO_PR: 'SỐ PR',
  SO_PO: 'SỐ PO',
  TRACKING_NO: 'TRACKINGNO',
  TEN_VAT_TU: 'TÊN VẬT TƯ',
  NHOM_VT: 'NHÓM VT',

  // Material Dashboard Columns
  SL_YEU_CAU: 'SỐ LƯỢNG YÊU CẦU',
  SL_DA_NHAN: 'SỐ LƯỢNG ĐÃ NHẬN (SAP)',
  STATUS: 'TRẠNG THÁI',
  STATUS_SAP: 'TRẠNG THÁI SAP',
  PR_ITEM: 'PR LINE',
  MATERIAL_CODE: 'MÃ VẬT TƯ SAP',
  BASE_UNIT: 'ĐVT',
  REQUEST_DATE: 'NGÀY PR',
  EST_DELIVERY: 'NGÀY DỰ KIẾN GIAO HÀNG PMH NHẬP',
  REMAINING_QTY: 'SỐ LƯỢNG CÒN LẠI',
  STATUS_PO: 'TÌNH TRẠNG PO',
  NOTE_PO: 'GHI CHÚ TÌNH TRẠNG PO',
  PR_LINE_COMBINED: 'PR&LINE',
  ACTUAL_DATE: 'NGÀY VỀ-KHO BÁO',
  ACTUAL_QTY: 'SL HÀNG VỀ THỰC TẾ-KHO BÁO',
  TEAM_PR_NOTE: 'TEAM PR NOTE',
  REQUISITIONER: 'NGƯỜI YÊU CẦU',

  // Weekly Analysis New Columns
  DUNG_KE_HOACH: 'ĐÚNG KẾ HOẠCH',
  THUC_HIEN_DUNG_KE_HOACH_1_PHAN: 'THỰC HIỆN ĐÚNG KẾ HOẠCH 1 PHẦN',
  ROT_KE_HOACH: 'RỚT KẾ HOẠCH',
  THUC_HIEN_ROT_KE_HOACH_1_PHAN: 'THỰC HIỆN RỚT KẾ HOẠCH 1 PHẦN',
  NHAP_KHO_TRUOC_KE_HOACH: 'NHẬP KHO TRƯỚC KẾ HOẠCH',
  VUOT_KE_HOACH: 'VƯỢT KẾ HOẠCH',
  NHAP_KHO_NGOAI_KE_HOACH: 'NHẬP KHO NGOÀI KẾ HOẠCH',

  // Attendance Columns
  SO_LUONG_CONG_NHAN: 'SỐ LƯỢNG CÔNG NHÂN',
  GIO_CONG_HC: 'GIỜ CÔNG HÀNH CHÍNH',
  GIO_CONG_TC: 'GIỜ CÔNG TĂNG CA',
  DINH_BIEN: 'ĐỊNH BIÊN'
};

export type DataRow = Record<string, any>;

export interface ColumnDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
}

export const COMMON_DATE_HEADERS = ['ngày', 'date', 'time', 'hạn', 'delivery', 'actual'];

export const COMMON_STATUS_HEADERS = ['trạng thái', 'tình trạng', 'status'];

export const PRODUCTION_DEFAULT_VIEW_COLUMNS = [
  TARGET_COLUMN_NAMES.HEX,
  TARGET_COLUMN_NAMES.CONG_TRINH,
  TARGET_COLUMN_NAMES.XUONG,
  TARGET_COLUMN_NAMES.TEN_HANG_MUC,
  TARGET_COLUMN_NAMES.TINH_TRANG_IPO,
  TARGET_COLUMN_NAMES.TINH_TRANG,
  TARGET_COLUMN_NAMES.SO_NGAY_CD_HIEN_TAI,
  TARGET_COLUMN_NAMES.GIA_TRI_THUC_TE,
  TARGET_COLUMN_NAMES.THANH_TIEN_NHAP_KHO,
  TARGET_COLUMN_NAMES.TRI_GIA_DON_HANG_TONG,
  TARGET_COLUMN_NAMES.THANH_TIEN_TINH_PHIEU
];

export interface AppView {
  id: string;
  path: string;
  label: string;
  iconName?: string;
}

export const APP_VIEWS: AppView[] = [
  { id: 'dashboard', path: '/', label: 'Tổng quan', iconName: 'LayoutDashboard' },
  { id: 'production', path: '/list', label: 'Dữ liệu Sản xuất', iconName: 'Table' },
  { id: 'yearly_plan_data', path: '/yearly-plan', label: 'Dữ liệu kế hoạch năm', iconName: 'CalendarRange' },
  { id: 'orders', path: '/orders', label: 'Dữ liệu Đơn hàng tổng', iconName: 'ShoppingCart' },
  { id: 'inventory', path: '/inventory', label: 'Dữ liệu Nhập kho', iconName: 'Import' },
  { id: 'export', path: '/export', label: 'Dữ liệu Xuất kho', iconName: 'Export' },
  { id: 'attendance', path: '/attendance', label: 'Dữ liệu Điểm danh', iconName: 'Clock' },
  { id: 'khsx', path: '/khsx', label: 'Kế hoạch SX', iconName: 'Calendar' },
  { id: 'analysis', path: '/analysis', label: 'Dữ liệu Phân tích KH-TH', iconName: 'TrendingUp' },
  { id: 'tkbv', path: '/tkbv', label: 'Dữ liệu TKBV', iconName: 'FileText' },
  { id: 'pthsp', path: '/pthsp', label: 'Dữ liệu PTHSP', iconName: 'ClipboardList' },
  { id: 'materials', path: '/materials', label: 'Vật tư', iconName: 'Package' },
  { id: 'users', path: '/users', label: 'Quản trị User', iconName: 'Shield' }
];

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  permissions: string[];
  msnv?: string;
  department?: string;
  note?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: T;
}