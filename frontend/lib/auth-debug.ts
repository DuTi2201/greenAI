import Cookies from 'js-cookie';
import axios from 'axios';

// Hàm để kiểm tra token trong cookie
export const checkTokenInCookie = () => {
  const token = Cookies.get('token');
  console.log('Token trong cookie:', token ? 'Có' : 'Không');
  console.log('Token value:', token);
  return !!token;
};

// Hàm để kiểm tra token trong localStorage (nếu có)
export const checkTokenInLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('Token trong localStorage:', token ? 'Có' : 'Không');
    console.log('Token value:', token);
    return !!token;
  }
  return false;
};

// Hàm để kiểm tra token trong sessionStorage (nếu có)
export const checkTokenInSessionStorage = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    console.log('Token trong sessionStorage:', token ? 'Có' : 'Không');
    console.log('Token value:', token);
    return !!token;
  }
  return false;
};

// Hàm để kiểm tra CSRF token
export const checkCSRFToken = () => {
  const csrfToken = Cookies.get('XSRF-TOKEN');
  console.log('CSRF token trong cookie:', csrfToken ? 'Có' : 'Không');
  console.log('CSRF token value:', csrfToken);
  return !!csrfToken;
};

// Hàm để kiểm tra xem token có hợp lệ không
export const validateTokenWithServer = async () => {
  const token = Cookies.get('token');
  if (!token) {
    console.log('Không có token để xác thực');
    return false;
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await axios.get(`${API_URL}/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { _t: new Date().getTime() }
    });
    
    console.log('Kết quả xác thực token:', response.data);
    return true;
  } catch (error: any) {
    console.log('Lỗi xác thực token:', error.response?.status, error.response?.data);
    return false;
  }
};

// Hàm để kiểm tra quá trình làm mới token
export const testRefreshToken = async () => {
  const token = Cookies.get('token');
  if (!token) {
    console.log('Không có token để làm mới');
    return false;
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      params: { _t: new Date().getTime() }
    });
    
    console.log('Kết quả làm mới token:', response.data);
    
    if (response.data.token) {
      console.log('Token mới:', response.data.token);
      Cookies.set('token', response.data.token, { expires: 7, path: '/' });
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.log('Lỗi làm mới token:', error.response?.status, error.response?.data);
    return false;
  }
};

// Hàm để kiểm tra các header trong request
export const checkRequestHeaders = async () => {
  const token = Cookies.get('token');
  const csrfToken = Cookies.get('XSRF-TOKEN');
  
  console.log('Headers sẽ được gửi:');
  console.log('- Authorization:', token ? `Bearer ${token}` : 'Không có');
  console.log('- X-CSRF-Token:', csrfToken || 'Không có');
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { 
        Authorization: token ? `Bearer ${token}` : '',
        'X-CSRF-Token': csrfToken || ''
      },
      params: { _t: new Date().getTime() }
    });
    
    console.log('Kết quả kiểm tra headers:', response.data);
    return true;
  } catch (error: any) {
    console.log('Lỗi kiểm tra headers:', error.response?.status, error.response?.data);
    return false;
  }
};

// Hàm để kiểm tra toàn bộ quá trình xác thực
export const debugAuthentication = async () => {
  console.log('=== BẮT ĐẦU KIỂM TRA XÁC THỰC ===');
  
  console.log('\n1. Kiểm tra token trong storage:');
  checkTokenInCookie();
  checkTokenInLocalStorage();
  checkTokenInSessionStorage();
  
  console.log('\n2. Kiểm tra CSRF token:');
  checkCSRFToken();
  
  console.log('\n3. Kiểm tra xác thực token với server:');
  await validateTokenWithServer();
  
  console.log('\n4. Kiểm tra làm mới token:');
  await testRefreshToken();
  
  console.log('\n5. Kiểm tra headers trong request:');
  await checkRequestHeaders();
  
  console.log('\n=== KẾT THÚC KIỂM TRA XÁC THỰC ===');
}; 