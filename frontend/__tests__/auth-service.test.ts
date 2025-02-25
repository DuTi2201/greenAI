import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Cookies from 'js-cookie';
import { authService } from '../lib/services/auth';
import { api } from '../lib/api';

// Mock các module
jest.mock('js-cookie');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AuthService', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();
    
    // Mock Cookies
    (Cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'token') return 'test-token';
      return null;
    });
    
    (Cookies.set as jest.Mock).mockImplementation(() => {});
    (Cookies.remove as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    mockAxios.restore();
  });

  test('login nên gọi API đăng nhập và lưu token', async () => {
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

    const response = await authService.login('test@example.com', 'password123');
    
    // Kiểm tra xem token có được lưu không
    expect(Cookies.set).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
    
    // Kiểm tra xem response có đúng không
    expect(response.data.token).toBe('test-token');
    expect(response.data.user.email).toBe('test@example.com');
  });

  test('register nên gọi API đăng ký và lưu token', async () => {
    // Giả lập API đăng ký thành công
    mockAxios.onPost('http://localhost:3001/api/auth/register').reply(200, {
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

    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      phoneNumber: '1234567890',
    };

    const response = await authService.register(registerData);
    
    // Kiểm tra xem token có được lưu không
    expect(Cookies.set).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
    
    // Kiểm tra xem response có đúng không
    expect(response.data.token).toBe('test-token');
    expect(response.data.user.email).toBe('test@example.com');
  });

  test('validateToken nên gọi API xác thực token', async () => {
    // Giả lập API xác thực token thành công
    mockAxios.onGet('http://localhost:3001/api/auth/validate').reply(200, {
      status: 'success',
      data: {
        valid: true,
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
        },
      },
    });

    const response = await authService.validateToken();
    
    // Kiểm tra xem response có đúng không
    expect(response.data.valid).toBe(true);
    expect(response.data.user.email).toBe('test@example.com');
  });

  test('refreshToken nên gọi API làm mới token và lưu token mới', async () => {
    // Giả lập API làm mới token thành công
    mockAxios.onPost('http://localhost:3001/api/auth/refresh-token').reply(200, {
      status: 'success',
      token: 'new-test-token',
      user: {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
      },
    });

    const response = await authService.refreshToken();
    
    // Kiểm tra xem token mới có được lưu không
    expect(Cookies.set).toHaveBeenCalledWith('new-test-token', expect.any(Object), expect.any(Object));
    
    // Kiểm tra xem response có đúng không
    expect(response.token).toBe('new-test-token');
  });

  test('logout nên xóa token', () => {
    authService.logout();
    
    // Kiểm tra xem token có bị xóa không
    expect(Cookies.remove).toHaveBeenCalledWith('token', expect.any(Object));
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
}); 