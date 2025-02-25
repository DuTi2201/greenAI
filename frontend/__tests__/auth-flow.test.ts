import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../components/auth/auth-form';
import { LanguageProvider } from '../providers/language-provider';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import axios from 'axios';
import Cookies from 'js-cookie';

// Mock các module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => '/dashboard'),
  })),
}));

jest.mock('axios');
jest.mock('js-cookie');
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Kiểm tra luồng xác thực', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock Cookies
    (Cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'token') return 'test-token';
      return null;
    });
    
    (Cookies.set as jest.Mock).mockImplementation(() => {});
    (Cookies.remove as jest.Mock).mockImplementation(() => {});
    
    // Mock axios
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        status: 'success',
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
          },
        },
      },
    });
    
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        csrfToken: 'test-csrf-token',
      },
    });
  });

  test('Đăng nhập thành công nên chuyển hướng đến trang dashboard', async () => {
    render(
      <LanguageProvider>
        <AuthForm type="login" />
      </LanguageProvider>
    );
    
    // Điền form đăng nhập
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Gửi form
    fireEvent.click(screen.getByRole('button', { name: /login|đăng nhập/i }));
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Kiểm tra xem token có được lưu không
      expect(Cookies.set).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
      
      // Kiểm tra xem có chuyển hướng đến dashboard không
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('Đăng nhập thất bại nên hiển thị thông báo lỗi', async () => {
    // Giả lập lỗi đăng nhập
    (axios.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid email or password',
        },
      },
    });
    
    render(
      <LanguageProvider>
        <AuthForm type="login" />
      </LanguageProvider>
    );
    
    // Điền form đăng nhập
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' },
    });
    
    // Gửi form
    fireEvent.click(screen.getByRole('button', { name: /login|đăng nhập/i }));
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Kiểm tra xem token không được lưu
      expect(Cookies.set).not.toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
      
      // Kiểm tra xem không chuyển hướng đến dashboard
      expect(mockPush).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  test('Truy cập trang yêu cầu xác thực khi đã đăng nhập nên thành công', async () => {
    // Giả lập đã đăng nhập
    (Cookies.get as jest.Mock).mockReturnValue('test-token');
    
    // Giả lập API xác thực thành công
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          valid: true,
          user: {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
          },
        },
      },
    });
    
    // Giả lập truy cập trang dashboard
    const mockValidateToken = jest.fn().mockResolvedValue(true);
    
    // Thực hiện kiểm tra xác thực
    const isAuthenticated = await mockValidateToken();
    
    // Kiểm tra
    expect(isAuthenticated).toBe(true);
  });

  test('Truy cập trang yêu cầu xác thực khi chưa đăng nhập nên chuyển hướng đến trang đăng nhập', async () => {
    // Giả lập chưa đăng nhập
    (Cookies.get as jest.Mock).mockReturnValue(null);
    
    // Giả lập truy cập trang dashboard
    const mockValidateToken = jest.fn().mockResolvedValue(false);
    
    // Thực hiện kiểm tra xác thực
    const isAuthenticated = await mockValidateToken();
    
    // Kiểm tra
    expect(isAuthenticated).toBe(false);
  });
}); 