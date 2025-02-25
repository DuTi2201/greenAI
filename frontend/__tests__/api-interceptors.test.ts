import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Cookies from 'js-cookie';
import { api, fetchCSRFToken } from '../lib/api';

// Mock các module
jest.mock('js-cookie');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('API Interceptors', () => {
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

  test('Request interceptor nên thêm token vào header khi có token', async () => {
    // Giả lập API call thành công
    mockAxios.onGet('http://localhost:3001/api/test').reply(200, { data: 'test' });

    try {
      await api.get('/test');
      
      // Kiểm tra xem token có được thêm vào header không
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token');
    } catch (error) {
      fail('Should not throw an error');
    }
  });

  test('Request interceptor nên thêm CSRF token vào header khi có CSRF token', async () => {
    // Giả lập API call thành công
    mockAxios.onGet('http://localhost:3001/api/test').reply(200, { data: 'test' });

    try {
      await api.get('/test');
      
      // Kiểm tra xem CSRF token có được thêm vào header không
      expect(api.defaults.headers.common['X-CSRF-Token']).toBe('test-csrf-token');
    } catch (error) {
      fail('Should not throw an error');
    }
  });

  test('Response interceptor nên làm mới token khi nhận lỗi 401', async () => {
    // Giả lập API call thất bại với lỗi 401
    mockAxios.onGet('http://localhost:3001/api/test').replyOnce(401, { message: 'Unauthorized' });
    
    // Giả lập API refresh token thành công
    mockAxios.onPost('http://localhost:3001/api/auth/refresh-token').replyOnce(200, {
      token: 'new-test-token',
    });
    
    // Giả lập API call thành công sau khi làm mới token
    mockAxios.onGet('http://localhost:3001/api/test').replyOnce(200, { data: 'test' });

    try {
      await api.get('/test');
      
      // Kiểm tra xem token mới có được lưu không
      expect(Cookies.set).toHaveBeenCalledWith('token', 'new-test-token', expect.any(Object));
    } catch (error) {
      fail('Should not throw an error');
    }
  });

  test('Response interceptor nên xóa token và chuyển hướng khi refresh token thất bại', async () => {
    // Giả lập API call thất bại với lỗi 401
    mockAxios.onGet('http://localhost:3001/api/test').replyOnce(401, { message: 'Unauthorized' });
    
    // Giả lập API refresh token thất bại
    mockAxios.onPost('http://localhost:3001/api/auth/refresh-token').replyOnce(401, {
      message: 'Invalid refresh token',
    });

    try {
      await api.get('/test');
      fail('Should throw an error');
    } catch (error) {
      // Kiểm tra xem token có bị xóa không
      expect(Cookies.remove).toHaveBeenCalledWith('token', expect.any(Object));
    }
  });

  test('fetchCSRFToken nên lấy và lưu CSRF token', async () => {
    mockAxios.onGet('http://localhost:3001/api/auth/csrf-token').reply(200, {
      csrfToken: 'new-csrf-token',
    });

    await fetchCSRFToken();
    
    // Kiểm tra xem CSRF token có được lưu không
    expect(Cookies.set).toHaveBeenCalledWith('XSRF-TOKEN', 'new-csrf-token', expect.any(Object));
  });
}); 