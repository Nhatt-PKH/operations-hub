import { User, ApiResponse } from '../types';

// *** QUAN TRỌNG: Thay thế URL bên dưới bằng URL Web App bạn tạo từ Google Apps Script ***
// Ví dụ: https://script.google.com/macros/s/AKfycbx.../exec
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZrf4MKmWPRlaBMqIq0PUaNSMZ1yJAiZDFQl_aQ7QZQ5Himtdtza5LBtgTXxgeYqJWSg/exec'; 

/**
 * Gọi API tới Google Apps Script
 */
const callApi = async <T>(action: string, payload: any = {}): Promise<ApiResponse<T>> => {
  if (GOOGLE_SCRIPT_URL.includes('DÁN_LINK')) {
    console.warn("Chưa cấu hình Google Script URL. Đang chạy chế độ giả lập (Mock Mode).");
    return mockApiHandler(action, payload);
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=${action}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    // Xử lý lỗi phân quyền cụ thể từ Google Script để báo lỗi dễ hiểu hơn
    if (!result.success && result.message && (
        result.message.includes("You do not have permission") || 
        result.message.includes("Authorization is required")
    )) {
        return { 
            success: false, 
            message: "Lỗi Server: Script chưa được cấp quyền gửi Email. Vui lòng Deploy lại Backend." 
        };
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: "Lỗi kết nối Server hoặc cấu hình Script sai." };
  }
};

export const userService = {
  login: async (username: string, password: string) => {
    return callApi<User>('login', { username, password });
  },

  getUsers: async () => {
    return callApi<User[]>('getUsers');
  },

  // Added new fields to omit list
  addUser: async (user: Omit<User, 'id' | 'status'>) => {
    return callApi('addUser', user);
  },

  updateUser: async (user: Partial<User>) => {
    return callApi('updateUser', user);
  },

  deleteUser: async (id: string) => {
    return callApi('deleteUser', { id });
  },

  // OTP Features
  forgotPassword: async (email: string) => {
    return callApi('forgotPassword', { email });
  },

  verifyOtpAndReset: async (email: string, otp: string, newPassword: string) => {
    return callApi('verifyOtp', { email, otp, newPassword });
  },

  // Change Password (User self-service)
  changePassword: async (username: string, oldPassword: string, newPassword: string) => {
    return callApi('changePassword', { username, oldPassword, newPassword });
  }
};

// --- MOCK HANDLER (Updated for new types) ---
let MOCK_USERS: User[] = [
  { 
    id: '1', 
    username: 'admin', 
    password: '123', 
    fullName: 'Quản trị viên', 
    role: 'ADMIN',
    // Admin has full access implicitly, but keeping list for clarity
    permissions: ['dashboard', 'production', 'orders', 'inventory', 'materials', 'users'], 
    status: 'ACTIVE',
    email: 'admin@example.com',
    department: 'IT',
    msnv: 'NV001'
  },
  { 
    id: '2', 
    username: 'manager', 
    password: '123', 
    fullName: 'Quản lý SX', 
    role: 'USER',
    permissions: ['dashboard', 'production', 'orders', 'inventory'], // Added 'inventory' permission
    status: 'ACTIVE',
    email: 'manager@example.com',
    department: 'Production',
    msnv: 'NV002'
  }
];

const mockApiHandler = async (action: string, payload: any): Promise<ApiResponse<any>> => {
  await new Promise(r => setTimeout(r, 800));

  switch (action) {
    case 'login':
      const user = MOCK_USERS.find(u => u.username === payload.username && u.password === payload.password);
      if (user) {
        if(user.status !== 'ACTIVE') return { success: false, message: 'Tài khoản bị khóa' };
        const { password, ...safeUser } = user;
        return { success: true, user: safeUser as User };
      }
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu (Mặc định: admin/123)' };
    
    case 'getUsers':
      const safeUsers = MOCK_USERS.map(({password, ...u}) => u);
      return { success: true, data: safeUsers };

    case 'addUser':
      if (MOCK_USERS.find(u => u.username === payload.username)) return { success: false, message: 'Tên đăng nhập tồn tại' };
      const newUser = { ...payload, id: Math.random().toString(36).substr(2, 9), status: 'ACTIVE' };
      MOCK_USERS.push(newUser);
      return { success: true, message: 'Thêm thành công (Mock)' };

    case 'updateUser':
      const idx = MOCK_USERS.findIndex(u => u.id === payload.id);
      if (idx !== -1) {
        MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...payload };
        return { success: true, message: 'Cập nhật thành công (Mock)' };
      }
      return { success: false, message: 'User not found' };

    case 'deleteUser':
      MOCK_USERS = MOCK_USERS.filter(u => u.id !== payload.id);
      return { success: true, message: 'Xóa thành công (Mock)' };

    case 'forgotPassword':
      return { success: true, message: 'Mã OTP giả lập: 123456 (Mock)' };
    
    case 'verifyOtp':
      if (payload.otp === '123456') return { success: true, message: 'Đổi mật khẩu thành công (Mock)' };
      return { success: false, message: 'Mã OTP sai (Mock)' };
    
    case 'changePassword':
        const uIdx = MOCK_USERS.findIndex(u => u.username === payload.username && u.password === payload.oldPassword);
        if (uIdx !== -1) {
            MOCK_USERS[uIdx].password = payload.newPassword;
            return { success: true, message: 'Đổi mật khẩu thành công (Mock)' };
        }
        return { success: false, message: 'Mật khẩu cũ không đúng (Mock)' };

    default:
      return { success: false, message: 'Unknown action' };
  }
};