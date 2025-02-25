# Hướng dẫn kiểm tra chức năng xác thực

File này chứa hướng dẫn để chạy các bài kiểm tra cho chức năng xác thực trong ứng dụng GardenAI.

## Cài đặt các dependencies cần thiết

Trước khi chạy các bài kiểm tra, bạn cần cài đặt các dependencies cần thiết:

```bash
npm install --save-dev axios-mock-adapter @testing-library/jest-dom @testing-library/react jest jest-environment-jsdom
```

## Chạy các bài kiểm tra

### Chạy tất cả các bài kiểm tra

```bash
npm test
```

### Chạy các bài kiểm tra cụ thể

```bash
# Kiểm tra chức năng xác thực
npm test -- -t "Kiểm tra chức năng xác thực"

# Kiểm tra API interceptors
npm test -- -t "API Interceptors"

# Kiểm tra luồng xác thực
npm test -- -t "Kiểm tra luồng xác thực"

# Kiểm tra AuthService
npm test -- -t "AuthService"
```

### Chạy script kiểm tra tự động

Chúng tôi đã cung cấp một script để chạy tất cả các bài kiểm tra liên quan đến xác thực:

```bash
chmod +x ./test-auth.sh
./test-auth.sh
```

## Các bài kiểm tra đã triển khai

### 1. Kiểm tra chức năng xác thực (`auth.test.ts`)

- Kiểm tra đăng nhập thành công
- Kiểm tra thiết lập token
- Kiểm tra lấy CSRF token
- Kiểm tra xác thực token
- Kiểm tra đăng xuất

### 2. Kiểm tra API interceptors (`api-interceptors.test.ts`)

- Kiểm tra thêm token vào header
- Kiểm tra thêm CSRF token vào header
- Kiểm tra làm mới token khi nhận lỗi 401
- Kiểm tra xóa token và chuyển hướng khi refresh token thất bại
- Kiểm tra lấy và lưu CSRF token

### 3. Kiểm tra luồng xác thực (`auth-flow.test.ts`)

- Kiểm tra đăng nhập thành công và chuyển hướng
- Kiểm tra đăng nhập thất bại và hiển thị thông báo lỗi
- Kiểm tra truy cập trang yêu cầu xác thực khi đã đăng nhập
- Kiểm tra truy cập trang yêu cầu xác thực khi chưa đăng nhập

### 4. Kiểm tra AuthService (`auth-service.test.ts`)

- Kiểm tra đăng nhập
- Kiểm tra đăng ký
- Kiểm tra xác thực token
- Kiểm tra làm mới token
- Kiểm tra đăng xuất
- Kiểm tra kiểm tra xác thực

## Sửa lỗi phổ biến

### Lỗi "Cannot find module 'axios-mock-adapter'"

Cài đặt dependency thiếu:

```bash
npm install --save-dev axios-mock-adapter
```

### Lỗi "Cannot find module '@testing-library/jest-dom'"

Cài đặt dependency thiếu:

```bash
npm install --save-dev @testing-library/jest-dom
```

### Lỗi "ReferenceError: React is not defined"

Đảm bảo bạn đã import React trong các file test:

```typescript
import React from 'react';
```

### Lỗi "TypeError: window.matchMedia is not a function"

Đảm bảo bạn đã thiết lập mock cho window.matchMedia trong file jest.setup.js:

```javascript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Cấu trúc thư mục kiểm tra

```
frontend/
├── __tests__/
│   ├── auth.test.ts
│   ├── api-interceptors.test.ts
│   ├── auth-flow.test.ts
│   ├── auth-service.test.ts
│   └── token-checker.test.tsx
├── jest.config.js
└── jest.setup.js
```

## Tài liệu tham khảo

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Axios Mock Adapter](https://github.com/ctimmerm/axios-mock-adapter) 