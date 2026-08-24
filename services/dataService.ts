

import Papa from 'papaparse';
import { DataRow, ColumnDefinition, COMMON_DATE_HEADERS, COMMON_STATUS_HEADERS } from '../types';

// *** CẤU HÌNH LIÊN KẾT GOOGLE SHEETS ***
// Lưu ý: Các link này phải là link "Xuất bản lên web" (Publish to web) -> Chọn định dạng CSV.
// Link mẫu: https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
const PRODUCTION_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQS0CbunDlqjWttQDjh5QKhcWqFp76gMp0fI4rFjPiCJZq3L_EzFq28uZHQMqBvj8QWisrw27Y0xmqL/pub?output=csv';
const MATERIAL_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRNg-C0cpVMXTzvozM9YQSa4KIzOXmUx8r30wQyqkB-EAvKAQkYabWX5D4lflCeUi_qisZZDtiDR_7M/pub?output=csv';
const KHSX_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ09xcKoQsw7P4Efgv9WkiVeXtcp1l-SCmAG56wSFzNQnEOxnptx-9FK7r66_v_qe91ak7_oR6uOTI/pub?output=csv';
const ORDER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS00UiTnxIVZKb98obSXTGMsw3BGqmv2Tfd07vEugWBM5tlckoX3J3wzz61VTe8ENoBOJB_LkJcCEcy/pub?output=csv';
const INVENTORY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1Vt60hYowDQsbIDLwz65bZ-pnoO6-9NzlQKLOsE5cEEkRroFoL1ok6w6NMtaFKtts3UPufM0oWkFp/pub?output=csv';
const TKBV_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7PQK0D9u-AvxumqNU85jWZjbrl0f2sHDgX3ip_XovvptzjUw6Psaqy5roo44_wuaGfKD5p4aVPRiY/pub?output=csv';
const PTHSP_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRx1qNl2CLetbdTIQqf0IKgcpmnCIWp68Tl4k0I0DBUqubdmtTabPznXaWjg5zFTtwJout4thJleu9g/pub?output=csv';
const ANALYSIS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLj0AFJBo0UbfWuMsdw3761yTTSioN9Zt0Hrwoe2PZisZ6KtLRfCER9FTuuxGY8HJmv-tPDJdQsrYV/pub?output=csv';
const YEARLY_PLAN_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTzOpOduvkY8V2GXeCUjr0LpLS25wJl6K2NsMgNZi_NTNYejaejy_EnlDoVunqMjU68jfNWNE7s5stR/pub?output=csv';
const EXPORT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQP14PKN3mbwVnRK8y3QcerrlXLuHNLeKZrshnXZQZWiR8eXkdkZOEJjzgDrS5-KD6k5vnGiFojxLSx/pub?output=csv';
const ATTENDANCE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-C3_ov_ntmPkVKOoYKAhGs2mhqJNWvw1PjbdfPAR70KeEfYb_v81bDSiC2mDDAXHhuVxvC-V8yLaK/pub?output=csv';
const STOCK_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNW2TE6tXRC4f61keIq3LKttdWTVMJ1X2e06w8MrkyfGAAQc0wlUBGRkHqUwaQI5FmLw8F1tfZ3Gca/pub?gid=0&single=true&output=csv';

const fetchFromUrl = async (url: string): Promise<{ data: DataRow[]; columns: ColumnDefinition[] }> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as DataRow[];

          if (rawData.length === 0) {
            resolve({ data: [], columns: [] });
            return;
          }

          // Dynamic column generation based on first row keys
          // Filter out empty keys (unnamed columns)
          const headers = Object.keys(rawData[0]).filter(k => k && k.trim() !== '');

          const columns: ColumnDefinition[] = headers.map(header => ({
            key: header,
            label: header,
            type: detectColumnType(header, rawData)
          }));

          resolve({ data: rawData, columns });
        },
        error: (error: Error) => {
          console.error("CSV Parse Error:", error);
          // Return empty on error to prevent crash
          resolve({ data: [], columns: [] });
        }
      });
    });
  } catch (error) {
    console.error("Error fetching sheet:", error);
    // Don't throw, just return empty so app doesn't crash completely
    return { data: [], columns: [] };
  }
};

export const fetchProductionData = () => fetchFromUrl(PRODUCTION_SHEET_URL);
export const fetchMaterialData = () => fetchFromUrl(MATERIAL_SHEET_URL);
export const fetchKhsxData = () => fetchFromUrl(KHSX_SHEET_URL);
export const fetchOrderData = () => fetchFromUrl(ORDER_SHEET_URL);
export const fetchInventoryData = () => fetchFromUrl(INVENTORY_SHEET_URL);
export const fetchTkbvData = () => fetchFromUrl(TKBV_SHEET_URL);
export const fetchPthspData = () => fetchFromUrl(PTHSP_SHEET_URL);
export const fetchAnalysisData = () => fetchFromUrl(ANALYSIS_SHEET_URL);
export const fetchYearlyPlanData = () => fetchFromUrl(YEARLY_PLAN_SHEET_URL);
export const fetchExportData = () => fetchFromUrl(EXPORT_SHEET_URL);
export const fetchAttendanceData = () => fetchFromUrl(ATTENDANCE_SHEET_URL);
export const fetchStockData = () => fetchFromUrl(STOCK_SHEET_URL);

const detectColumnType = (header: string, data: DataRow[]): 'string' | 'number' | 'date' => {
  // Heuristic 1: Check header name
  const lowerHeader = header.toLowerCase();
  if (COMMON_DATE_HEADERS.some(h => lowerHeader.includes(h))) return 'date';

  // Heuristic 2: Check content of first few non-null rows
  for (let i = 0; i < Math.min(data.length, 5); i++) {
    const value = data[i][header];
    if (value && typeof value === 'string') {
      // Simple date regex check (DD/MM/YYYY or YYYY-MM-DD)
      if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(value)) return 'date';
      // Number check
      if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
    }
  }

  return 'string';
};

/**
 * Chuyển đổi các giá trị số trong dữ liệu từ định dạng GSheet VN (1.234,01)
 * sang số thực (1234.01) trước khi xuất CSV/Excel.
 * 
 * Hàm tự động phát hiện các cột chứa giá trị số (dựa trên nội dung dữ liệu),
 * chuyển đổi chúng thành kiểu number thực sự để Excel đọc đúng.
 */
const parseVNNumber = (val: any): number | null => {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  let s = String(val).trim();
  // Loại bỏ ký tự không phải số, dấu chấm, dấu phẩy, dấu trừ
  const cleaned = s.replace(/[^\d.,-]/g, '');
  if (!cleaned) return null;
  s = cleaned;

  // Nhiều dấu chấm → chấm là dấu phân cách hàng nghìn VN (1.234.567,89)
  if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, '').replace(',', '.');
    const r = parseFloat(s);
    return isNaN(r) ? null : r;
  }
  // Nhiều dấu phẩy → phẩy là dấu phân cách hàng nghìn US (1,234,567.89)
  if ((s.match(/,/g) || []).length > 1) {
    s = s.replace(/,/g, '');
    const r = parseFloat(s);
    return isNaN(r) ? null : r;
  }
  // Có cả dấu chấm và dấu phẩy
  if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
    if (s.lastIndexOf('.') < s.lastIndexOf(',')) {
      // 1.234,56 → VN format
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 → US format
      s = s.replace(/,/g, '');
    }
    const r = parseFloat(s);
    return isNaN(r) ? null : r;
  }
  // Chỉ có dấu chấm
  if (s.indexOf('.') !== -1) {
    const parts = s.split('.');
    // 1.234 (3 chữ số sau dấu chấm) → dấu phân cách hàng nghìn
    if (parts.length === 2 && parts[1].length === 3) {
      s = s.replace('.', '');
    }
    const r = parseFloat(s);
    return isNaN(r) ? null : r;
  }
  // Chỉ có dấu phẩy → dấu thập phân VN (1234,56)
  if (s.indexOf(',') !== -1) {
    s = s.replace(',', '.');
    const r = parseFloat(s);
    return isNaN(r) ? null : r;
  }
  const r = parseFloat(s);
  return isNaN(r) ? null : r;
};

/**
 * Chuyển đổi tất cả các cột số trong mảng dữ liệu trước khi xuất.
 * Tự động phát hiện cột số bằng cách kiểm tra giá trị của 10 dòng đầu.
 */
export const convertNumericColumnsForExport = (data: any[]): any[] => {
  if (!data || data.length === 0) return data;

  const headers = Object.keys(data[0]);
  // Phát hiện cột nào chứa giá trị số bằng cách kiểm tra vài dòng đầu
  const numericCols = new Set<string>();
  const sampleSize = Math.min(data.length, 10);

  for (const header of headers) {
    let numericCount = 0;
    let nonEmptyCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const val = data[i][header];
      if (val === null || val === undefined || String(val).trim() === '') continue;
      nonEmptyCount++;
      const parsed = parseVNNumber(val);
      if (parsed !== null) numericCount++;
    }
    // Nếu >= 70% giá trị không rỗng là số → coi là cột số
    if (nonEmptyCount > 0 && (numericCount / nonEmptyCount) >= 0.7) {
      numericCols.add(header);
    }
  }

  if (numericCols.size === 0) return data;

  return data.map(row => {
    const newRow: any = { ...row };
    numericCols.forEach(col => {
      const parsed = parseVNNumber(row[col]);
      if (parsed !== null) {
        newRow[col] = parsed;
      }
    });
    return newRow;
  });
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn("exportToCSV: Dữ liệu rỗng, không có dòng nào để xuất!", data);
    return;
  }
  // Tự động chuyển đổi cột số VN (1.234,01) → number (1234.01) trước khi xuất
  const convertedData = convertNumericColumnsForExport(data);
  const csv = Papa.unparse(convertedData);
  console.log(`exportToCSV [${filename}] - Số dòng: ${data.length}, Kích thước CSV: ${csv.length} ký tự`);
  console.log("CSV Preview:", csv.slice(0, 300));

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const finalFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportToExcel = async (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // Tự động chuyển đổi cột số VN (1.234,01) → number (1234.01) trước khi xuất
  const convertedData = convertNumericColumnsForExport(data);
  
  // Dynamically load the xlsx library from CDN to avoid npm/Vite issues
  if (!(window as any).XLSX) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  const XLSX = (window as any).XLSX;
  const worksheet = XLSX.utils.json_to_sheet(convertedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};