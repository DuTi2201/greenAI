module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.e2e.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/e2e/setup.ts'],
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}; 