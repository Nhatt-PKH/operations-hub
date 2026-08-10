

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

export const exportToCSV = (data: DataRow[], filename: string) => {
  const csv = Papa.unparse(data);
  // Add Byte Order Mark (BOM) for Excel to recognize UTF-8
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = async (data: any[], filename: string) => {
  if (data.length === 0) return;
  
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
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};