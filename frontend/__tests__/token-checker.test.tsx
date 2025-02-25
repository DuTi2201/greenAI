import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TokenChecker } from '../components/auth/token-checker';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import * as authFix from '../lib/auth-fix';

// Mock các module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('js-cookie');
jest.mock('axios');
jest.mock('../lib/auth-fix', () => ({
  checkAndRestoreToken: jest.fn(),
  fixLoginIssue: jest.fn(),
  setAuthTokenFixed: jest.fn(),
}));

describe('TokenChecker', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock usePathname
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    
    // Mock Cookies
    (Cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'token') return 'test-token';
      return null;
    });
    
    // Mock authFix
    (authFix.checkAndRestoreToken as jest.Mock).mockReturnValue(true);
    (authFix.fixLoginIssue as jest.Mock).mockResolvedValue(true);
  });

  test('Nên bỏ qua kiểm tra khi ở trang đăng nhập', async () => {
    // Giả lập đang ở trang đăng nhập
    (usePathname as jest.Mock).mockReturnValue('/login');
    
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Không nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).not.toHaveBeenCalled();
      
      // Không nên gọi fixLoginIssue
      expect(authFix.fixLoginIssue).not.toHaveBeenCalled();
      
      // Không nên chuyển hướng
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('Nên chuyển hướng đến trang đăng nhập khi không có token', async () => {
    // Giả lập không có token
    (Cookies.get as jest.Mock).mockReturnValue(null);
    
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).toHaveBeenCalled();
      
      // Nên chuyển hướng đến trang đăng nhập
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
    });
  });

  test('Nên sửa vấn đề đăng nhập khi có token', async () => {
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).toHaveBeenCalled();
      
      // Nên gọi fixLoginIssue
      expect(authFix.fixLoginIssue).toHaveBeenCalled();
      
      // Không nên chuyển hướng khi sửa thành công
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('Nên chuyển hướng đến trang đăng nhập khi không thể sửa vấn đề đăng nhập', async () => {
    // Giả lập không thể sửa vấn đề đăng nhập
    (authFix.fixLoginIssue as jest.Mock).mockResolvedValue(false);
    
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).toHaveBeenCalled();
      
      // Nên gọi fixLoginIssue
      expect(authFix.fixLoginIssue).toHaveBeenCalled();
      
      // Nên chuyển hướng đến trang đăng nhập
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
    });
  });

  test('Nên xử lý lỗi 404 khi endpoint không tồn tại', async () => {
    // Giả lập lỗi 404
    (authFix.fixLoginIssue as jest.Mock).mockRejectedValue({
      response: { status: 404 }
    });
    
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).toHaveBeenCalled();
      
      // Nên gọi fixLoginIssue
      expect(authFix.fixLoginIssue).toHaveBeenCalled();
      
      // Không nên chuyển hướng khi lỗi 404
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('Nên xử lý lỗi 401 và thử làm mới token', async () => {
    // Giả lập lỗi 401
    (authFix.fixLoginIssue as jest.Mock).mockRejectedValue({
      response: { status: 401 }
    });
    
    // Giả lập API refresh token thành công
    (axios.post as jest.Mock).mockResolvedValue({
      data: { token: 'new-test-token' }
    });
    
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).toHaveBeenCalled();
      
      // Nên gọi fixLoginIssue
      expect(authFix.fixLoginIssue).toHaveBeenCalled();
      
      // Nên gọi setAuthTokenFixed với token mới
      expect(authFix.setAuthTokenFixed).toHaveBeenCalledWith('new-test-token');
      
      // Không nên chuyển hướng khi làm mới token thành công
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('Nên xử lý lỗi khi làm mới token thất bại', async () => {
    // Giả lập lỗi 401
    (authFix.fixLoginIssue as jest.Mock).mockRejectedValue({
      response: { status: 401 }
    });
    
    // Giả lập API refresh token thất bại
    (axios.post as jest.Mock).mockRejectedValue({
      response: { status: 401 }
    });
    
    render(<TokenChecker />);
    
    // Đợi và kiểm tra
    await waitFor(() => {
      // Nên gọi checkAndRestoreToken
      expect(authFix.checkAndRestoreToken).toHaveBeenCalled();
      
      // Nên gọi fixLoginIssue
      expect(authFix.fixLoginIssue).toHaveBeenCalled();
      
      // Nên xóa token
      expect(Cookies.remove).toHaveBeenCalled();
      
      // Nên chuyển hướng đến trang đăng nhập
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
    });
  });
}); 