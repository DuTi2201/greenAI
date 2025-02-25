#!/bin/bash

# Script để cài đặt các dependencies cần thiết cho việc kiểm tra

echo "=== Cài đặt các dependencies cho việc kiểm tra ==="

# Cài đặt các dependencies cho Jest
echo "Cài đặt Jest và các dependencies liên quan..."
npm install --save-dev jest jest-environment-jsdom @swc/jest

# Cài đặt các dependencies cho Testing Library
echo "Cài đặt Testing Library và các dependencies liên quan..."
npm install --save-dev @testing-library/react @testing-library/jest-dom @types/testing-library__react

# Cài đặt các dependencies cho mock
echo "Cài đặt các dependencies cho mock..."
npm install --save-dev axios-mock-adapter

# Cài đặt các dependencies cho TypeScript
echo "Cài đặt các dependencies cho TypeScript..."
npm install --save-dev @types/jest

# Kiểm tra xem các file cấu hình đã tồn tại chưa
if [ ! -f "jest.config.js" ]; then
  echo "Tạo file jest.config.js..."
  cat > jest.config.js << 'EOL'
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/providers/(.*)$': '<rootDir>/providers/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};
EOL
fi

if [ ! -f "jest.setup.js" ]; then
  echo "Tạo file jest.setup.js..."
  cat > jest.setup.js << 'EOL'
import '@testing-library/jest-dom';

// Mock cho next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock cho window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock cho IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock cho localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock cho sessionStorage
const sessionStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});
EOL
fi

# Cập nhật package.json để thêm các script test
echo "Cập nhật package.json để thêm các script test..."
if ! grep -q '"test":' package.json; then
  # Sử dụng sed để thêm script test vào package.json
  sed -i '' 's/"scripts": {/"scripts": {\n    "test": "jest",\n    "test:watch": "jest --watch",\n    "test:coverage": "jest --coverage",/g' package.json
fi

echo "=== Hoàn thành cài đặt các dependencies cho việc kiểm tra ==="
echo "Bạn có thể chạy các bài kiểm tra bằng lệnh: npm test" 