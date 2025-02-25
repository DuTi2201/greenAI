import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Cookies from 'js-cookie';
import { api, setAuthToken, fetchCSRFToken } from '../lib/api';
import { authService } from '../lib/services/auth';

// Mock các module
jest.mock('js-cookie');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Kiểm tra chức năng xác thực', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();
    
    // Mock Cookies
    (Cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'token') return 'test-token';
      if (name === 'XSRF-TOKEN') return 'test-csrf-token';
      return null;
    });
    
    (Cookies.set as jest.Mock).mockImplementation(() => {});
    (Cookies.remove as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    mockAxios.restore();
  });

  test('Đăng nhập thành công nên lưu token vào cookie', async () => {
    // Giả lập API đăng nhập thành công
    mockAxios.onPost('http://localhost:3001/api/auth/login').reply(200, {
      status: 'success',
      data: {
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
        },
      },
    });

    // Thực hiện đăng nhập
    await authService.login('test@example.com', 'password123');

    // Kiểm tra xem token có được lưu không
    expect(Cookies.set).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
  });

  test('setAuthToken nên thiết lập token trong cookie và header', () => {
    setAuthToken('new-test-token');
    
    // Kiểm tra xem token có được lưu vào cookie không
    expect(Cookies.set).toHaveBeenCalledWith('token', 'new-test-token', expect.any(Object));
    
    // Kiểm tra xem token có được thiết lập trong header không
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer new-test-token');
  });

  test('fetchCSRFToken nên lấy và lưu CSRF token', async () => {
    mockAxios.onGet('http://localhost:3001/api/auth/csrf-token').reply(200, {
      csrfToken: 'new-csrf-token',
    });

    await fetchCSRFToken();
    
    // Kiểm tra xem CSRF token có được lưu vào cookie không
    expect(Cookies.set).toHaveBeenCalledWith('XSRF-TOKEN', 'new-csrf-token', expect.any(Object));
  });

  test('isAuthenticated nên trả về true khi có token', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test-token');
    
    const result = authService.isAuthenticated();
    
    expect(result).toBe(true);
  });

  test('isAuthenticated nên trả về false khi không có token', () => {
    (Cookies.get as jest.Mock).mockReturnValue(null);
    
    const result = authService.isAuthenticated();
    
    expect(result).toBe(false);
  });

  test('logout nên xóa token', () => {
    authService.logout();
    
    expect(Cookies.remove).toHaveBeenCalledWith('token', expect.any(Object));
  });
}); 