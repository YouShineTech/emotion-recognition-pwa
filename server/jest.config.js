// Jest configuration for server-side tests
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/shared/(.*)$': '<rootDir>/../shared/$1',
  },

  // Test file patterns
  testMatch: ['<rootDir>/src/**/__tests__/**/*.(ts|js)', '<rootDir>/src/**/*.(test|spec).(ts|js)'],

  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/setupTests.ts',
    '!src/index.ts', // Entry point, tested via integration
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
};
